// CLI entry point: npm run migrate
import { runMigrations } from './migrator.js';
import { pool } from './pool.js';

try {
  const applied = await runMigrations();
  for (const file of applied) {
    console.log(`Applied ${file}`);
  }
  console.log('Migrations are up to date');
} finally {
  await pool.end();
}
