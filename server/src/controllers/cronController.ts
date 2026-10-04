import type { Request, Response } from 'express';
import { config } from '../config.js';
import { createDueRenewals } from '../db/queries/renewalQueries.js';
import type { ApiResponse } from '../types/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { todayInIsrael } from '../utils/dates.js';

// Called once a day by Vercel Cron, which sends "Authorization: Bearer <CRON_SECRET>".
export async function runRenewals(req: Request, res: Response<ApiResponse<{ created: number }>>): Promise<void> {
  if (!config.cronSecret) {
    throw new ApiError(503, 'Cron jobs are not configured');
  }
  if (req.headers.authorization !== `Bearer ${config.cronSecret}`) {
    throw new ApiError(401, 'Invalid cron secret');
  }

  const created = await createDueRenewals(todayInIsrael());
  res.status(200).json({ success: true, data: { created: created.length } });
}
