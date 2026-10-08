import express, { type Express } from 'express';
import type { Db } from '../db/client';
import { loadActor } from '../lib/auth';
import { errorHandler } from '../lib/errors';
import { membersRouter } from './members';

export function createApp(db: Db): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api', loadActor(db), membersRouter(db));

  app.use(errorHandler);
  return app;
}
