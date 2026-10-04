import { config } from './config.js';

// Temporary entry point: verifies that config loads.
// It will start the Express app once app.ts exists.
console.log(`InsureLeads server starting on port ${config.port}`);
console.log(`Database: ${config.db.user}@${config.db.host}:${config.db.port}/${config.db.database}`);
