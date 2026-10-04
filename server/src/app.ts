import cookieParser from 'cookie-parser';
import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/authRoutes.js';
import { userRoutes } from './routes/userRoutes.js';

// Builds the Express app without starting it, so tests can use it directly.
export const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
