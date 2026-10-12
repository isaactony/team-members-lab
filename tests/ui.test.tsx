import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MembersPage } from '../ui/MembersPage';
import { InviteDialog } from '../ui/InviteDialog';
import type { Member } from '../lib/members';
import type { Invitation } from '../lib/invitations';

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
    id: 'mem_admin',
    email: 'grace@example.com',
    name: 'grace hopper',
    role: 'admin',
    joinedAt: '2025-03-02T10:30:00.000Z',
    lastActiveAt: '2026-10-02T08:05:00.000Z',
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

const invitations: Invitation[] = [
  {
    id: 'inv_1',
    email: 'new@example.com',
    role: 'member',
    status: 'pending',
    invitedBy: 'mem_owner',
    createdAt: '2026-10-01T12:00:00.000Z',
    expiresAt: '2026-10-08T12:00:00.000Z',
    lastSentAt: '2026-10-01T12:00:00.000Z',
    resentCount: 0,
    acceptedAt: null,
    acceptedBy: null,
  },
];

const now = new Date('2026-10-02T12:00:00.000Z');
const [owner, admin, viewer] = members as [Member, Member, Member];

describe('MembersPage', () => {
  it('renders every member with a formatted name and role', () => {
    const html = renderToStaticMarkup(<MembersPage members={members} actor={owner} now={now} />);
    expect(html).toContain('Ada Lovelace');
    expect(html).toContain('Alan Turing');
    expect(html).toContain('3 members');
    expect(html).toContain('Never');
  });

  it('shows management controls to owners but not on their own row', () => {
    const html = renderToStaticMarkup(<MembersPage members={members} actor={owner} now={now} />);
    expect(html).toContain('Change role for alan turing');
    expect(html).not.toContain('Change role for ada lovelace');
  });

  it('hides management controls and invitations from viewers', () => {
    const html = renderToStaticMarkup(
      <MembersPage members={members} invitations={invitations} actor={viewer} now={now} />,
    );
    expect(html).not.toContain('Change role for');
    expect(html).not.toContain('Invite teammate');
    expect(html).not.toContain('pending invitation');
  });

  it('shows pending invitations with their expiry to admins', () => {
    const html = renderToStaticMarkup(
      <MembersPage members={members} invitations={invitations} actor={admin} now={now} />,
    );
    expect(html).toContain('Invite teammate');
    expect(html).toContain('1 pending invitation');
    expect(html).toContain('new@example.com');
    expect(html).toContain('Expires in 6 days');
  });

  it('does not offer the owner role to admins', () => {
    const html = renderToStaticMarkup(<MembersPage members={members} actor={admin} now={now} />);
    const viewerRow = html.slice(html.indexOf('data-user-id="mem_viewer"'));
    expect(viewerRow).not.toContain('value="owner"');
  });
});

describe('InviteDialog', () => {
  it('renders nothing when closed', () => {
    const html = renderToStaticMarkup(
      <InviteDialog open={false} assignableRoles={['member']} onSubmit={() => {}} onClose={() => {}} />,
    );
    expect(html).toBe('');
  });

  it('only offers the roles the actor can assign', () => {
    const html = renderToStaticMarkup(
      <InviteDialog
        open
        assignableRoles={['admin', 'member', 'viewer']}
        onSubmit={() => {}}
        onClose={() => {}}
      />,
    );
    expect(html).toContain('Invite a teammate');
    expect(html).toContain('>Admin<');
    expect(html).not.toContain('>Owner<');
  });

  it('shows a server error', () => {
    const html = renderToStaticMarkup(
      <InviteDialog
        open
        assignableRoles={['member']}
        error="x@example.com already has a pending invitation"
        onSubmit={() => {}}
        onClose={() => {}}
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('already has a pending invitation');
  });
});
