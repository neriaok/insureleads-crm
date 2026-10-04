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

export const config = {
  port: requireEnvNumber('PORT'),
  db: {
    host: requireEnv('POSTGRES_HOST'),
    port: requireEnvNumber('POSTGRES_PORT'),
    user: requireEnv('POSTGRES_USER'),
    password: requireEnv('POSTGRES_PASSWORD'),
    database: requireEnv('POSTGRES_DB'),
  },
} as const;
