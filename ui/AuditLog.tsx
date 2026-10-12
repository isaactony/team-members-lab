import { describeEvent, type AuditEvent } from '../lib/audit';
import { formatRelative } from '../lib/format';

export interface AuditLogProps {
  events: AuditEvent[];
  names: Record<string, string>;
  now?: Date;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function AuditLog({ events, names, now, hasMore = false, onLoadMore }: AuditLogProps) {
  return (
    <section className="audit-log" aria-labelledby="audit-title">
      <h2 id="audit-title">Recent activity</h2>
      {events.length === 0 ? (
        <p className="empty">Nothing has happened yet.</p>
      ) : (
        <ol>
          {events.map((event) => (
            <li key={event.id} data-action={event.action}>
              <span className="audit-text">{describeEvent(event, names)}</span>
              <time dateTime={event.createdAt}>{formatRelative(event.createdAt, now)}</time>
            </li>
          ))}
        </ol>
      )}
      {hasMore ? (
        <button type="button" onClick={onLoadMore}>
          Show older activity
        </button>
      ) : null}
    </section>
  );
}
