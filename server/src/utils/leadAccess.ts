import { findLeadById } from '../db/queries/leadQueries.js';
import type { AuthUser, Lead } from '../types/models.js';
import { ApiError } from './apiError.js';

// Admins can access every lead; agents only the leads assigned to them.
export async function getAccessibleLead(leadId: number, user: AuthUser): Promise<Lead> {
  const lead = await findLeadById(leadId);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }
  if (user.role !== 'admin' && lead.agentId !== user.id) {
    throw new ApiError(403, 'This lead is not assigned to you');
  }
  return lead;
}
