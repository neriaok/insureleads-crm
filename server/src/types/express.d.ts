import type { AuthUser } from './models.js';

declare global {
  namespace Express {
    interface Request {
      // Set by requireAuth for authenticated routes.
      user?: AuthUser;
    }
  }
}

export {};
