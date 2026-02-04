import { Database } from 'bun:sqlite';
import type { JobRunLock } from '../domain/JobRunLock';
import db from '../../../shared/infrastructure/db';

export class SqliteJobRunLock implements JobRunLock {
  private readonly db: Database;

  constructor() {
    this.db = db;
  }

  async acquire(key: string, ttlMs: number): Promise<boolean> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);
    const nowIso = now.toISOString();
    const expiresIso = expiresAt.toISOString();

    const tx = this.db.transaction((lockKey: string, startedAt: string, expiresAtValue: string) => {
      this.db.prepare('DELETE FROM job_run_locks WHERE expires_at <= ?').run(startedAt);
      const result = this.db
        .prepare('INSERT OR IGNORE INTO job_run_locks (lock_key, started_at, expires_at) VALUES (?, ?, ?)')
        .run(lockKey, startedAt, expiresAtValue);
      return result.changes === 1;
    });

    return tx(key, nowIso, expiresIso);
  }

  async release(key: string): Promise<void> {
    this.db.prepare('DELETE FROM job_run_locks WHERE lock_key = ?').run(key);
  }

  async isLocked(key: string): Promise<boolean> {
    const nowIso = new Date().toISOString();
    this.db.prepare('DELETE FROM job_run_locks WHERE expires_at <= ?').run(nowIso);
    const row = this.db
      .prepare('SELECT 1 FROM job_run_locks WHERE lock_key = ?')
      .get(key);
    return !!row;
  }
}
