import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import type { User } from '../src/types/models.js';
import { createTestUser, loginAs, resetDatabase, validLead } from './helpers.js';

describe('notes', () => {
  let agent: User;
  let otherAgent: User;
  let leadId: number;

  beforeEach(async () => {
    await resetDatabase();
    agent = await createTestUser('agent', 'Agent One');
    otherAgent = await createTestUser('agent', 'Agent Two');
    await request(app).post('/api/leads').send(validLead());
    const lead = await pool.query<{ id: number }>('UPDATE leads SET agent_id = $1 RETURNING id', [agent.id]);
    leadId = lead.rows[0]?.id ?? 0;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('lets the assigned agent add notes and lists them newest first', async () => {
    const session = await loginAs(agent);
    const first = await session.post(`/api/leads/${leadId}/notes`).send({ content: 'First call' });
    await session.post(`/api/leads/${leadId}/notes`).send({ content: 'Second call' });

    expect(first.status).toBe(201);
    expect(first.body.data).toEqual(expect.objectContaining({ authorId: agent.id, authorName: 'Agent One' }));

    const list = await session.get(`/api/leads/${leadId}/notes`);
    expect(list.status).toBe(200);
    expect(list.body.data.map((note: { content: string }) => note.content)).toEqual(['Second call', 'First call']);
  });

  it('rejects an empty note', async () => {
    const session = await loginAs(agent);
    const res = await session.post(`/api/leads/${leadId}/notes`).send({ content: '   ' });
    expect(res.status).toBe(400);
  });

  it('hides notes from agents who are not assigned to the lead', async () => {
    const session = await loginAs(otherAgent);
    expect((await session.get(`/api/leads/${leadId}/notes`)).status).toBe(403);
    expect((await session.post(`/api/leads/${leadId}/notes`).send({ content: 'Hi' })).status).toBe(403);
  });
});
