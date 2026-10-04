import bcrypt from 'bcrypt';
import type { CookieOptions } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { USER_ROLES, type AuthUser } from '../types/models.js';

export const AUTH_COOKIE_NAME = 'token';
const BCRYPT_ROUNDS = 12;

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProduction,
  path: '/',
};

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function signAuthToken(user: AuthUser): string {
  return jwt.sign({ role: user.role }, config.jwt.secret, {
    subject: String(user.id),
    expiresIn: config.jwt.expiresInSeconds,
  });
}

// Returns the user encoded in a valid token, or null if the token is invalid or expired.
export function verifyAuthToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    if (typeof payload === 'string') return null;

    const id = Number(payload.sub);
    const role = USER_ROLES.find((r) => r === payload.role);
    if (!Number.isInteger(id) || !role) return null;

    return { id, role };
  } catch {
    return null;
  }
}
