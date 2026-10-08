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

export function getMember(db: Db, userId: string): Member | undefined {
  const row = db.get<MemberRow>('SELECT * FROM members WHERE id = ?', [userId]);
  return row ? toMember(row) : undefined;
}

export function getMemberByEmail(db: Db, email: string): Member | undefined {
  const row = db.get<MemberRow>('SELECT * FROM members WHERE email = ?', [email]);
  return row ? toMember(row) : undefined;
}

export function countMembersWithRole(db: Db, role: Role): number {
  const row = db.get<{ total: number }>('SELECT COUNT(*) AS total FROM members WHERE role = ?', [
    role,
  ]);
  return row?.total ?? 0;
}

export interface NewMember {
  id: string;
  email: string;
  name: string;
  role: Role;
  joinedAt: string;
}

export function addMember(db: Db, member: NewMember): Member {
  db.run(
    `INSERT INTO members (id, email, name, role, joined_at, last_active_at)
     VALUES (?, ?, ?, ?, ?, NULL)`,
    [member.id, member.email, member.name, member.role, member.joinedAt],
  );
  return getMember(db, member.id)!;
}

export function updateMemberRole(db: Db, userId: string, role: Role): Member | undefined {
  db.run('UPDATE members SET role = ? WHERE id = ?', [role, userId]);
  return getMember(db, userId);
}

export function removeMember(db: Db, userId: string): boolean {
  return db.run('DELETE FROM members WHERE id = ?', [userId]) > 0;
}
