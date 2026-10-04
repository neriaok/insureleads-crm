import type { Request, Response } from 'express';
import { insertNote, listNotesByLead } from '../db/queries/noteQueries.js';
import { getAuthUser } from '../middleware/auth.js';
import { leadIdParamsSchema } from '../schemas/leadSchemas.js';
import { createNoteSchema } from '../schemas/noteSchemas.js';
import type { ApiResponse } from '../types/apiResponse.js';
import type { LeadNote } from '../types/models.js';
import { getAccessibleLead } from '../utils/leadAccess.js';
import { validate } from '../utils/validate.js';

export async function listNotes(req: Request, res: Response<ApiResponse<LeadNote[]>>): Promise<void> {
  const { id } = validate(leadIdParamsSchema, req.params);

  await getAccessibleLead(id, getAuthUser(req));
  const notes = await listNotesByLead(id);
  res.status(200).json({ success: true, data: notes });
}

export async function createNote(req: Request, res: Response<ApiResponse<LeadNote>>): Promise<void> {
  const { id } = validate(leadIdParamsSchema, req.params);
  const { content } = validate(createNoteSchema, req.body);
  const user = getAuthUser(req);

  await getAccessibleLead(id, user);
  const note = await insertNote(id, user.id, content);
  res.status(201).json({ success: true, data: note });
}
