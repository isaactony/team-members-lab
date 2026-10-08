import type { NextFunction, Request, Response } from 'express';
import type { Db } from '../db/client';
import { getMember, type Member } from './members';
import { unauthorized } from './errors';

declare module 'express-serve-static-core' {
  interface Request {
    actor?: Member;
  }
}

/**
 * The lab has no real login. The acting member is passed in the x-member-id header,
 * which keeps the API easy to try with curl.
 */
export function loadActor(db: Db) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.header('x-member-id');
    const actor = userId ? getMember(db, userId) : undefined;
    if (!actor) {
      next(unauthorized());
      return;
    }
    req.actor = actor;
    next();
  };
}

export function requireActor(req: Request): Member {
  if (!req.actor) {
    throw unauthorized();
  }
  return req.actor;
}
