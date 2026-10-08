import request from 'supertest';
import { createDatabase, type Db } from '../db/client';
import { seedMembers } from '../db/seed';
import { createApp } from '../api/server';

export async function createTestContext() {
  const db: Db = await createDatabase();
  seedMembers(db);
  const app = createApp(db);
  const as = (memberId: string) => ({
    get: (path: string) => request(app).get(path).set('x-member-id', memberId),
    post: (path: string) => request(app).post(path).set('x-member-id', memberId),
    patch: (path: string) => request(app).patch(path).set('x-member-id', memberId),
    delete: (path: string) => request(app).delete(path).set('x-member-id', memberId),
  });
  return { db, app, as };
}
