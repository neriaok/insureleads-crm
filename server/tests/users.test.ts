import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import type { User } from '../src/types/models.js';
import { createTestUser, loginAs, resetDatabase } from './helpers.js';

const newAgent = { name: 'Dana Levi', email: 'dana@test.dev', password: 'Agent-password-1', role: 'agent' };

describe('users', () => {
  let admin: User;
  let agent: User;

  beforeEach(async () => {
    await resetDatabase();
    admin = await createTestUser('admin');
    agent = await createTestUser('agent');
  });

  afterAll(async () => {
    await pool.end();
  });

  it('lets an admin list users without exposing password hashes', async () => {
    const session = await loginAs(admin);
    const res = await session.get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    for (const user of res.body.data) {
      expect(user).not.toHaveProperty('passwordHash');
    }
  });

  it('lets an admin create an agent who can then log in', async () => {
    const session = await loginAs(admin);
    const res = await session.post('/api/users').send(newAgent);

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(expect.objectContaining({ name: 'Dana Levi', role: 'agent' }));

    const login = await request(app).post('/api/auth/login').send({ email: newAgent.email, password: newAgent.password });
    expect(login.status).toBe(200);
  });

  it('returns 409 for a duplicate email', async () => {
    const session = await loginAs(admin);
    await session.post('/api/users').send(newAgent);
    const res = await session.post('/api/users').send({ ...newAgent, email: 'DANA@test.dev' });
    expect(res.status).toBe(409);
  });

  it('validates the body', async () => {
    const session = await loginAs(admin);
    const res = await session.post('/api/users').send({ ...newAgent, password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/);
  });

  it('forbids agents and anonymous users', async () => {
    const agentSession = await loginAs(agent);
    expect((await agentSession.get('/api/users')).status).toBe(403);
    expect((await agentSession.post('/api/users').send(newAgent)).status).toBe(403);
    expect((await request(app).get('/api/users')).status).toBe(401);
  });
});
