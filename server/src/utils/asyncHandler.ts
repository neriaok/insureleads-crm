import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Forwards any rejected promise from an async handler to the error handler.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
