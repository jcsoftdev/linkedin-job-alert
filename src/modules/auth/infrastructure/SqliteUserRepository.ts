import { Database } from 'bun:sqlite';
import type { UserRepository } from '../domain/UserRepository';
import type { User, UserFilter } from '../domain/User';
import db from '../../../shared/infrastructure/db';

export class SqliteUserRepository implements UserRepository {
  private readonly db: Database;

  constructor() {
    this.db = db;
  }

  async save(user: User): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO users (id, username, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(user.id, user.username, user.passwordHash, user.createdAt.toISOString());
  }

  async findByUsername(username: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    const row = stmt.get(username) as any;
    if (!row) return null;
    return this.mapUser(row);
  }

  async findById(id: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return this.mapUser(row);
  }

  async saveFilter(filter: UserFilter): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_filters (id, user_id, name, config, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      filter.id,
      filter.userId,
      filter.name,
      JSON.stringify(filter.config),
      filter.createdAt.toISOString()
    );
  }

  async getFilters(userId: string): Promise<UserFilter[]> {
    const stmt = this.db.prepare('SELECT * FROM user_filters WHERE user_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(userId) as any[];
    return rows.map(this.mapFilter);
  }

  async getFilterById(id: string): Promise<UserFilter | null> {
    const stmt = this.db.prepare('SELECT * FROM user_filters WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return this.mapFilter(row);
  }

  async deleteFilter(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM user_filters WHERE id = ?');
    stmt.run(id);
  }

  private mapUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at)
    };
  }

  private mapFilter(row: any): UserFilter {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      config: JSON.parse(row.config),
      createdAt: new Date(row.created_at)
    };
  }
}
