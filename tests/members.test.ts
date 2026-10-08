import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from './helpers';

describe('members API', () => {
  it('rejects requests without an acting member', async () => {
    const { app } = await createTestContext();
    const res = await request(app).get('/api/members');
    expect(res.status).toBe(401);
  });

  it('lists members in the order they joined', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_viewer').get('/api/members');
    expect(res.status).toBe(200);
    expect(res.body.members.map((m: { id: string }) => m.id)).toEqual([
      'mem_owner',
      'mem_admin',
      'mem_member',
      'mem_member2',
      'mem_viewer',
    ]);
  });

  it('returns 404 for an unknown member', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_owner').get('/api/members/nope');
    expect(res.status).toBe(404);
  });

  it('lets an admin change a member role', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_admin').patch('/api/members/mem_member/role').send({ role: 'viewer' });
    expect(res.status).toBe(200);
    expect(res.body.member.role).toBe('viewer');
  });

  it('does not let a member change roles', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_member').patch('/api/members/mem_viewer/role').send({ role: 'admin' });
    expect(res.status).toBe(403);
  });

  it('does not let an admin create an owner', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_admin').patch('/api/members/mem_member/role').send({ role: 'owner' });
    expect(res.status).toBe(403);
  });

  it('keeps at least one owner', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_owner').patch('/api/members/mem_owner/role').send({ role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid role', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_owner').patch('/api/members/mem_member/role').send({ role: 'boss' });
    expect(res.status).toBe(400);
  });

  it('lets members remove themselves', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_member').delete('/api/members/mem_member');
    expect(res.status).toBe(204);
  });

  it('does not let a viewer remove someone else', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_viewer').delete('/api/members/mem_member');
    expect(res.status).toBe(403);
  });

  it('does not remove the last owner', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_owner').delete('/api/members/mem_owner');
    expect(res.status).toBe(400);
  });
});
