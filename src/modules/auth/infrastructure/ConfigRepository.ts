import { Database } from 'bun:sqlite';

export class ConfigRepository {
  constructor(private readonly db: Database) {}

  get(key: string): string | null {
    const row = this.db.query<{ value: string }, [string]>('SELECT value FROM system_config WHERE key = ?').get(key);
    return row ? row.value : null;
  }

  set(key: string, value: string): void {
    this.db.run(
      `INSERT INTO system_config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, value]
    );
  }
}
