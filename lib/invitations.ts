import type { Db } from '../db/client';
import { renderInvitationEmail, type EmailSender } from './email';
import { badRequest, conflict, forbidden, HttpError, notFound } from './errors';
import { addMember, getMember, type Member } from './members';
import { canInvite } from './permissions';
import { generateToken, hashToken, newId } from './tokens';
import type { Role } from './validation';

export const INVITATION_TTL_DAYS = 7;
export const MAX_RESENDS = 2;

export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  status: InvitationStatus;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  lastSentAt: string;
  resentCount: number;
  acceptedAt: string | null;
  acceptedBy: string | null;
}

interface InvitationRow {
  id: string;
  email: string;
  role: Role;
  token_hash: string;
  status: InvitationStatus;
  invited_by: string;
  created_at: string;
  expires_at: string;
  last_sent_at: string;
  resent_count: number;
  accepted_at: string | null;
  accepted_by: string | null;
}

const toInvitation = (row: InvitationRow): Invitation => ({
  id: row.id,
  email: row.email,
  role: row.role,
  status: row.status,
  invitedBy: row.invited_by,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  lastSentAt: row.last_sent_at,
  resentCount: row.resent_count,
  acceptedAt: row.accepted_at,
  acceptedBy: row.accepted_by,
});

export interface InvitationServiceOptions {
  db: Db;
  email: EmailSender;
  appUrl: string;
  workspaceName: string;
  now?: () => Date;
}

export class InvitationService {
  private readonly db: Db;
  private readonly email: EmailSender;
  private readonly appUrl: string;
  private readonly workspaceName: string;
  private readonly now: () => Date;

  constructor(options: InvitationServiceOptions) {
    this.db = options.db;
    this.email = options.email;
    this.appUrl = options.appUrl.replace(/\/$/, '');
    this.workspaceName = options.workspaceName;
    this.now = options.now ?? (() => new Date());
  }

  listPending(): Invitation[] {
    this.expireStale();
    return this.db
      .all<InvitationRow>(
        "SELECT * FROM invitations WHERE status = 'pending' ORDER BY created_at DESC",
      )
      .map(toInvitation);
  }

  get(invitationId: string): Invitation | undefined {
    const row = this.db.get<InvitationRow>('SELECT * FROM invitations WHERE id = ?', [
      invitationId,
    ]);
    return row ? toInvitation(row) : undefined;
  }

  async create(actor: Member, email: string, role: Role): Promise<Invitation> {
    if (!canInvite(actor.role)) {
      throw forbidden('Only owners and admins can invite teammates');
    }
    const existingMember = this.db.get<{ id: string }>('SELECT id FROM members WHERE email = ?', [
      email,
    ]);
    if (existingMember) {
      throw conflict(`${email} is already a member of this workspace`);
    }
    const pending = this.db.get<{ id: string }>(
      "SELECT id FROM invitations WHERE email = ? AND status = 'pending'",
      [email],
    );
    if (pending) {
      throw conflict(`${email} already has a pending invitation`);
    }

    const token = generateToken();
    const now = this.now();
    const id = newId('inv');
    this.db.run(
      `INSERT INTO invitations
         (id, email, role, token_hash, status, invited_by, created_at, expires_at, last_sent_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [
        id,
        email,
        role,
        hashToken(token),
        actor.id,
        now.toISOString(),
        addDays(now, INVITATION_TTL_DAYS).toISOString(),
        now.toISOString(),
      ],
    );

    await this.sendInvitationEmail(actor, email, role, token);
    return this.get(id)!;
  }

  async resend(actor: Member, invitationId: string): Promise<Invitation> {
    if (!canInvite(actor.role)) {
      throw forbidden('Only owners and admins can resend invitations');
    }
    const invitation = this.get(invitationId);
    if (!invitation) {
      throw notFound('Invitation not found');
    }
    if (invitation.resentCount >= MAX_RESENDS) {
      throw new HttpError(429, 'too_many_resends', 'This invitation has been resent too many times');
    }

    // A new token invalidates the old link, and the expiry window starts again.
    const token = generateToken();
    const now = this.now();
    this.db.run(
      `UPDATE invitations
          SET token_hash = ?, status = 'pending', expires_at = ?, last_sent_at = ?,
              resent_count = resent_count + 1
        WHERE id = ?`,
      [hashToken(token), addDays(now, INVITATION_TTL_DAYS).toISOString(), now.toISOString(), invitationId],
    );

    await this.sendInvitationEmail(actor, invitation.email, invitation.role, token);
    return this.get(invitationId)!;
  }

  revoke(invitationId: string): Invitation {
    const invitation = this.get(invitationId);
    if (!invitation) {
      throw notFound('Invitation not found');
    }
    if (invitation.status !== 'pending') {
      throw badRequest(`Only pending invitations can be revoked. This one is ${invitation.status}.`);
    }
    this.db.run("UPDATE invitations SET status = 'revoked' WHERE id = ?", [invitationId]);
    return this.get(invitationId)!;
  }

  accept(token: string, name: string): Member {
    const row = this.db.get<InvitationRow>('SELECT * FROM invitations WHERE token_hash = ?', [
      hashToken(token),
    ]);
    if (!row) {
      throw notFound('This invitation link is not valid');
    }
    const invitation = toInvitation(row);
    if (invitation.status !== 'pending') {
      throw badRequest(`This invitation has been ${invitation.status}`);
    }
    if (new Date(invitation.expiresAt) <= this.now()) {
      this.db.run("UPDATE invitations SET status = 'expired' WHERE id = ?", [invitation.id]);
      throw badRequest('This invitation has expired. Ask for a new one.');
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      throw badRequest('name is required');
    }

    return this.db.transaction(() => {
      const member = addMember(this.db, {
        id: newId('mem'),
        email: invitation.email,
        name: trimmedName,
        role: invitation.role,
        joinedAt: this.now().toISOString(),
      });
      this.db.run(
        "UPDATE invitations SET status = 'accepted', accepted_at = ?, accepted_by = ? WHERE id = ?",
        [this.now().toISOString(), member.id, invitation.id],
      );
      return member;
    });
  }

  /** Marks pending invitations past their expiry as expired. Returns how many changed. */
  expireStale(): number {
    return this.db.run(
      "UPDATE invitations SET status = 'expired' WHERE status = 'pending' AND expires_at <= ?",
      [this.now().toISOString()],
    );
  }

  private async sendInvitationEmail(actor: Member, to: string, role: Role, token: string) {
    const inviter = getMember(this.db, actor.id) ?? actor;
    const message = renderInvitationEmail({
      to,
      inviterName: inviter.name,
      workspaceName: this.workspaceName,
      role,
      acceptUrl: `${this.appUrl}/invitations/accept?token=${encodeURIComponent(token)}`,
      expiresInDays: INVITATION_TTL_DAYS,
    });
    await this.email.send(message);
  }
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
