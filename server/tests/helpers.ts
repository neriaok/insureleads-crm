import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { insertUser } from '../src/db/queries/userQueries.js';
import type { User, UserRole } from '../src/types/models.js';
import { hashPassword } from '../src/utils/auth.js';

export const TEST_PASSWORD = 'Test-password-1';

export async function resetDatabase(): Promise<void> {
  await pool.query('TRUNCATE lead_notes, leads, users RESTART IDENTITY CASCADE');
}

export async function createTestUser(role: UserRole, name = `Test ${role}`): Promise<User> {
  return insertUser({
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@test.dev`,
    passwordHash: await hashPassword(TEST_PASSWORD),
    role,
  });
}

// Returns a Supertest agent that keeps the auth cookie between requests.
export async function loginAs(user: User) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email: user.email, password: TEST_PASSWORD });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${user.email}: ${res.status}`);
  }
  return agent;
}

export function validLead(overrides: Record<string, unknown> = {}) {
  return {
    fullName: 'Moshe Cohen',
    phone: '050-1234567',
    email: 'moshe@example.com',
    insuranceType: 'car',
    consent: true,
    ...overrides,
  };
}
