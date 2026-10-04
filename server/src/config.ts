// Reads and validates all environment variables once, at startup.
// The rest of the server imports `config` and never touches process.env.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requireEnvNumber(name: string): number {
  const raw = requireEnv(name);
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer, got "${raw}"`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';

// Hosted databases (Neon, Vercel Postgres, ...) provide one connection string; locally
// the separate POSTGRES_* variables are shared with docker-compose.
function readDatabaseConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    return { connectionString };
  }
  return {
    host: requireEnv('POSTGRES_HOST'),
    port: requireEnvNumber('POSTGRES_PORT'),
    user: requireEnv('POSTGRES_USER'),
    password: requireEnv('POSTGRES_PASSWORD'),
    database: requireEnv('POSTGRES_DB'),
  };
}

export const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  // bcrypt is slow on purpose; tests use the minimum cost so the suite stays fast.
  bcryptRounds: nodeEnv === 'test' ? 4 : 12,
  // Only used by server.ts; serverless platforms do not need a port.
  port: process.env.PORT ? requireEnvNumber('PORT') : 4000,
  db: readDatabaseConfig(),
  // Optional: when unset, caching is disabled and every request reads from PostgreSQL.
  redisUrl: process.env.REDIS_URL || null,
  // Shared secret that Vercel Cron sends as a Bearer token. When unset, the cron endpoint is disabled.
  cronSecret: process.env.CRON_SECRET || null,
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresInSeconds: 8 * 60 * 60,
  },
} as const;
