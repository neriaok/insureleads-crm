// Temporary entry point to verify the TypeScript toolchain.
// It will start the Express app once app.ts exists.
console.log(`InsureLeads server starting on Node ${process.version}`);
console.log(`POSTGRES_DB from .env: ${process.env.POSTGRES_DB ?? '(not set)'}`);
