// Points the server at a separate test database and disables the cache,
// so tests never touch development data and results do not depend on Redis.
export function applyTestEnv(): void {
  const devDatabase = process.env.POSTGRES_DB ?? 'insureleads';
  process.env.POSTGRES_DB =
    process.env.POSTGRES_TEST_DB ?? (devDatabase.endsWith('_test') ? devDatabase : `${devDatabase}_test`);
  process.env.NODE_ENV = 'test';
  delete process.env.REDIS_URL;
  delete process.env.DATABASE_URL;
}
