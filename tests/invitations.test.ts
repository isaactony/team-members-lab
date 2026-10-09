import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext, DAY, tokenFromEmail } from './helpers';

describe('invitations API', () => {
  it('lets an owner invite a teammate and sends an email', async () => {
    const { as, email } = await createTestContext();
    const res = await as('mem_owner')
      .post('/api/invitations')
      .send({ email: 'New.Person@Example.com', role: 'member' });

    expect(res.status).toBe(201);
    expect(res.body.invitation).toMatchObject({
      email: 'new.person@example.com',
      role: 'member',
      status: 'pending',
      invitedBy: 'mem_owner',
      resentCount: 0,
    });
    expect(res.body.invitation).not.toHaveProperty('tokenHash');

    const sent = email.lastTo('new.person@example.com');
    expect(sent?.subject).toBe('Ada Lovelace invited you to join Team Lab');
    expect(sent?.text).toContain('https://lab.example.com/invitations/accept?token=');
  });

  it('defaults the role to member', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_admin').post('/api/invitations').send({ email: 'x@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.invitation.role).toBe('member');
  });

  it('does not let members invite', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_member').post('/api/invitations').send({ email: 'x@example.com' });
    expect(res.status).toBe(403);
  });

  it('rejects invalid emails', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_owner').post('/api/invitations').send({ email: 'nope' });
    expect(res.status).toBe(400);
  });

  it('rejects inviting someone who is already a member', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_owner').post('/api/invitations').send({ email: 'grace@example.com' });
    expect(res.status).toBe(409);
  });

  it('rejects a second pending invitation for the same email', async () => {
    const { as } = await createTestContext();
    await as('mem_owner').post('/api/invitations').send({ email: 'dup@example.com' });
    const res = await as('mem_owner').post('/api/invitations').send({ email: 'dup@example.com' });
    expect(res.status).toBe(409);
  });

  it('lists pending invitations for admins only', async () => {
    const { as } = await createTestContext();
    await as('mem_owner').post('/api/invitations').send({ email: 'a@example.com' });
    await as('mem_owner').post('/api/invitations').send({ email: 'b@example.com' });

    const list = await as('mem_admin').get('/api/invitations');
    expect(list.status).toBe(200);
    expect(list.body.invitations).toHaveLength(2);

    const denied = await as('mem_viewer').get('/api/invitations');
    expect(denied.status).toBe(403);
  });

  it('accepts an invitation and creates the member', async () => {
    const { app, as, email } = await createTestContext();
    await as('mem_owner').post('/api/invitations').send({ email: 'join@example.com', role: 'viewer' });
    const token = tokenFromEmail(email.lastTo('join@example.com')!.text);

    const res = await request(app)
      .post('/api/invitations/accept')
      .send({ token, name: '  Katherine Johnson ' });
    expect(res.status).toBe(201);
    expect(res.body.member).toMatchObject({
      email: 'join@example.com',
      name: 'Katherine Johnson',
      role: 'viewer',
    });

    const again = await request(app).post('/api/invitations/accept').send({ token, name: 'K' });
    expect(again.status).toBe(400);
  });

  it('rejects an unknown token', async () => {
    const { app } = await createTestContext();
    const res = await request(app)
      .post('/api/invitations/accept')
      .send({ token: 'not-a-real-token', name: 'Someone' });
    expect(res.status).toBe(404);
  });

  it('rejects an expired invitation', async () => {
    const { app, as, email, advance } = await createTestContext();
    await as('mem_owner').post('/api/invitations').send({ email: 'late@example.com' });
    const token = tokenFromEmail(email.lastTo('late@example.com')!.text);

    advance(8 * DAY);
    const res = await request(app).post('/api/invitations/accept').send({ token, name: 'Late' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('expired');
  });

  it('hides expired invitations from the pending list', async () => {
    const { as, advance } = await createTestContext();
    await as('mem_owner').post('/api/invitations').send({ email: 'old@example.com' });
    advance(8 * DAY);
    const list = await as('mem_owner').get('/api/invitations');
    expect(list.body.invitations).toHaveLength(0);
  });

  it('resends with a new token that replaces the old one', async () => {
    const { app, as, email } = await createTestContext();
    const created = await as('mem_owner').post('/api/invitations').send({ email: 'r@example.com' });
    const firstToken = tokenFromEmail(email.lastTo('r@example.com')!.text);

    const resent = await as('mem_owner').post(`/api/invitations/${created.body.invitation.id}/resend`);
    expect(resent.status).toBe(200);
    expect(resent.body.invitation.resentCount).toBe(1);
    const secondToken = tokenFromEmail(email.lastTo('r@example.com')!.text);
    expect(secondToken).not.toBe(firstToken);

    const old = await request(app).post('/api/invitations/accept').send({ token: firstToken, name: 'R' });
    expect(old.status).toBe(404);
    const fresh = await request(app).post('/api/invitations/accept').send({ token: secondToken, name: 'R' });
    expect(fresh.status).toBe(201);
  });

  it('allows two resends and rejects a third', async () => {
    const { as, email } = await createTestContext();
    const created = await as('mem_owner').post('/api/invitations').send({ email: 'limit@example.com' });
    const id = created.body.invitation.id;
    for (let i = 0; i < 2; i += 1) {
      const ok = await as('mem_owner').post(`/api/invitations/${id}/resend`);
      expect(ok.status).toBe(200);
      expect(ok.body.invitation.resentCount).toBe(i + 1);
    }
    const blocked = await as('mem_owner').post(`/api/invitations/${id}/resend`);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('too_many_resends');
    expect(email.sent).toHaveLength(3); // The initial invitation plus two resends.
  });

  it('revokes a pending invitation', async () => {
    const { app, as, email } = await createTestContext();
    const created = await as('mem_owner').post('/api/invitations').send({ email: 'gone@example.com' });
    const token = tokenFromEmail(email.lastTo('gone@example.com')!.text);

    const revoked = await as('mem_owner').delete(`/api/invitations/${created.body.invitation.id}`);
    expect(revoked.status).toBe(200);
    expect(revoked.body.invitation.status).toBe('revoked');

    const res = await request(app).post('/api/invitations/accept').send({ token, name: 'Gone' });
    expect(res.status).toBe(400);
  });
});
