import type { Member } from '../lib/members';
import type { Role } from '../lib/validation';
import { formatDate, formatName, formatRelative, initials } from '../utils/format';
import { RoleBadge } from './RoleBadge';

export interface MemberRowProps {
  member: Member;
  canManage: boolean;
  now?: Date;
  onChangeRole?: (memberId: string, role: Role) => void;
  onRemove?: (memberId: string) => void;
}

export function MemberRow({ member, canManage, now, onChangeRole, onRemove }: MemberRowProps) {
  return (
    <tr data-member-id={member.id}>
      <td>
        <span className="avatar" aria-hidden="true">
          {initials(member.name)}
        </span>
        <span className="member-name">{formatName(member.name)}</span>
        <span className="member-email">{member.email}</span>
      </td>
      <td>
        <RoleBadge role={member.role} />
      </td>
      <td>{formatDate(member.joinedAt)}</td>
      <td>{formatRelative(member.lastActiveAt, now)}</td>
      <td>
        {canManage ? (
          <>
            <select
              aria-label={`Change role for ${member.name}`}
              defaultValue={member.role}
              onChange={(event) => onChangeRole?.(member.id, event.target.value as Role)}
            >
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <button type="button" onClick={() => onRemove?.(member.id)}>
              Remove
            </button>
          </>
        ) : null}
      </td>
    </tr>
  );
}
