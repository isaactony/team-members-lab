import { Router } from 'express';
import type { Db } from '../db/client';
import { recordEvent } from '../lib/audit';
import { requireActor } from '../lib/auth';
import { badRequest, forbidden, notFound } from '../lib/errors';
import {
  countMembersWithRole,
  getMember,
  listMembers,
  removeMember,
  updateMemberRole,
} from '../lib/members';
import { canAssignRole, canManageMembers, canRemoveMember } from '../lib/permissions';
import { requireRole } from '../lib/validation';

export function membersRouter(db: Db): Router {
  const router = Router();

  router.get('/members', (_req, res) => {
    res.json({ members: listMembers(db) });
  });

  router.get('/members/:userId', (req, res) => {
    const member = getMember(db, req.params.userId);
    if (!member) {
      throw notFound('Member not found');
    }
    res.json({ member });
  });

  router.delete('/members/:userId', (req, res) => {
    const actor = requireActor(req);
    const userId = req.params.userId;
    const member = getMember(db, userId);
    if (!member) {
      throw notFound('Member not found');
    }

    const isSelf = actor.id === userId;
    if (!canRemoveMember(actor.role, member.role, isSelf)) {
      throw forbidden('Only owners and admins can remove members');
    }
    if (member.role === 'owner' && countMembersWithRole(db, 'owner') === 1) {
      throw badRequest('You cannot remove the last owner');
    }

    db.transaction(() => {
      removeMember(db, userId);
      recordEvent(db, {
        actorId: isSelf ? null : actor.id,
        action: 'member.removed',
        targetType: 'member',
        targetId: userId,
        metadata: { email: member.email, role: member.role },
      });
    });
    res.status(204).end();
  });

  router.patch('/members/:userId/role', (req, res) => {
    const actor = requireActor(req);
    if (!canManageMembers(actor.role)) {
      throw forbidden('Only owners and admins can change roles');
    }

    const userId = req.params.userId;
    const member = getMember(db, userId);
    if (!member) {
      throw notFound('Member not found');
    }

    const role = requireRole(req.body?.role);
    if (!canAssignRole(actor.role, role)) {
      throw forbidden('Only owners can make someone an owner');
    }
    if (member.role === 'owner' && role !== 'owner' && countMembersWithRole(db, 'owner') === 1) {
      throw badRequest('A workspace needs at least one owner');
    }

    const updated = db.transaction(() => {
      const next = updateMemberRole(db, userId, role);
      recordEvent(db, {
        actorId: actor.id,
        action: 'member.role_changed',
        targetType: 'member',
        targetId: userId,
        metadata: { email: member.email, from: member.role, to: role },
      });
      return next;
    });
    res.json({ member: updated });
  });

  return router;
}
