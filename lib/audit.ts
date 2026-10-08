import type { Db } from '../db/client';
import { formatRole } from './format';
import { newId } from './tokens';
import { isRole } from './validation';

export const AUDIT_ACTIONS = [
  'member.role_changed',
  'member.removed',
  'invitation.created',
  'invitation.resent',
  'invitation.revoked',
  'invitation.accepted',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditTargetType = 'member' | 'invitation';
export type AuditMetadata = Record<string, string | number | boolean | null>;

export interface AuditEvent {
  id: string;
  actorId: string | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  metadata: AuditMetadata;
  createdAt: string;
}

interface AuditEventRow {
  id: string;
  actor_id: string | null;
  action: AuditAction;
  target_type: AuditTargetType;
  target_id: string;
  metadata: string;
  created_at: string;
}

const toEvent = (row: AuditEventRow): AuditEvent => ({
  id: row.id,
  actorId: row.actor_id,
  action: row.action,
  targetType: row.target_type,
  targetId: row.target_id,
  metadata: parseMetadata(row.metadata),
  createdAt: row.created_at,
});

function parseMetadata(raw: string): AuditMetadata {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as AuditMetadata)
      : {};
  } catch {
    return {};
  }
}

export function isAuditAction(value: unknown): value is AuditAction {
  return typeof value === 'string' && (AUDIT_ACTIONS as readonly string[]).includes(value);
}

export interface RecordEventInput {
  actorId: string | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  metadata?: AuditMetadata;
  at?: Date;
}

export function recordEvent(db: Db, input: RecordEventInput): AuditEvent {
  const event: AuditEvent = {
    id: newId('evt'),
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata ?? {},
    createdAt: (input.at ?? new Date()).toISOString(),
  };
  db.run(
    `INSERT INTO audit_events (id, actor_id, action, target_type, target_id, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      event.id,
      event.actorId,
      event.action,
      event.targetType,
      event.targetId,
      JSON.stringify(event.metadata),
      event.createdAt,
    ],
  );
  return event;
}

export interface ListEventsOptions {
  limit?: number;
  before?: string;
  action?: AuditAction;
  targetId?: string;
}

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export interface EventPage {
  events: AuditEvent[];
  nextBefore: string | null;
}

/** Newest first. Pass the returned nextBefore as before to get the next page. */
export function listEvents(db: Db, options: ListEventsOptions = {}): EventPage {
  const limit = Math.min(Math.max(1, options.limit ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (options.before) {
    where.push('created_at < ?');
    params.push(options.before);
  }
  if (options.action) {
    where.push('action = ?');
    params.push(options.action);
  }
  if (options.targetId) {
    where.push('target_id = ?');
    params.push(options.targetId);
  }

  const sql = `SELECT * FROM audit_events
    ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY created_at DESC, id DESC
    LIMIT ?`;
  const rows = db.all<AuditEventRow>(sql, [...params, limit + 1]);
  const events = rows.slice(0, limit).map(toEvent);
  const hasMore = rows.length > limit;
  return { events, nextBefore: hasMore ? (events[events.length - 1]?.createdAt ?? null) : null };
}

/** A one-line, human description of an event for the activity feed. */
export function describeEvent(event: AuditEvent, names: Record<string, string> = {}): string {
  const actor = event.actorId ? (names[event.actorId] ?? 'Someone') : 'Someone';
  const target = names[event.targetId] ?? String(event.metadata.email ?? 'a teammate');
  const role = (key: string) => {
    const value = event.metadata[key];
    return isRole(value) ? formatRole(value).toLowerCase() : 'unknown role';
  };

  switch (event.action) {
    case 'member.role_changed':
      return `${actor} changed ${target} from ${role('from')} to ${role('to')}`;
    case 'member.removed':
      return event.actorId === event.targetId ? `${actor} left the workspace` : `${actor} removed ${target}`;
    case 'invitation.created':
      return `${actor} invited ${target} as ${role('role')}`;
    case 'invitation.resent':
      return `${actor} resent the invitation to ${target}`;
    case 'invitation.revoked':
      return `${actor} revoked the invitation to ${target}`;
    case 'invitation.accepted':
      return `${target} joined as ${role('role')}`;
  }
}
