import express, { type Express } from 'express';
import type { Db } from '../db/client';
import { loadActor } from '../lib/auth';
import { ConsoleEmailSender, type EmailSender } from '../lib/email';
import { errorHandler } from '../lib/errors';
import { InvitationService } from '../lib/invitations';
import { auditRouter } from './audit';
import { acceptInvitationRouter, invitationsRouter } from './invitations';
import { membersRouter } from './members';

export interface AppOptions {
  emailSender?: EmailSender;
  appUrl?: string;
  workspaceName?: string;
  now?: () => Date;
}

export function createApp(db: Db, options: AppOptions = {}): Express {
  const app = express();
  app.use(express.json());

  const invitations = new InvitationService({
    db,
    email: options.emailSender ?? new ConsoleEmailSender(),
    appUrl: options.appUrl ?? 'http://localhost:3000',
    workspaceName: options.workspaceName ?? 'Team Lab',
    now: options.now,
  });

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api', acceptInvitationRouter(db, invitations));
  app.use(
    '/api',
    loadActor(db),
    membersRouter(db),
    invitationsRouter(db, invitations),
    auditRouter(db),
  );

  app.use(errorHandler);
  return app;
}
