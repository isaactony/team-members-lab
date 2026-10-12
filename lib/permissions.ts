import type { Role } from './validation';

/** Higher numbers can do more. */
export const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

export function canManageMembers(role: Role): boolean {
  return role === 'owner' || role === 'admin';
}

export function canInvite(role: Role): boolean {
  return canManageMembers(role);
}

/**
 * Owners can assign any role. Admins can assign any role except owner.
 * Everyone else cannot assign roles at all.
 */
export function canAssignRole(actorRole: Role, targetRole: Role): boolean {
  if (!canManageMembers(actorRole)) {
    return false;
  }
  if (targetRole === 'owner') {
    return actorRole === 'owner';
  }
  return ROLE_RANK[actorRole] >= ROLE_RANK[targetRole];
}

/** Members can always remove themselves. Owners and admins can remove anyone below owner. */
export function canRemoveMember(actorRole: Role, targetRole: Role, isSelf: boolean): boolean {
  if (isSelf) {
    return true;
  }
  if (!canManageMembers(actorRole)) {
    return false;
  }
  return targetRole !== 'owner' || actorRole === 'owner';
}
