import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import type { User } from '../src/types/models.js';
import { createTestUser, loginAs, resetDatabase, TEST_PASSWORD } from './helpers.js';

describe('auth', () => {
  let admin: User;

  beforeEach(async () => {
    await resetDatabase();
    admin = await createTestUser('admin');
  });

  afterAll(async () => {
    await pool.end();
  });

  it('logs in with valid credentials and sets an httpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: admin.email, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: expect.objectContaining({ id: admin.id, role: 'admin' }) });
    expect(res.body.data).not.toHaveProperty('passwordHash');
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/^token=/);
    expect(cookie).toMatch(/HttpOnly/);
  });

  it('accepts the email in any letter case', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email.toUpperCase(), password: TEST_PASSWORD });
    expect(res.status).toBe(200);
  });

  it('rejects a wrong password with the same message as an unknown email', async () => {
    const wrongPassword = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'nope' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.dev', password: TEST_PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error).toBe(unknownEmail.body.error);
  });

  it('returns 400 for a missing password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: admin.email });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: 'Invalid request body' });
  });

  it('returns the current user from /me and 401 without a cookie', async () => {
    const agent = await loginAs(admin);
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(admin.email);

    const anonymous = await request(app).get('/api/auth/me');
    expect(anonymous.status).toBe(401);
  });

  it('rejects a tampered token', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'token=not-a-real-jwt');
    expect(res.status).toBe(401);
  });

  it('logs out by clearing the cookie', async () => {
    const agent = await loginAs(admin);
    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(204);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });

  it('returns the uniform error shape for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
