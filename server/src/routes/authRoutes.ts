import { Router } from 'express';
import { getMe, login, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRoutes = Router();

authRoutes.post('/login', asyncHandler(login));
authRoutes.post('/logout', asyncHandler(logout));
authRoutes.get('/me', requireAuth, asyncHandler(getMe));
