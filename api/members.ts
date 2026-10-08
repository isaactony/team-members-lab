import { Router } from 'express';
import type { Db } from '../db/client';
import { requireActor } from '../lib/auth';
import { badRequest, forbidden, notFound } from '../lib/errors';
import {
  countMembersWithRole,
  getMember,
  listMembers,
  removeMember,
  updateMemberRole,
} from '../lib/members';
import { requireRole } from '../lib/validation';

export function membersRouter(db: Db): Router {
  const router = Router();

  router.get('/members', (_req, res) => {
    res.json({ members: listMembers(db) });
  });

  router.get('/members/:memberId', (req, res) => {
    const member = getMember(db, req.params.memberId);
    if (!member) {
      throw notFound('Member not found');
    }
    res.json({ member });
  });

  router.patch('/members/:memberId/role', (req, res) => {
    const actor = requireActor(req);
    if (actor.role !== 'owner' && actor.role !== 'admin') {
      throw forbidden('Only owners and admins can change roles');
    }

    const memberId = req.params.memberId;
    const member = getMember(db, memberId);
    if (!member) {
      throw notFound('Member not found');
    }

    const role = requireRole(req.body?.role);
    if (role === 'owner' && actor.role !== 'owner') {
      throw forbidden('Only owners can make someone an owner');
    }
    if (member.role === 'owner' && role !== 'owner' && countMembersWithRole(db, 'owner') === 1) {
      throw badRequest('A workspace needs at least one owner');
    }

    res.json({ member: updateMemberRole(db, memberId, role) });
  });

  router.delete('/members/:memberId', (req, res) => {
    const actor = requireActor(req);
    const memberId = req.params.memberId;
    const isSelf = actor.id === memberId;
    if (!isSelf && actor.role !== 'owner' && actor.role !== 'admin') {
      throw forbidden('Only owners and admins can remove members');
    }

    const member = getMember(db, memberId);
    if (!member) {
      throw notFound('Member not found');
    }
    if (member.role === 'owner' && countMembersWithRole(db, 'owner') === 1) {
      throw badRequest('You cannot remove the last owner');
    }

    removeMember(db, memberId);
    res.status(204).end();
  });

  return router;
}
