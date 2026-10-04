import { RENEWABLE_INSURANCE_TYPES } from '../../types/models.js';
import { withTransaction } from '../transaction.js';

// How many days before a policy ends its renewal lead is created.
export const RENEWAL_LEAD_DAYS = 45;

export interface CreatedRenewal {
  renewalLeadId: number;
  originalLeadId: number;
  policyEndDate: string;
}

// Creates a renewal lead for every won, renewable policy that ends within RENEWAL_LEAD_DAYS
// (and has not ended yet). The renewal keeps the customer's details and agent.
// Idempotent: the UNIQUE renewal_of_lead_id column skips policies that already have one.
export async function createDueRenewals(today: string): Promise<CreatedRenewal[]> {
  return withTransaction(async (client) => {
    const inserted = await client.query<CreatedRenewal>(
      `WITH due AS (
         SELECT id, full_name, phone, email, insurance_type, agent_id, consent_at, policy_end_date
         FROM leads
         WHERE status = 'won'
           AND insurance_type = ANY($1::text[])
           AND policy_end_date BETWEEN $2::date AND $2::date + $3::int
       ),
       created AS (
         INSERT INTO leads (full_name, phone, email, insurance_type, agent_id, consent_at, renewal_of_lead_id)
         SELECT full_name, phone, email, insurance_type, agent_id, consent_at, id FROM due
         ON CONFLICT (renewal_of_lead_id) DO NOTHING
         RETURNING id, renewal_of_lead_id
       )
       SELECT created.id AS "renewalLeadId",
              created.renewal_of_lead_id AS "originalLeadId",
              due.policy_end_date::text AS "policyEndDate"
       FROM created JOIN due ON due.id = created.renewal_of_lead_id`,
      [RENEWABLE_INSURANCE_TYPES, today, RENEWAL_LEAD_DAYS],
    );

    for (const renewal of inserted.rows) {
      await client.query('INSERT INTO lead_notes (lead_id, author_id, content) VALUES ($1, NULL, $2)', [
        renewal.renewalLeadId,
        `Renewal: the policy from lead #${renewal.originalLeadId} ends on ${renewal.policyEndDate}. ` +
          'Contact the customer before it expires.',
      ]);
    }
    return inserted.rows;
  });
}
