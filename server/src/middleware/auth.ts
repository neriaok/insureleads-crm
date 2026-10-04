import type { NextFunction, Request, Response } from 'express';
import type { AuthUser, UserRole } from '../types/models.js';
import { ApiError } from '../utils/apiError.js';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '../utils/auth.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token: unknown = req.cookies?.[AUTH_COOKIE_NAME];
  const user = typeof token === 'string' ? verifyAuthToken(token) : null;
  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }
  req.user = user;
  next();
}

// Must run after requireAuth.
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }
    next();
  };
}

// For controllers behind requireAuth: returns req.user with a non-optional type.
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }
  return req.user;
}
