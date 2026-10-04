import { createClient } from 'redis';
import { config } from '../config.js';

function createCacheClient(url: string) {
  return createClient({
    url,
    // Fail fast instead of retrying forever if Redis is down.
    socket: { connectTimeout: 2000, reconnectStrategy: false },
  });
}

type RedisClient = ReturnType<typeof createCacheClient>;

let clientPromise: Promise<RedisClient | null> | null = null;

// Connects once, on first use. Returns null when Redis is not configured or unreachable,
// so a cache problem never breaks a request: the caller falls back to the database.
function getClient(): Promise<RedisClient | null> {
  const url = config.redisUrl;
  if (!url) return Promise.resolve(null);

  clientPromise ??= (async () => {
    const client = createCacheClient(url);
    // Without a listener, a connection error would crash the process.
    client.on('error', (err: Error) => console.error('Redis error:', err.message));
    try {
      await client.connect();
      return client;
    } catch {
      console.warn('Redis unavailable, continuing without cache');
      return null;
    }
  })();

  return clientPromise;
}

// Cache-aside: return the cached value if present, otherwise load it and store it for ttlSeconds.
export async function getOrSetCache<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  const client = await getClient();
  if (client?.isReady) {
    try {
      const cached = await client.get(key);
      if (cached !== null) return JSON.parse(cached) as T;
    } catch (err) {
      console.error('Cache read failed:', err instanceof Error ? err.message : err);
    }
  }

  const value = await load();

  if (client?.isReady) {
    try {
      await client.set(key, JSON.stringify(value), { expiration: { type: 'EX', value: ttlSeconds } });
    } catch (err) {
      console.error('Cache write failed:', err instanceof Error ? err.message : err);
    }
  }
  return value;
}

export async function invalidateCache(key: string): Promise<void> {
  const client = await getClient();
  if (!client?.isReady) return;
  try {
    await client.del(key);
  } catch (err) {
    console.error('Cache invalidation failed:', err instanceof Error ? err.message : err);
  }
}

export async function closeCache(): Promise<void> {
  const client = await clientPromise;
  clientPromise = null;
  if (client?.isOpen) await client.quit();
}
