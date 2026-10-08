import { describe, expect, it } from 'vitest';
import { renderInvitationEmail } from '../lib/email';

describe('invitation email', () => {
  const message = renderInvitationEmail({
    to: 'new@example.com',
    inviterName: 'grace hopper',
    workspaceName: 'Team <Lab>',
    role: 'admin',
    acceptUrl: 'https://lab.example.com/invitations/accept?token=abc',
    expiresInDays: 7,
  });

  it('names the inviter and the workspace in the subject', () => {
    expect(message.subject).toBe('Grace Hopper invited you to join Team <Lab>');
  });

  it('uses the right article for the role', () => {
    expect(message.text).toContain('as an admin');
  });

  it('includes the accept link and expiry', () => {
    expect(message.text).toContain('https://lab.example.com/invitations/accept?token=abc');
    expect(message.text).toContain('expires in 7 days');
  });

  it('escapes HTML in the workspace name', () => {
    expect(message.html).toContain('Team &lt;Lab&gt;');
    expect(message.html).not.toContain('<Lab>');
  });
});
