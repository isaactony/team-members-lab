import type { Role } from '../lib/validation';
import { formatRole } from '../utils/format';

const ROLE_TONES: Record<Role, string> = {
  owner: 'badge badge--owner',
  admin: 'badge badge--admin',
  member: 'badge badge--member',
  viewer: 'badge badge--viewer',
};

export function RoleBadge({ role }: { role: Role }) {
  return <span className={ROLE_TONES[role]}>{formatRole(role)}</span>;
}
