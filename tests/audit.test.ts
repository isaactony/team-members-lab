import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describeEvent, listEvents, recordEvent, type AuditEvent } from '../lib/audit';
import { AuditLog } from '../ui/AuditLog';
import { createTestContext, tokenFromEmail } from './helpers';

describe('audit log', () => {
  it('records role changes with the old and new role', async () => {
    const { as } = await createTestContext();
    await as('mem_owner').patch('/api/members/mem_member/role').send({ role: 'admin' });

    const res = await as('mem_owner').get('/api/audit');
    expect(res.status).toBe(200);
    expect(res.body.events[0]).toMatchObject({
      actorId: 'mem_owner',
      action: 'member.role_changed',
      targetId: 'mem_member',
      metadata: { from: 'member', to: 'admin' },
    });
  });

  it('records the invitation lifecycle', async () => {
    const { app, as, email } = await createTestContext();
    await as('mem_owner').post('/api/invitations').send({ email: 'life@example.com', role: 'viewer' });
    const token = tokenFromEmail(email.lastTo('life@example.com')!.text);
    await request(app).post('/api/invitations/accept').send({ token, name: 'Life Cycle' });

    const res = await as('mem_owner').get('/api/audit');
    const actions = res.body.events.map((event: AuditEvent) => event.action);
    expect(actions).toContain('invitation.created');
    expect(actions).toContain('invitation.accepted');
  });

  it('only shows the audit log to owners and admins', async () => {
    const { as } = await createTestContext();
    const res = await as('mem_member').get('/api/audit');
    expect(res.status).toBe(403);
  });

  it('rejects unknown actions and bad limits', async () => {
    const { as } = await createTestContext();
    expect((await as('mem_owner').get('/api/audit?action=nope')).status).toBe(400);
    expect((await as('mem_owner').get('/api/audit?limit=abc')).status).toBe(400);
  });

  it('pages through events newest first', async () => {
    const { db } = await createTestContext();
    for (let i = 0; i < 5; i += 1) {
      recordEvent(db, {
        actorId: 'mem_owner',
        action: 'invitation.created',
        targetType: 'invitation',
        targetId: `inv_${i}`,
        metadata: { email: `p${i}@example.com`, role: 'member' },
        at: new Date(Date.UTC(2026, 9, 1, 12, i)),
      });
    }

    const first = listEvents(db, { limit: 2 });
    expect(first.events.map((event) => event.targetId)).toEqual(['inv_4', 'inv_3']);
    expect(first.nextBefore).not.toBeNull();

    const second = listEvents(db, { limit: 2, before: first.nextBefore! });
    expect(second.events.map((event) => event.targetId)).toEqual(['inv_2', 'inv_1']);
  });

  it('caps the page size', async () => {
    const { db } = await createTestContext();
    expect(listEvents(db, { limit: 10_000 }).events.length).toBeLessThanOrEqual(100);
  });

  it('describes events in plain language', () => {
    const base = {
      id: 'evt_1',
      targetType: 'member' as const,
      createdAt: '2026-10-02T12:00:00.000Z',
    };
    const names = { mem_owner: 'Ada Lovelace', mem_member: 'Linus Torvalds' };

    expect(
      describeEvent(
        {
          ...base,
          actorId: 'mem_owner',
          action: 'member.role_changed',
          targetId: 'mem_member',
          metadata: { from: 'member', to: 'admin' },
        },
        names,
      ),
    ).toBe('Ada Lovelace changed Linus Torvalds from member to admin');

    expect(
      describeEvent(
        {
          ...base,
          actorId: 'mem_owner',
          action: 'invitation.created',
          targetType: 'invitation',
          targetId: 'inv_1',
          metadata: { email: 'new@example.com', role: 'viewer' },
        },
        names,
      ),
    ).toBe('Ada Lovelace invited new@example.com as viewer');
  });

  it('renders the activity feed', () => {
    const events: AuditEvent[] = [
      {
        id: 'evt_1',
        actorId: 'mem_owner',
        action: 'invitation.revoked',
        targetType: 'invitation',
        targetId: 'inv_1',
        metadata: { email: 'gone@example.com' },
        createdAt: '2026-10-02T11:00:00.000Z',
      },
    ];
    const html = renderToStaticMarkup(
      createElement(AuditLog, {
        events,
        names: { mem_owner: 'Ada Lovelace' },
        now: new Date('2026-10-02T12:00:00.000Z'),
        hasMore: true,
      }),
    );
    expect(html).toContain('Ada Lovelace revoked the invitation to gone@example.com');
    expect(html).toContain('1 hour ago');
    expect(html).toContain('Show older activity');
  });
});
