import { describe, expect, it } from 'vitest';
import initSqlJs from 'sql.js';
import { runMigrations } from '../db/migrate';

describe('migrations', () => {
  it('applies every migration once and skips them on a second run', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    const first = runMigrations(db);
    expect(first.applied.length).toBeGreaterThan(0);
    const second = runMigrations(db);
    expect(second.applied).toEqual([]);
    expect(second.skipped).toEqual(first.applied);
  });
});
