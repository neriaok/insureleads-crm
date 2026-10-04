import type { Request, Response } from 'express';
import { config } from '../config.js';
import { findUserByEmail, findUserById } from '../db/queries/userQueries.js';
import { getAuthUser } from '../middleware/auth.js';
import { loginSchema } from '../schemas/authSchemas.js';
import type { ApiResponse } from '../types/apiResponse.js';
import type { User } from '../types/models.js';
import { ApiError } from '../utils/apiError.js';
import { AUTH_COOKIE_NAME, authCookieOptions, signAuthToken, verifyPassword } from '../utils/auth.js';
import { validate } from '../utils/validate.js';

export async function login(req: Request, res: Response<ApiResponse<User>>): Promise<void> {
  const { email, password } = validate(loginSchema, req.body);

  const found = await findUserByEmail(email);
  // Same message for unknown email and wrong password, so attackers cannot probe for accounts.
  if (!found || !(await verifyPassword(password, found.passwordHash))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const { passwordHash: _passwordHash, ...user } = found;
  res.cookie(AUTH_COOKIE_NAME, signAuthToken(user), {
    ...authCookieOptions,
    maxAge: config.jwt.expiresInSeconds * 1000,
  });
  res.status(200).json({ success: true, data: user });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);
  res.status(204).end();
}

export async function getMe(req: Request, res: Response<ApiResponse<User>>): Promise<void> {
  const user = await findUserById(getAuthUser(req).id);
  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }
  res.status(200).json({ success: true, data: user });
}
