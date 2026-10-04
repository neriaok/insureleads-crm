import type { InsuranceType, Lead, LeadStatus } from '../../types/models.js';
import { pool } from '../pool.js';
import { withTransaction } from '../transaction.js';

// Selects a lead with its agent's name. `l` must be a leads row (table or CTE).
const LEAD_COLUMNS = `
  l.id,
  l.full_name AS "fullName",
  l.phone,
  l.email,
  l.insurance_type AS "insuranceType",
  l.status,
  l.agent_id AS "agentId",
  u.name AS "agentName",
  l.consent_at AS "consentAt",
  l.callback_at AS "callbackAt",
  l.policy_end_date AS "policyEndDate",
  l.renewal_of_lead_id AS "renewalOfLeadId",
  l.created_at AS "createdAt",
  l.updated_at AS "updatedAt"`;

export async function findLeadById(id: number): Promise<Lead | null> {
  const result = await pool.query<Lead>(
    `SELECT ${LEAD_COLUMNS} FROM leads l LEFT JOIN users u ON u.id = l.agent_id WHERE l.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listLeads(filters: { agentId?: number; status?: LeadStatus }): Promise<Lead[]> {
  // Only fixed condition strings are concatenated; every value goes through a $n parameter.
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters.agentId !== undefined) {
    params.push(filters.agentId);
    conditions.push(`l.agent_id = $${params.length}`);
  }
  if (filters.status !== undefined) {
    params.push(filters.status);
    conditions.push(`l.status = $${params.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query<Lead>(
    `SELECT ${LEAD_COLUMNS} FROM leads l LEFT JOIN users u ON u.id = l.agent_id
     ${where}
     ORDER BY l.created_at DESC`,
    params,
  );
  return result.rows;
}

export interface NewLeadInput {
  fullName: string;
  phone: string;
  email: string | null;
  insuranceType: InsuranceType;
}

export interface LeadSubmissionOutcome {
  duplicate: boolean;
  leadId: number;
}

// Duplicate rule: if an open lead (not won/lost) with the same phone exists,
// add a system note to it instead of creating a new lead.
export async function createLeadOrAddDuplicateNote(input: NewLeadInput): Promise<LeadSubmissionOutcome> {
  return withTransaction(async (client) => {
    // Serializes concurrent submissions for the same phone until this transaction ends,
    // so two simultaneous requests cannot both create a lead.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [input.phone]);

    const existing = await client.query<{ id: number }>(
      `SELECT id FROM leads
       WHERE phone = $1 AND status NOT IN ('won', 'lost')
       ORDER BY created_at DESC
       LIMIT 1`,
      [input.phone],
    );
    const existingLead = existing.rows[0];

    if (existingLead) {
      const content =
        `Duplicate submission from the lead form: ${input.fullName}, ` +
        `insurance type: ${input.insuranceType}` +
        (input.email ? `, email: ${input.email}` : '');
      await client.query('INSERT INTO lead_notes (lead_id, author_id, content) VALUES ($1, NULL, $2)', [
        existingLead.id,
        content,
      ]);
      return { duplicate: true, leadId: existingLead.id };
    }

    const inserted = await client.query<{ id: number }>(
      `INSERT INTO leads (full_name, phone, email, insurance_type, consent_at)
       VALUES ($1, $2, $3, $4, now())
       RETURNING id`,
      [input.fullName, input.phone, input.email, input.insuranceType],
    );
    const lead = inserted.rows[0];
    if (!lead) {
      throw new Error('INSERT INTO leads returned no row');
    }
    return { duplicate: false, leadId: lead.id };
  });
}

export async function updateLeadStatus(
  id: number,
  status: LeadStatus,
  callbackAt: Date | null,
  policyEndDate: string | null,
): Promise<Lead | null> {
  const result = await pool.query<Lead>(
    `WITH l AS (
       UPDATE leads SET status = $2, callback_at = $3, policy_end_date = $4 WHERE id = $1 RETURNING *
     )
     SELECT ${LEAD_COLUMNS} FROM l LEFT JOIN users u ON u.id = l.agent_id`,
    [id, status, callbackAt, policyEndDate],
  );
  return result.rows[0] ?? null;
}

export async function updateLeadAgent(id: number, agentId: number | null): Promise<Lead | null> {
  const result = await pool.query<Lead>(
    `WITH l AS (
       UPDATE leads SET agent_id = $2 WHERE id = $1 RETURNING *
     )
     SELECT ${LEAD_COLUMNS} FROM l LEFT JOIN users u ON u.id = l.agent_id`,
    [id, agentId],
  );
  return result.rows[0] ?? null;
}
