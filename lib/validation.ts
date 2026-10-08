import { badRequest } from './errors';

export const ROLES = ['owner', 'admin', 'member', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value);
}

export function requireRole(value: unknown): Role {
  if (!isRole(value)) {
    throw badRequest(`role must be one of ${ROLES.join(', ')}`);
  }
  return value;
}

export function requireEmail(value: unknown): string {
  if (!isEmail(value)) {
    throw badRequest('email must be a valid email address');
  }
  return value.trim().toLowerCase();
}
