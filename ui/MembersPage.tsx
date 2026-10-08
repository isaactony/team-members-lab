import type { Invitation } from '../lib/invitations';
import type { Member } from '../lib/members';
import { canAssignRole, canInvite, canManageMembers } from '../lib/permissions';
import { ROLES, type Role } from '../lib/validation';
import { pluralize } from '../lib/format';
import { MemberRow } from './MemberRow';
import { PendingInvitations } from './PendingInvitations';

export interface MembersPageProps {
  members: Member[];
  invitations?: Invitation[];
  actor: Member;
  now?: Date;
  onInvite?: () => void;
  onChangeRole?: (userId: string, role: Role) => void;
  onRemove?: (userId: string) => void;
  onResendInvitation?: (invitationId: string) => void;
  onRevokeInvitation?: (invitationId: string) => void;
}

export function MembersPage({
  members,
  invitations = [],
  actor,
  now,
  onInvite,
  onChangeRole,
  onRemove,
  onResendInvitation,
  onRevokeInvitation,
}: MembersPageProps) {
  const canManage = canManageMembers(actor.role);
  const assignableRoles = ROLES.filter((role) => canAssignRole(actor.role, role));

  return (
    <main className="members-page">
      <header>
        <h1>Team members</h1>
        <p>
          {members.length} {pluralize(members.length, 'member')}
        </p>
        {canInvite(actor.role) ? (
          <button type="button" className="primary" onClick={onInvite}>
            Invite teammate
          </button>
        ) : null}
      </header>

      {canInvite(actor.role) ? (
        <PendingInvitations
          invitations={invitations}
          now={now}
          onResend={onResendInvitation}
          onRevoke={onRevokeInvitation}
        />
      ) : null}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Last active</th>
            <th>
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              canManage={canManage && member.id !== actor.id}
              assignableRoles={assignableRoles}
              now={now}
              onChangeRole={onChangeRole}
              onRemove={onRemove}
            />
          ))}
        </tbody>
      </table>
    </main>
  );
}
