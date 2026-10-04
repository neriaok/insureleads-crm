import express from 'express';

// Builds the Express app without starting it, so tests can use it directly.
export const app = express();

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});
