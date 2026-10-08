import request from 'supertest';
import { createDatabase, type Db } from '../db/client';
import { seedMembers } from '../db/seed';
import { createApp } from '../api/server';
import { InMemoryEmailSender } from '../lib/email';

export interface TestContextOptions {
  now?: Date;
}

export async function createTestContext(options: TestContextOptions = {}) {
  const db: Db = await createDatabase();
  seedMembers(db);
  const email = new InMemoryEmailSender();
  const clock = { now: options.now ?? new Date('2026-10-02T12:00:00.000Z') };
  const app = createApp(db, {
    emailSender: email,
    appUrl: 'https://lab.example.com',
    workspaceName: 'Team Lab',
    now: () => clock.now,
  });
  const as = (userId: string) => ({
    get: (path: string) => request(app).get(path).set('x-member-id', userId),
    post: (path: string) => request(app).post(path).set('x-member-id', userId),
    patch: (path: string) => request(app).patch(path).set('x-member-id', userId),
    delete: (path: string) => request(app).delete(path).set('x-member-id', userId),
  });
  const advance = (ms: number) => {
    clock.now = new Date(clock.now.getTime() + ms);
  };
  return { db, app, as, email, advance };
}

/** Pulls the raw token out of the accept link in an invitation email. */
export function tokenFromEmail(text: string): string {
  const match = text.match(/token=([A-Za-z0-9_\-%]+)/);
  if (!match?.[1]) {
    throw new Error('No invitation token found in email');
  }
  return decodeURIComponent(match[1]);
}

export const DAY = 24 * 60 * 60 * 1000;
