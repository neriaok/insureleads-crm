import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import type { User } from '../src/types/models.js';
import { createTestUser, loginAs, resetDatabase, validLead } from './helpers.js';

async function countLeads(phone: string): Promise<number> {
  const result = await pool.query<{ count: string }>('SELECT count(*) FROM leads WHERE phone = $1', [phone]);
  return Number(result.rows[0]?.count);
}

async function firstLeadId(): Promise<number> {
  const result = await pool.query<{ id: number }>('SELECT id FROM leads ORDER BY id LIMIT 1');
  const row = result.rows[0];
  if (!row) throw new Error('No lead found');
  return row.id;
}

describe('leads', () => {
  let admin: User;
  let agent: User;
  let otherAgent: User;

  beforeEach(async () => {
    await resetDatabase();
    admin = await createTestUser('admin');
    agent = await createTestUser('agent', 'Agent One');
    otherAgent = await createTestUser('agent', 'Agent Two');
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/leads (public form)', () => {
    it('creates a lead and normalizes the phone number', async () => {
      const res = await request(app).post('/api/leads').send(validLead());

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ success: true, data: { duplicate: false } });
      expect(await countLeads('0501234567')).toBe(1);
    });

    it('adds a note to the open lead instead of creating a duplicate', async () => {
      await request(app).post('/api/leads').send(validLead());
      const res = await request(app)
        .post('/api/leads')
        .send(validLead({ fullName: 'Moshe C', phone: '+972 50 123 4567', insuranceType: 'home' }));

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ duplicate: true });
      expect(await countLeads('0501234567')).toBe(1);

      const notes = await pool.query<{ author_id: number | null; content: string }>(
        'SELECT author_id, content FROM lead_notes',
      );
      expect(notes.rows).toHaveLength(1);
      expect(notes.rows[0]?.author_id).toBeNull();
      expect(notes.rows[0]?.content).toMatch(/home/);
    });

    it('creates a new lead when the previous one with that phone is closed', async () => {
      await request(app).post('/api/leads').send(validLead());
      await pool.query("UPDATE leads SET status = 'won'");

      const res = await request(app).post('/api/leads').send(validLead());
      expect(res.status).toBe(201);
      expect(await countLeads('0501234567')).toBe(2);
    });

    it('creates exactly one lead for concurrent submissions of the same phone', async () => {
      const responses = await Promise.all(
        Array.from({ length: 5 }, () => request(app).post('/api/leads').send(validLead())),
      );

      expect(responses.filter((res) => res.status === 201)).toHaveLength(1);
      expect(responses.filter((res) => res.status === 200)).toHaveLength(4);
      expect(await countLeads('0501234567')).toBe(1);
    });

    it.each([
      ['missing consent', { consent: false }, /consent/],
      ['invalid phone', { phone: '123' }, /phone/i],
      ['unknown insurance type', { insuranceType: 'boat' }, /insuranceType/],
      ['invalid email', { email: 'not-an-email' }, /email/],
    ])('rejects %s with 400', async (_name, overrides, message) => {
      const res = await request(app).post('/api/leads').send(validLead(overrides));
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(message);
    });

    it('accepts a lead without an email', async () => {
      const res = await request(app).post('/api/leads').send(validLead({ email: '' }));
      expect(res.status).toBe(201);
    });
  });

  describe('reading leads', () => {
    beforeEach(async () => {
      await request(app).post('/api/leads').send(validLead());
      await request(app).post('/api/leads').send(validLead({ fullName: 'Rina Levi', phone: '0527654321' }));
    });

    it('shows an admin every lead', async () => {
      const session = await loginAs(admin);
      const res = await session.get('/api/leads');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('shows an agent only the leads assigned to them', async () => {
      const leadId = await firstLeadId();
      await pool.query('UPDATE leads SET agent_id = $1 WHERE id = $2', [agent.id, leadId]);

      const session = await loginAs(agent);
      const res = await session.get('/api/leads');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(leadId);
    });

    it('filters by status and validates the filter', async () => {
      const session = await loginAs(admin);
      expect((await session.get('/api/leads?status=won')).body.data).toHaveLength(0);
      expect((await session.get('/api/leads?status=new')).body.data).toHaveLength(2);
      expect((await session.get('/api/leads?status=bogus')).status).toBe(400);
    });

    it('returns 403 when an agent opens a lead that is not theirs, and 404 for a missing lead', async () => {
      const leadId = await firstLeadId();
      await pool.query('UPDATE leads SET agent_id = $1 WHERE id = $2', [otherAgent.id, leadId]);

      const session = await loginAs(agent);
      expect((await session.get(`/api/leads/${leadId}`)).status).toBe(403);
      expect((await session.get('/api/leads/99999')).status).toBe(404);
      expect((await session.get('/api/leads/abc')).status).toBe(400);
    });

    it('requires authentication', async () => {
      expect((await request(app).get('/api/leads')).status).toBe(401);
    });
  });

  describe('PATCH /api/leads/:id/assign', () => {
    it('lets an admin assign a lead to an agent and unassign it', async () => {
      await request(app).post('/api/leads').send(validLead());
      const leadId = await firstLeadId();
      const session = await loginAs(admin);

      const assigned = await session.patch(`/api/leads/${leadId}/assign`).send({ agentId: agent.id });
      expect(assigned.status).toBe(200);
      expect(assigned.body.data).toEqual(expect.objectContaining({ agentId: agent.id, agentName: 'Agent One' }));

      const unassigned = await session.patch(`/api/leads/${leadId}/assign`).send({ agentId: null });
      expect(unassigned.body.data.agentId).toBeNull();
    });

    it('rejects assigning to a non-agent and forbids agents from assigning', async () => {
      await request(app).post('/api/leads').send(validLead());
      const leadId = await firstLeadId();

      const adminSession = await loginAs(admin);
      expect((await adminSession.patch(`/api/leads/${leadId}/assign`).send({ agentId: admin.id })).status).toBe(400);
      expect((await adminSession.patch('/api/leads/99999/assign').send({ agentId: agent.id })).status).toBe(404);

      const agentSession = await loginAs(agent);
      expect((await agentSession.patch(`/api/leads/${leadId}/assign`).send({ agentId: agent.id })).status).toBe(403);
    });
  });

  describe('PATCH /api/leads/:id/status', () => {
    let leadId: number;

    beforeEach(async () => {
      await request(app).post('/api/leads').send(validLead());
      leadId = await firstLeadId();
      await pool.query('UPDATE leads SET agent_id = $1 WHERE id = $2', [agent.id, leadId]);
    });

    it('lets the assigned agent schedule a callback, and clears it on the next status', async () => {
      const session = await loginAs(agent);
      const callback = await session
        .patch(`/api/leads/${leadId}/status`)
        .send({ status: 'callback', callbackAt: '2026-10-06T09:00:00+03:00' });

      expect(callback.status).toBe(200);
      expect(callback.body.data.status).toBe('callback');
      expect(callback.body.data.callbackAt).toBe('2026-10-06T06:00:00.000Z');

      const quote = await session.patch(`/api/leads/${leadId}/status`).send({ status: 'quote_sent' });
      expect(quote.body.data.callbackAt).toBeNull();
    });

    it('requires callbackAt for the callback status', async () => {
      const session = await loginAs(agent);
      const res = await session.patch(`/api/leads/${leadId}/status`).send({ status: 'callback' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/callbackAt/);
    });

    it('updates updated_at through the database trigger', async () => {
      const before = (await pool.query<{ updated_at: Date }>('SELECT updated_at FROM leads WHERE id = $1', [leadId]))
        .rows[0]?.updated_at;
      const session = await loginAs(agent);
      const res = await session.patch(`/api/leads/${leadId}/status`).send({ status: 'in_progress' });
      expect(new Date(res.body.data.updatedAt).getTime()).toBeGreaterThan(before?.getTime() ?? 0);
    });

    it('forbids an agent who is not assigned, but allows an admin', async () => {
      const other = await loginAs(otherAgent);
      expect((await other.patch(`/api/leads/${leadId}/status`).send({ status: 'won' })).status).toBe(403);

      const adminSession = await loginAs(admin);
      expect((await adminSession.patch(`/api/leads/${leadId}/status`).send({ status: 'won' })).status).toBe(200);
    });
  });
});
