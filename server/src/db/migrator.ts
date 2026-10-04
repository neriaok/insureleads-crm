import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pool } from './pool.js';
import {
  createMigrationsTable,
  insertAppliedMigration,
  listAppliedMigrations,
} from './queries/migrationQueries.js';

// ES modules have no __dirname; import.meta.dirname is the folder of this file.
// The build copies the .sql files next to the compiled code, so this works from src and dist.
const migrationsDir = path.join(import.meta.dirname, 'migrations');

// Applies every migration file that has not run yet, in file-name order.
// Returns the names of the files applied in this run.
export async function runMigrations(): Promise<string[]> {
  // One client for the whole run, because BEGIN/COMMIT must happen on the same connection.
  const client = await pool.connect();
  const appliedNow: string[] = [];
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
        appliedNow.push(file);
      } catch (err) {
        await client.query('ROLLBACK');
        const reason = err instanceof Error ? err.message : String(err);
        throw new Error(`Migration ${file} failed and was rolled back: ${reason}`);
      }
    }
    return appliedNow;
  } finally {
    client.release();
  }
}
