import { Router } from 'express';
import { runRenewals } from '../controllers/cronController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const cronRoutes = Router();

cronRoutes.get('/renewals', asyncHandler(runRenewals));
