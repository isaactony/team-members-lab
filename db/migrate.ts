import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Database } from 'sql.js';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

export interface MigrationResult {
  applied: string[];
  skipped: string[];
}

/**
 * Applies every .sql file in db/migrations in filename order.
 * Applied migrations are recorded in schema_migrations so a second run is a no-op.
 */
export function runMigrations(db: Database, dir: string = MIGRATIONS_DIR): MigrationResult {
  db.run(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name       TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);

  const files = readdirSync(dir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const alreadyApplied = new Set<string>();
  const rows = db.exec('SELECT name FROM schema_migrations');
  for (const row of rows[0]?.values ?? []) {
    alreadyApplied.add(String(row[0]));
  }

  const result: MigrationResult = { applied: [], skipped: [] };
  for (const file of files) {
    if (alreadyApplied.has(file)) {
      result.skipped.push(file);
      continue;
    }
    const sql = readFileSync(join(dir, file), 'utf8');
    db.run('BEGIN');
    try {
      db.run(sql);
      db.run('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)', [
        file,
        new Date().toISOString(),
      ]);
      db.run('COMMIT');
      result.applied.push(file);
    } catch (error) {
      db.run('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
    }
  }
  return result;
}
