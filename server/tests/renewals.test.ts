import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { createDueRenewals } from '../src/db/queries/renewalQueries.js';
import type { User } from '../src/types/models.js';
import { createTestUser, loginAs, resetDatabase, validLead } from './helpers.js';

const TODAY = '2026-10-04';

// Creates a won lead directly in the database with the given policy end date.
async function insertWonLead(agentId: number, insuranceType: string, policyEndDate: string): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO leads (full_name, phone, insurance_type, status, agent_id, consent_at, policy_end_date)
     VALUES ('Moshe Cohen', '0501234567', $1, 'won', $2, now(), $3)
     RETURNING id`,
    [insuranceType, agentId, policyEndDate],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Insert failed');
  return row.id;
}

describe('renewals', () => {
  let agent: User;

  beforeEach(async () => {
    await resetDatabase();
    agent = await createTestUser('agent', 'Agent One');
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('marking a lead as won', () => {
    async function createAssignedLead(insuranceType: string): Promise<number> {
      await request(app).post('/api/leads').send(validLead({ insuranceType }));
      const lead = await pool.query<{ id: number }>('UPDATE leads SET agent_id = $1 RETURNING id', [agent.id]);
      return lead.rows[0]?.id ?? 0;
    }

    it('requires a policy end date for car and home insurance', async () => {
      const leadId = await createAssignedLead('car');
      const session = await loginAs(agent);

      const missing = await session.patch(`/api/leads/${leadId}/status`).send({ status: 'won' });
      expect(missing.status).toBe(400);
      expect(missing.body.error).toMatch(/policyEndDate/);

      const won = await session.patch(`/api/leads/${leadId}/status`).send({ status: 'won', policyEndDate: '2027-10-01' });
      expect(won.status).toBe(200);
      // Returned exactly as stored, with no timezone shift.
      expect(won.body.data.policyEndDate).toBe('2027-10-01');
    });

    it('does not require a policy end date for travel insurance', async () => {
      const leadId = await createAssignedLead('travel');
      const session = await loginAs(agent);
      const res = await session.patch(`/api/leads/${leadId}/status`).send({ status: 'won' });
      expect(res.status).toBe(200);
      expect(res.body.data.policyEndDate).toBeNull();
    });

    it('rejects an invalid date', async () => {
      const leadId = await createAssignedLead('home');
      const session = await loginAs(agent);
      const res = await session.patch(`/api/leads/${leadId}/status`).send({ status: 'won', policyEndDate: '01/10/2027' });
      expect(res.status).toBe(400);
    });
  });

  describe('createDueRenewals', () => {
    it('creates a renewal lead, with the same agent, for a policy ending within 45 days', async () => {
      const originalId = await insertWonLead(agent.id, 'car', '2026-11-10');

      const created = await createDueRenewals(TODAY);

      expect(created).toHaveLength(1);
      const renewal = await pool.query<{ status: string; agent_id: number; renewal_of_lead_id: number }>(
        'SELECT status, agent_id, renewal_of_lead_id FROM leads WHERE id = $1',
        [created[0]?.renewalLeadId],
      );
      expect(renewal.rows[0]).toEqual({ status: 'new', agent_id: agent.id, renewal_of_lead_id: originalId });

      const notes = await pool.query<{ content: string }>('SELECT content FROM lead_notes WHERE lead_id = $1', [
        created[0]?.renewalLeadId,
      ]);
      expect(notes.rows[0]?.content).toMatch(/2026-11-10/);
    });

    it('is safe to run twice on the same day', async () => {
      await insertWonLead(agent.id, 'home', '2026-10-20');
      await createDueRenewals(TODAY);
      const secondRun = await createDueRenewals(TODAY);

      expect(secondRun).toHaveLength(0);
      const count = await pool.query<{ count: string }>('SELECT count(*) FROM leads WHERE renewal_of_lead_id IS NOT NULL');
      expect(Number(count.rows[0]?.count)).toBe(1);
    });

    it('skips policies that end later, already ended, or are not renewable', async () => {
      await insertWonLead(agent.id, 'car', '2027-03-01'); // too far ahead
      await insertWonLead(agent.id, 'car', '2026-09-01'); // already ended
      await insertWonLead(agent.id, 'travel', '2026-10-20'); // not an annual policy

      expect(await createDueRenewals(TODAY)).toHaveLength(0);
    });
  });

  describe('GET /api/cron/renewals', () => {
    it('rejects requests without the cron secret', async () => {
      const missing = await request(app).get('/api/cron/renewals');
      const wrong = await request(app).get('/api/cron/renewals').set('Authorization', 'Bearer nope');
      expect(missing.status).toBe(401);
      expect(wrong.status).toBe(401);
    });

    it('runs the job with the correct secret', async () => {
      const res = await request(app).get('/api/cron/renewals').set('Authorization', 'Bearer test-cron-secret');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('created');
    });
  });
});
