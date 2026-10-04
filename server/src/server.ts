import { app } from './app.js';
import { config } from './config.js';
import { checkDatabaseConnection } from './db/pool.js';

// Fail fast: do not accept requests if the database is unreachable.
await checkDatabaseConnection();
console.log('Connected to PostgreSQL');

app.listen(config.port, () => {
  console.log(`InsureLeads server listening on http://localhost:${config.port}`);
});
