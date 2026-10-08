import type { Db } from '../db/client';
import type { Role } from './validation';

export interface Member {
  id: string;
  email: string;
  name: string;
  role: Role;
  joinedAt: string;
  lastActiveAt: string | null;
}

interface MemberRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  joined_at: string;
  last_active_at: string | null;
}

const toMember = (row: MemberRow): Member => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  joinedAt: row.joined_at,
  lastActiveAt: row.last_active_at,
});

export function listMembers(db: Db): Member[] {
  return db
    .all<MemberRow>('SELECT * FROM members ORDER BY joined_at ASC')
    .map(toMember);
}

export function getMember(db: Db, memberId: string): Member | undefined {
  const row = db.get<MemberRow>('SELECT * FROM members WHERE id = ?', [memberId]);
  return row ? toMember(row) : undefined;
}

export function countMembersWithRole(db: Db, role: Role): number {
  const row = db.get<{ total: number }>('SELECT COUNT(*) AS total FROM members WHERE role = ?', [
    role,
  ]);
  return row?.total ?? 0;
}

export function updateMemberRole(db: Db, memberId: string, role: Role): Member | undefined {
  db.run('UPDATE members SET role = ? WHERE id = ?', [role, memberId]);
  return getMember(db, memberId);
}

export function removeMember(db: Db, memberId: string): boolean {
  return db.run('DELETE FROM members WHERE id = ?', [memberId]) > 0;
}
