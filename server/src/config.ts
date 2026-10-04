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

export const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  // bcrypt is slow on purpose; tests use the minimum cost so the suite stays fast.
  bcryptRounds: nodeEnv === 'test' ? 4 : 12,
  port: requireEnvNumber('PORT'),
  db: {
    host: requireEnv('POSTGRES_HOST'),
    port: requireEnvNumber('POSTGRES_PORT'),
    user: requireEnv('POSTGRES_USER'),
    password: requireEnv('POSTGRES_PASSWORD'),
    database: requireEnv('POSTGRES_DB'),
  },
  // Optional: when unset, caching is disabled and every request reads from PostgreSQL.
  redisUrl: process.env.REDIS_URL || null,
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresInSeconds: 8 * 60 * 60,
  },
} as const;
