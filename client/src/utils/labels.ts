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

// Formats a 'YYYY-MM-DD' date without creating a Date, so no timezone can shift the day.
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

const relativeFormat = new Intl.RelativeTimeFormat('he', { numeric: 'auto' });

// "לפני 3 שעות", "אתמול", "בעוד יומיים"
export function formatRelative(iso: string, now: Date = new Date()): string {
  const diffMinutes = Math.round((new Date(iso).getTime() - now.getTime()) / 60_000);
  if (Math.abs(diffMinutes) < 60) return relativeFormat.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return relativeFormat.format(diffHours, 'hour');
  return relativeFormat.format(Math.round(diffHours / 24), 'day');
}

const timeFormat = new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit' });

export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

// Local calendar date as "YYYY-MM-DD", for comparing days.
export function toLocalDateKey(date: Date): string {
  return date.toLocaleDateString('en-CA');
}
