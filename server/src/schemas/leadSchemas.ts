import { z } from 'zod';
import { INSURANCE_TYPES, LEAD_STATUSES } from '../types/models.js';

// Accepts Israeli numbers like "050-123 4567" or "+972 50 1234567" and stores them as "0501234567".
const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s\-().]/g, '').replace(/^\+972/, '0'))
  .pipe(z.string().regex(/^0\d{8,9}$/, 'Phone must be a valid Israeli phone number'));

export const createLeadSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  phone: phoneSchema,
  email: z
    .union([z.email().trim().toLowerCase(), z.literal('')])
    .optional()
    .transform((value) => value || null),
  insuranceType: z.enum(INSURANCE_TYPES),
  consent: z.literal(true, 'You must accept the privacy terms'),
});

export const leadIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listLeadsQuerySchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
});

export const updateLeadStatusSchema = z
  .object({
    status: z.enum(LEAD_STATUSES),
    callbackAt: z.iso.datetime({ offset: true }).optional(),
  })
  .refine((body) => body.status !== 'callback' || body.callbackAt !== undefined, {
    message: 'callbackAt is required when status is callback',
    path: ['callbackAt'],
  });

export const assignLeadSchema = z.object({
  agentId: z.number().int().positive().nullable(),
});
