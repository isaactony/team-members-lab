import type { Role } from '../lib/validation';

const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

/** Turns "  ada   lovelace " into "Ada Lovelace". */
export function formatName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ');
}

/** Two-letter initials for avatars, like "AL" for Ada Lovelace. */
export function initials(name: string): string {
  const parts = formatName(name).split(' ');
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

export function formatRole(role: Role): string {
  return ROLE_LABELS[role];
}

/** Formats an ISO date as "Jan 14, 2025". */
export function formatDate(iso: string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

/** Formats how long ago something happened, like "3 days ago". */
export function formatRelative(iso: string | null, now: Date = new Date()): string {
  if (!iso) {
    return 'Never';
  }
  const seconds = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} ${pluralize(minutes, 'minute')} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${pluralize(hours, 'hour')} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${pluralize(days, 'day')} ago`;
  return formatDate(iso);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
