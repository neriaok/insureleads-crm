import type { Request, Response } from 'express';
import {
  createLeadOrAddDuplicateNote,
  listLeads as selectLeads,
  updateLeadAgent,
  updateLeadStatus as saveLeadStatus,
} from '../db/queries/leadQueries.js';
import { findUserById } from '../db/queries/userQueries.js';
import { getAuthUser } from '../middleware/auth.js';
import {
  assignLeadSchema,
  createLeadSchema,
  leadIdParamsSchema,
  listLeadsQuerySchema,
  updateLeadStatusSchema,
} from '../schemas/leadSchemas.js';
import type { ApiResponse } from '../types/apiResponse.js';
import type { Lead } from '../types/models.js';
import { ApiError } from '../utils/apiError.js';
import { getAccessibleLead } from '../utils/leadAccess.js';
import { validate } from '../utils/validate.js';

// Public endpoint: the response never reveals data about an existing lead.
export async function createLead(req: Request, res: Response<ApiResponse<{ duplicate: boolean }>>): Promise<void> {
  const body = validate(createLeadSchema, req.body);

  const outcome = await createLeadOrAddDuplicateNote({
    fullName: body.fullName,
    phone: body.phone,
    email: body.email,
    insuranceType: body.insuranceType,
  });

  res.status(outcome.duplicate ? 200 : 201).json({ success: true, data: { duplicate: outcome.duplicate } });
}

export async function listLeads(req: Request, res: Response<ApiResponse<Lead[]>>): Promise<void> {
  const query = validate(listLeadsQuerySchema, req.query);
  const user = getAuthUser(req);

  const leads = await selectLeads({
    status: query.status,
    agentId: user.role === 'agent' ? user.id : undefined,
  });
  res.status(200).json({ success: true, data: leads });
}

export async function getLead(req: Request, res: Response<ApiResponse<Lead>>): Promise<void> {
  const { id } = validate(leadIdParamsSchema, req.params);

  const lead = await getAccessibleLead(id, getAuthUser(req));
  res.status(200).json({ success: true, data: lead });
}

export async function updateLeadStatus(req: Request, res: Response<ApiResponse<Lead>>): Promise<void> {
  const { id } = validate(leadIdParamsSchema, req.params);
  const body = validate(updateLeadStatusSchema, req.body);

  await getAccessibleLead(id, getAuthUser(req));
  // A callback time only makes sense while the lead is in the callback status.
  const callbackAt = body.status === 'callback' && body.callbackAt ? new Date(body.callbackAt) : null;
  const lead = await saveLeadStatus(id, body.status, callbackAt);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }
  res.status(200).json({ success: true, data: lead });
}

export async function assignLead(req: Request, res: Response<ApiResponse<Lead>>): Promise<void> {
  const { id } = validate(leadIdParamsSchema, req.params);
  const { agentId } = validate(assignLeadSchema, req.body);

  if (agentId !== null) {
    const agent = await findUserById(agentId);
    if (!agent || agent.role !== 'agent') {
      throw new ApiError(400, 'agentId must refer to an existing agent');
    }
  }

  const lead = await updateLeadAgent(id, agentId);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }
  res.status(200).json({ success: true, data: lead });
}
