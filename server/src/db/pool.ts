import pg from 'pg';
import { config } from '../config.js';

// Return DATE columns as plain 'YYYY-MM-DD' strings. By default pg turns them into a
// JavaScript Date at local midnight, which can shift the day when serialized to UTC.
const DATE_OID = 1082;
pg.types.setTypeParser(DATE_OID, (value) => value);

// A pool keeps a few open connections and reuses them across requests.
export const pool = new pg.Pool(config.db);

// An idle connection can fail (for example if the database restarts).
// Without this listener the error would crash the whole process.
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

// Opens and releases one connection to verify the database is reachable.
export async function checkDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  client.release();
}
