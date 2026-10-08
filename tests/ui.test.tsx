import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MembersPage } from '../ui/MembersPage';
import type { Member } from '../lib/members';

const members: Member[] = [
  {
    id: 'mem_owner',
    email: 'ada@example.com',
    name: 'ada lovelace',
    role: 'owner',
    joinedAt: '2025-01-14T09:00:00.000Z',
    lastActiveAt: '2026-10-01T12:00:00.000Z',
  },
  {
    id: 'mem_viewer',
    email: 'alan@example.com',
    name: 'alan turing',
    role: 'viewer',
    joinedAt: '2026-02-17T13:40:00.000Z',
    lastActiveAt: null,
  },
];

const now = new Date('2026-10-02T12:00:00.000Z');

describe('MembersPage', () => {
  it('renders every member with a formatted name and role', () => {
    const html = renderToStaticMarkup(<MembersPage members={members} actor={members[0]!} now={now} />);
    expect(html).toContain('Ada Lovelace');
    expect(html).toContain('Alan Turing');
    expect(html).toContain('2 members');
    expect(html).toContain('Never');
  });

  it('shows management controls to owners but not on their own row', () => {
    const html = renderToStaticMarkup(<MembersPage members={members} actor={members[0]!} now={now} />);
    expect(html).toContain('Change role for alan turing');
    expect(html).not.toContain('Change role for ada lovelace');
  });

  it('hides management controls from viewers', () => {
    const html = renderToStaticMarkup(<MembersPage members={members} actor={members[1]!} now={now} />);
    expect(html).not.toContain('Change role for');
  });
});
