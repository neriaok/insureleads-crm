import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pool } from './pool.js';
import {
  createMigrationsTable,
  insertAppliedMigration,
  listAppliedMigrations,
} from './queries/migrationQueries.js';

// ES modules have no __dirname; import.meta.dirname is the folder of this file.
const migrationsDir = path.join(import.meta.dirname, 'migrations');

async function runMigrations(): Promise<void> {
  // One client for the whole run, because BEGIN/COMMIT must happen on the same connection.
  const client = await pool.connect();
  try {
    await createMigrationsTable(client);
    const applied = new Set(await listAppliedMigrations(client));

    // Numbered file names (001_, 002_, ...) make alphabetical order the run order.
    const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = await readFile(path.join(migrationsDir, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await insertAppliedMigration(client, file);
        await client.query('COMMIT');
        console.log(`Applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        const reason = err instanceof Error ? err.message : String(err);
        throw new Error(`Migration ${file} failed and was rolled back: ${reason}`);
      }
    }

    console.log('Migrations are up to date');
  } finally {
    client.release();
    await pool.end();
  }
}

await runMigrations();
