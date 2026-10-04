import { Router } from 'express';
import { assignLead, createLead, getLead, listLeads, updateLeadStatus } from '../controllers/leadController.js';
import { createNote, listNotes } from '../controllers/noteController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const leadRoutes = Router();

// Public: used by the lead form.
leadRoutes.post('/', asyncHandler(createLead));

leadRoutes.get('/', requireAuth, asyncHandler(listLeads));
leadRoutes.get('/:id', requireAuth, asyncHandler(getLead));
leadRoutes.patch('/:id/status', requireAuth, asyncHandler(updateLeadStatus));
leadRoutes.patch('/:id/assign', requireAuth, requireRole('admin'), asyncHandler(assignLead));

leadRoutes.get('/:id/notes', requireAuth, asyncHandler(listNotes));
leadRoutes.post('/:id/notes', requireAuth, asyncHandler(createNote));
