import { useState } from 'react';
import { isEmail, type Role } from '../lib/validation';
import { formatRole } from '../lib/format';

export interface InviteDialogProps {
  open: boolean;
  assignableRoles: Role[];
  defaultRole?: Role;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (input: { email: string; role: Role }) => void;
  onClose: () => void;
}

export function InviteDialog({
  open,
  assignableRoles,
  defaultRole = 'member',
  submitting = false,
  error = null,
  onSubmit,
  onClose,
}: InviteDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(
    assignableRoles.includes(defaultRole) ? defaultRole : (assignableRoles[0] ?? 'viewer'),
  );
  const [touched, setTouched] = useState(false);

  if (!open) {
    return null;
  }

  const emailIsValid = isEmail(email.trim());
  const showEmailError = touched && !emailIsValid;

  const submit = () => {
    setTouched(true);
    if (!emailIsValid || submitting) {
      return;
    }
    onSubmit({ email: email.trim().toLowerCase(), role });
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="invite-title" className="dialog">
      <h2 id="invite-title">Invite a teammate</h2>
      <p>They'll get an email with a link that works for 7 days.</p>

      <label htmlFor="invite-email">Email address</label>
      <input
        id="invite-email"
        type="email"
        autoComplete="off"
        value={email}
        aria-invalid={showEmailError}
        aria-describedby={showEmailError ? 'invite-email-error' : undefined}
        onChange={(event) => setEmail(event.target.value)}
        onBlur={() => setTouched(true)}
      />
      {showEmailError ? (
        <p id="invite-email-error" className="field-error">
          Enter a valid email address.
        </p>
      ) : null}

      <label htmlFor="invite-role">Role</label>
      <select
        id="invite-role"
        value={role}
        onChange={(event) => setRole(event.target.value as Role)}
      >
        {assignableRoles.map((option) => (
          <option key={option} value={option}>
            {formatRole(option)}
          </option>
        ))}
      </select>

      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}

      <div className="dialog-actions">
        <button type="button" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="button" className="primary" onClick={submit} disabled={submitting}>
          {submitting ? 'Sending…' : 'Send invitation'}
        </button>
      </div>
    </div>
  );
}
