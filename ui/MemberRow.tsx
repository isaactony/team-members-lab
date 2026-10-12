import type { Member } from '../lib/members';
import type { Role } from '../lib/validation';
import { formatDate, formatName, formatRelative, initials } from '../lib/format';
import { RoleBadge } from './RoleBadge';

export interface MemberRowProps {
  member: Member;
  canManage: boolean;
  assignableRoles?: Role[];
  now?: Date;
  onChangeRole?: (userId: string, role: Role) => void;
  onRemove?: (userId: string) => void;
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

export function MemberRow({
  member,
  canManage,
  assignableRoles = ['owner', 'admin', 'member', 'viewer'],
  now,
  onChangeRole,
  onRemove,
}: MemberRowProps) {
  return (
    <tr data-user-id={member.id}>
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
              {ROLE_OPTIONS.filter(
                (option) => assignableRoles.includes(option.value) || option.value === member.role,
              ).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
