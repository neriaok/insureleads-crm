import type { PoolClient } from 'pg';

// Bookkeeping table: one row per migration file that has already been applied.
export async function createMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

export async function listAppliedMigrations(client: PoolClient): Promise<string[]> {
  const result = await client.query<{ name: string }>('SELECT name FROM schema_migrations');
  return result.rows.map((row) => row.name);
}

export async function insertAppliedMigration(client: PoolClient, name: string): Promise<void> {
  await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
}
