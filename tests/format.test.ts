import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatName,
  formatRelative,
  formatRole,
  initials,
  pluralize,
  truncate,
} from '../utils/format';

describe('format helpers', () => {
  it('normalizes names', () => {
    expect(formatName('  ada   lovelace ')).toBe('Ada Lovelace');
  });

  it('builds initials', () => {
    expect(initials('grace brewster hopper')).toBe('GH');
    expect(initials('cher')).toBe('C');
    expect(initials('   ')).toBe('?');
  });

  it('labels roles', () => {
    expect(formatRole('admin')).toBe('Admin');
  });

  it('formats dates in UTC', () => {
    expect(formatDate('2025-01-14T09:00:00.000Z')).toBe('Jan 14, 2025');
  });

  it('formats relative times', () => {
    const now = new Date('2026-10-02T12:00:00.000Z');
    expect(formatRelative(null, now)).toBe('Never');
    expect(formatRelative('2026-10-02T11:59:30.000Z', now)).toBe('Just now');
    expect(formatRelative('2026-10-02T11:00:00.000Z', now)).toBe('1 hour ago');
    expect(formatRelative('2026-09-29T12:00:00.000Z', now)).toBe('3 days ago');
    expect(formatRelative('2026-01-01T12:00:00.000Z', now)).toBe('Jan 1, 2026');
  });

  it('pluralizes', () => {
    expect(pluralize(1, 'member')).toBe('member');
    expect(pluralize(2, 'member')).toBe('members');
  });

  it('truncates long text', () => {
    expect(truncate('Change Stack', 20)).toBe('Change Stack');
    expect(truncate('Change Stack review', 10)).toBe('Change St…');
  });
});
