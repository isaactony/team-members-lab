import { Router } from 'express';
import type { Db } from '../db/client';
import { recordEvent } from '../lib/audit';
import { requireActor } from '../lib/auth';
import { badRequest, forbidden } from '../lib/errors';
import type { InvitationService } from '../lib/invitations';
import { canInvite } from '../lib/permissions';
import { requireEmail, requireRole } from '../lib/validation';

/** Routes for owners and admins managing invitations. Mounted behind loadActor. */
export function invitationsRouter(db: Db, invitations: InvitationService): Router {
  const router = Router();

  router.get('/invitations', (req, res) => {
    const actor = requireActor(req);
    if (!canInvite(actor.role)) {
      throw forbidden('Only owners and admins can see invitations');
    }
    res.json({ invitations: invitations.listPending() });
  });

  router.post('/invitations', async (req, res, next) => {
    try {
      const actor = requireActor(req);
      const email = requireEmail(req.body?.email);
      const role = requireRole(req.body?.role ?? 'member');
      const invitation = await invitations.create(actor, email, role);
      recordEvent(db, {
        actorId: actor.id,
        action: 'invitation.created',
        targetType: 'invitation',
        targetId: invitation.id,
        metadata: { email: invitation.email, role: invitation.role },
      });
      res.status(201).json({ invitation });
    } catch (error) {
      next(error);
    }
  });

  router.post('/invitations/:invitationId/resend', async (req, res, next) => {
    try {
      const actor = requireActor(req);
      const invitation = await invitations.resend(actor, req.params.invitationId);
      recordEvent(db, {
        actorId: actor.id,
        action: 'invitation.resent',
        targetType: 'invitation',
        targetId: invitation.id,
        metadata: { email: invitation.email, resentCount: invitation.resentCount },
      });
      res.json({ invitation });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/invitations/:invitationId', (req, res) => {
    const invitation = invitations.revoke(req.params.invitationId);
    recordEvent(db, {
      actorId: req.actor?.id ?? null,
      action: 'invitation.revoked',
      targetType: 'invitation',
      targetId: invitation.id,
      metadata: { email: invitation.email },
    });
    res.json({ invitation });
  });

  return router;
}

/** The accept route is public, because the person accepting is not a member yet. */
export function acceptInvitationRouter(db: Db, invitations: InvitationService): Router {
  const router = Router();

  router.post('/invitations/accept', (req, res) => {
    const token = req.body?.token;
    const name = req.body?.name;
    if (typeof token !== 'string' || typeof name !== 'string') {
      throw badRequest('token and name are required');
    }
    const member = invitations.accept(token, name);
    recordEvent(db, {
      actorId: member.id,
      action: 'invitation.accepted',
      targetType: 'member',
      targetId: member.id,
      metadata: { email: member.email, role: member.role },
    });
    res.status(201).json({ member });
  });

  return router;
}
