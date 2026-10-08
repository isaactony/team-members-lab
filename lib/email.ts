import { formatName, formatRole } from './format';
import type { Role } from './validation';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

/** Keeps sent messages in memory. Used by tests and local development. */
export class InMemoryEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }

  lastTo(email: string): EmailMessage | undefined {
    return [...this.sent].reverse().find((message) => message.to === email);
  }
}

/** Prints messages to the console instead of sending them. */
export class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[email] to=${message.to} subject="${message.subject}"`);
    console.log(message.text);
  }
}

export interface InvitationEmailInput {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: Role;
  acceptUrl: string;
  expiresInDays: number;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function renderInvitationEmail(input: InvitationEmailInput): EmailMessage {
  const inviter = formatName(input.inviterName);
  const role = formatRole(input.role).toLowerCase();
  const subject = `${inviter} invited you to join ${input.workspaceName}`;
  const text = [
    `${inviter} invited you to join ${input.workspaceName} as ${article(role)} ${role}.`,
    '',
    `Accept the invitation here: ${input.acceptUrl}`,
    '',
    `This link expires in ${input.expiresInDays} days. If you weren't expecting it, you can ignore this email.`,
  ].join('\n');
  const html = `<p>${escapeHtml(inviter)} invited you to join <strong>${escapeHtml(
    input.workspaceName,
  )}</strong> as ${article(role)} ${escapeHtml(role)}.</p>
<p><a href="${escapeHtml(input.acceptUrl)}">Accept the invitation</a></p>
<p>This link expires in ${input.expiresInDays} days. If you weren't expecting it, you can ignore this email.</p>`;

  return { to: input.to, subject, text, html };
}

function article(word: string): string {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}
