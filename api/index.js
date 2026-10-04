// Vercel serverless entry point: every /api/* request is rewritten here (see vercel.json)
// and handled by the same Express app that server.ts runs locally.
export { app as default } from '../server/dist/app.js';
