export const USER_ROLES = ['admin', 'agent'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const INSURANCE_TYPES = ['car', 'home', 'travel', 'mortgage', 'health_life'] as const;
export type InsuranceType = (typeof INSURANCE_TYPES)[number];

export const LEAD_STATUSES = ['new', 'in_progress', 'callback', 'quote_sent', 'won', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

// Public user shape: never includes password_hash.
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface UserWithPasswordHash extends User {
  passwordHash: string;
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
  consentAt: Date;
  callbackAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadNote {
  id: number;
  leadId: number;
  authorId: number | null;
  authorName: string | null;
  content: string;
  createdAt: Date;
}

// What the auth middleware attaches to req.user.
export interface AuthUser {
  id: number;
  role: UserRole;
}
