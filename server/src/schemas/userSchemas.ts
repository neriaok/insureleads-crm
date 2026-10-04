import { z } from 'zod';
import { USER_ROLES } from '../types/models.js';

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  role: z.enum(USER_ROLES),
});
