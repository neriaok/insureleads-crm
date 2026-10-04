// Mirrors the API response shapes from the server. Dates arrive as ISO strings.

export const INSURANCE_TYPES = ['car', 'home', 'travel', 'mortgage', 'health_life'] as const;
export type InsuranceType = (typeof INSURANCE_TYPES)[number];

export const LEAD_STATUSES = ['new', 'in_progress', 'callback', 'quote_sent', 'won', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

// Annual policies: closing one requires a policy end date, and a renewal lead is created before it.
export const RENEWABLE_INSURANCE_TYPES: readonly InsuranceType[] = ['car', 'home'];

export type UserRole = 'admin' | 'agent';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Lead {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  insuranceType: InsuranceType;
  status: LeadStatus;
  agentId: number | null;
  agentName: string | null;
  consentAt: string;
  callbackAt: string | null;
  policyEndDate: string | null;
  renewalOfLeadId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadNote {
  id: number;
  leadId: number;
  authorId: number | null;
  authorName: string | null;
  content: string;
  createdAt: string;
}

export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };
