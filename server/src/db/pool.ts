import pg from 'pg';
import { config } from '../config.js';

// A pool keeps a few open connections and reuses them across requests.
export const pool = new pg.Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

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
