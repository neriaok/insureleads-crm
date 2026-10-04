import { Router } from 'express';
import { createUser, listUsers } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const userRoutes = Router();

userRoutes.use(requireAuth, requireRole('admin'));

userRoutes.get('/', asyncHandler(listUsers));
userRoutes.post('/', asyncHandler(createUser));
