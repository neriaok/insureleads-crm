import type { Request, Response } from 'express';
import { findUserByEmail, insertUser, listUsers as selectUsers } from '../db/queries/userQueries.js';
import { createUserSchema } from '../schemas/userSchemas.js';
import type { ApiResponse } from '../types/apiResponse.js';
import type { User } from '../types/models.js';
import { ApiError } from '../utils/apiError.js';
import { hashPassword } from '../utils/auth.js';
import { getOrSetCache, invalidateCache } from '../utils/cache.js';
import { validate } from '../utils/validate.js';

// The users list is read on every dashboard load (agent dropdowns) but changes rarely.
const USERS_CACHE_KEY = 'users:all';
const USERS_CACHE_TTL_SECONDS = 300;

export async function listUsers(_req: Request, res: Response<ApiResponse<User[]>>): Promise<void> {
  const users = await getOrSetCache(USERS_CACHE_KEY, USERS_CACHE_TTL_SECONDS, selectUsers);
  res.status(200).json({ success: true, data: users });
}

export async function createUser(req: Request, res: Response<ApiResponse<User>>): Promise<void> {
  const body = validate(createUserSchema, req.body);

  if (await findUserByEmail(body.email)) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  const user = await insertUser({
    name: body.name,
    email: body.email,
    passwordHash: await hashPassword(body.password),
    role: body.role,
  });
  await invalidateCache(USERS_CACHE_KEY);
  res.status(201).json({ success: true, data: user });
}
