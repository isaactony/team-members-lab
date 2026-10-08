import type { Invitation } from '../lib/invitations';
import { MAX_RESENDS } from '../lib/invitations';
import { formatExpiry, formatRelative, pluralize } from '../lib/format';
import { RoleBadge } from './RoleBadge';

export interface PendingInvitationsProps {
  invitations: Invitation[];
  now?: Date;
  onResend?: (invitationId: string) => void;
  onRevoke?: (invitationId: string) => void;
}

export function PendingInvitations({ invitations, now, onResend, onRevoke }: PendingInvitationsProps) {
  if (invitations.length === 0) {
    return null;
  }

  return (
    <section className="pending-invitations" aria-labelledby="pending-title">
      <h2 id="pending-title">
        {invitations.length} pending {pluralize(invitations.length, 'invitation')}
      </h2>
      <ul>
        {invitations.map((invitation) => {
          const resendsLeft = MAX_RESENDS - invitation.resentCount;
          return (
            <li key={invitation.id} data-invitation-id={invitation.id}>
              <span className="invitation-email">{invitation.email}</span>
              <RoleBadge role={invitation.role} />
              <span className="invitation-sent">
                Sent {formatRelative(invitation.lastSentAt, now).toLowerCase()}
              </span>
              <span className="invitation-expiry">{formatExpiry(invitation.expiresAt, now)}</span>
              <button
                type="button"
                disabled={resendsLeft <= 0}
                title={resendsLeft <= 0 ? 'This invitation cannot be resent again' : undefined}
                onClick={() => onResend?.(invitation.id)}
              >
                Resend
              </button>
              <button type="button" onClick={() => onRevoke?.(invitation.id)}>
                Revoke
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
