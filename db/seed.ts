import type { Db } from './client';

export interface SeedMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
  lastActiveAt: string | null;
}

export const SEED_MEMBERS: SeedMember[] = [
  {
    id: 'mem_owner',
    email: 'ada@example.com',
    name: 'Ada Lovelace',
    role: 'owner',
    joinedAt: '2025-01-14T09:00:00.000Z',
    lastActiveAt: '2026-10-01T16:20:00.000Z',
  },
  {
    id: 'mem_admin',
    email: 'grace@example.com',
    name: 'Grace Hopper',
    role: 'admin',
    joinedAt: '2025-03-02T10:30:00.000Z',
    lastActiveAt: '2026-10-02T08:05:00.000Z',
  },
  {
    id: 'mem_member',
    email: 'linus@example.com',
    name: 'Linus Torvalds',
    role: 'member',
    joinedAt: '2025-06-21T14:00:00.000Z',
    lastActiveAt: '2026-09-28T19:45:00.000Z',
  },
  {
    id: 'mem_member2',
    email: 'margaret@example.com',
    name: 'Margaret Hamilton',
    role: 'member',
    joinedAt: '2025-08-09T11:15:00.000Z',
    lastActiveAt: null,
  },
  {
    id: 'mem_viewer',
    email: 'alan@example.com',
    name: 'Alan Turing',
    role: 'viewer',
    joinedAt: '2026-02-17T13:40:00.000Z',
    lastActiveAt: '2026-09-15T07:30:00.000Z',
  },
];

export function seedMembers(db: Db, members: SeedMember[] = SEED_MEMBERS): void {
  db.transaction(() => {
    for (const member of members) {
      db.run(
        `INSERT INTO members (id, email, name, role, joined_at, last_active_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [member.id, member.email, member.name, member.role, member.joinedAt, member.lastActiveAt],
      );
    }
  });
}
