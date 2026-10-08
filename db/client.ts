import initSqlJs, { type Database, type SqlValue } from 'sql.js';
import { runMigrations } from './migrate';

export type Params = SqlValue[];
export type Row = Record<string, SqlValue>;

/**
 * A thin wrapper over sql.js that returns plain objects.
 * The whole app runs on an in-memory SQLite database, which keeps the lab easy to run anywhere.
 */
export class Db {
  constructor(private readonly raw: Database) {}

  all<T = Row>(sql: string, params: Params = []): T[] {
    const statement = this.raw.prepare(sql);
    try {
      statement.bind(params);
      const rows: T[] = [];
      while (statement.step()) {
        rows.push(statement.getAsObject() as T);
      }
      return rows;
    } finally {
      statement.free();
    }
  }

  get<T = Row>(sql: string, params: Params = []): T | undefined {
    return this.all<T>(sql, params)[0];
  }

  run(sql: string, params: Params = []): number {
    this.raw.run(sql, params);
    return this.raw.getRowsModified();
  }

  transaction<T>(work: () => T): T {
    this.raw.run('BEGIN');
    try {
      const result = work();
      this.raw.run('COMMIT');
      return result;
    } catch (error) {
      this.raw.run('ROLLBACK');
      throw error;
    }
  }

  close(): void {
    this.raw.close();
  }
}

export async function createDatabase(): Promise<Db> {
  const SQL = await initSqlJs();
  const raw = new SQL.Database();
  raw.run('PRAGMA foreign_keys = ON');
  runMigrations(raw);
  return new Db(raw);
}
