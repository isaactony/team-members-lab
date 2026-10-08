import { describe, expect, it } from 'vitest';
import { canAssignRole, canInvite, canManageMembers, canRemoveMember } from '../lib/permissions';

describe('permissions', () => {
  it('only lets owners and admins manage members', () => {
    expect(canManageMembers('owner')).toBe(true);
    expect(canManageMembers('admin')).toBe(true);
    expect(canManageMembers('member')).toBe(false);
    expect(canManageMembers('viewer')).toBe(false);
  });

  it('only lets owners and admins invite', () => {
    expect(canInvite('admin')).toBe(true);
    expect(canInvite('member')).toBe(false);
  });

  it('lets owners assign any role', () => {
    expect(canAssignRole('owner', 'owner')).toBe(true);
    expect(canAssignRole('owner', 'viewer')).toBe(true);
  });

  it('lets admins assign any role except owner', () => {
    expect(canAssignRole('admin', 'owner')).toBe(false);
    expect(canAssignRole('admin', 'admin')).toBe(true);
    expect(canAssignRole('admin', 'member')).toBe(true);
  });

  it('does not let members or viewers assign roles', () => {
    expect(canAssignRole('member', 'viewer')).toBe(false);
    expect(canAssignRole('viewer', 'viewer')).toBe(false);
  });

  it('decides who can remove whom', () => {
    expect(canRemoveMember('viewer', 'viewer', true)).toBe(true);
    expect(canRemoveMember('viewer', 'member', false)).toBe(false);
    expect(canRemoveMember('admin', 'member', false)).toBe(true);
    expect(canRemoveMember('admin', 'owner', false)).toBe(false);
    expect(canRemoveMember('owner', 'owner', false)).toBe(true);
  });
});
