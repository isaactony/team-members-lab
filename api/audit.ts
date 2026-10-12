import { Router } from 'express';
import type { Db } from '../db/client';
import { isAuditAction, listEvents, type AuditAction } from '../lib/audit';
import { requireActor } from '../lib/auth';
import { badRequest, forbidden } from '../lib/errors';
import { canManageMembers } from '../lib/permissions';

export function auditRouter(db: Db): Router {
  const router = Router();

  router.get('/audit', (req, res) => {
    const actor = requireActor(req);
    if (!canManageMembers(actor.role)) {
      throw forbidden('Only owners and admins can see the audit log');
    }

    const { limit, before, action, targetId } = req.query;
    if (action !== undefined && !isAuditAction(action)) {
      throw badRequest('Unknown audit action');
    }
    const parsedLimit = limit === undefined ? undefined : Number(limit);
    if (parsedLimit !== undefined && !Number.isInteger(parsedLimit)) {
      throw badRequest('limit must be a whole number');
    }

    res.json(
      listEvents(db, {
        limit: parsedLimit,
        before: typeof before === 'string' ? before : undefined,
        action: action as AuditAction | undefined,
        targetId: typeof targetId === 'string' ? targetId : undefined,
      }),
    );
  });

  return router;
}
