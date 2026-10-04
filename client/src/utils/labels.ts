import { INSURANCE_TYPES, LEAD_STATUSES, type InsuranceType, type LeadStatus, type UserRole } from '../types/models';

export const insuranceTypeLabels: Record<InsuranceType, string> = {
  car: 'ביטוח רכב',
  home: 'ביטוח דירה',
  travel: 'ביטוח נסיעות',
  mortgage: 'ביטוח משכנתא',
  health_life: 'בריאות וחיים',
};

export const statusLabels: Record<LeadStatus, string> = {
  new: 'חדש',
  in_progress: 'בטיפול',
  callback: 'לחזור',
  quote_sent: 'נשלחה הצעה',
  won: 'נסגר',
  lost: 'לא רלוונטי',
};

export const roleLabels: Record<UserRole, string> = {
  admin: 'מנהל',
  agent: 'סוכן',
};

// Type guards for values coming from <select> elements, which are always strings.
export function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUSES.some((status) => status === value);
}

export function isInsuranceType(value: string): value is InsuranceType {
  return INSURANCE_TYPES.some((type) => type === value);
}

const dateTimeFormat = new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' });

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}
