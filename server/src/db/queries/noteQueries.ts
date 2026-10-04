import type { LeadNote } from '../../types/models.js';
import { pool } from '../pool.js';

const NOTE_COLUMNS = `
  n.id,
  n.lead_id AS "leadId",
  n.author_id AS "authorId",
  u.name AS "authorName",
  n.content,
  n.created_at AS "createdAt"`;

export async function listNotesByLead(leadId: number): Promise<LeadNote[]> {
  const result = await pool.query<LeadNote>(
    `SELECT ${NOTE_COLUMNS} FROM lead_notes n LEFT JOIN users u ON u.id = n.author_id
     WHERE n.lead_id = $1
     ORDER BY n.created_at DESC, n.id DESC`,
    [leadId],
  );
  return result.rows;
}

export async function insertNote(leadId: number, authorId: number, content: string): Promise<LeadNote> {
  const result = await pool.query<LeadNote>(
    `WITH n AS (
       INSERT INTO lead_notes (lead_id, author_id, content) VALUES ($1, $2, $3) RETURNING *
     )
     SELECT ${NOTE_COLUMNS} FROM n LEFT JOIN users u ON u.id = n.author_id`,
    [leadId, authorId, content],
  );
  const note = result.rows[0];
  if (!note) {
    throw new Error('INSERT INTO lead_notes returned no row');
  }
  return note;
}
