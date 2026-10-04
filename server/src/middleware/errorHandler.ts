import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';
import type { ApiResponse } from '../types/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

// Body-parser errors (for example malformed JSON) carry an HTTP status.
function isClientRequestError(err: unknown): err is Error & { status: number } {
  return err instanceof Error && 'status' in err && typeof err.status === 'number' && err.status < 500;
}

// Registered last in app.ts. Turns every error into the uniform failure shape.
export function errorHandler(err: unknown, _req: Request, res: Response<ApiResponse<never>>, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  if (isClientRequestError(err)) {
    res.status(400).json({ success: false, error: 'Invalid request body' });
    return;
  }

  console.error(err);
  const message = !config.isProduction && err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ success: false, error: message });
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(404, `Route not found: ${req.method} ${req.path}`));
}
