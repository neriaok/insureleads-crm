// Runs once before all tests: creates the test database if needed and applies migrations.
import pg from 'pg';
import { applyTestEnv } from './testEnv.js';

export default async function globalSetup(): Promise<void> {
  applyTestEnv();
  const database = process.env.POSTGRES_DB ?? '';

  // Connect to the built-in "postgres" database to create the test database.
  const admin = new pg.Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: 'postgres',
  });
  await admin.connect();
  try {
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (exists.rowCount === 0) {
      // Identifiers cannot be parameters; pg's escapeIdentifier quotes the name safely.
      await admin.query(`CREATE DATABASE ${admin.escapeIdentifier(database)}`);
    }
  } finally {
    await admin.end();
  }

  // Imported after applyTestEnv so config.ts reads the test settings.
  const { runMigrations } = await import('../src/db/migrator.js');
  const { pool } = await import('../src/db/pool.js');
  await runMigrations();
  await pool.end();
}
