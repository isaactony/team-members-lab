import type { Member } from '../lib/members';
import type { Role } from '../lib/validation';
import { pluralize } from '../utils/format';
import { MemberRow } from './MemberRow';

export interface MembersPageProps {
  members: Member[];
  actor: Member;
  now?: Date;
  onChangeRole?: (memberId: string, role: Role) => void;
  onRemove?: (memberId: string) => void;
}

export function MembersPage({ members, actor, now, onChangeRole, onRemove }: MembersPageProps) {
  const canManage = actor.role === 'owner' || actor.role === 'admin';

  return (
    <main className="members-page">
      <header>
        <h1>Team members</h1>
        <p>
          {members.length} {pluralize(members.length, 'member')}
        </p>
      </header>
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
