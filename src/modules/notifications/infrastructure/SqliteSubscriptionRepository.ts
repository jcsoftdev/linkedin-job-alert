import { Database } from 'bun:sqlite';
import type { SubscriptionRepository } from '../domain/SubscriptionRepository';
import type { PushSubscription, StoredSubscription } from '../domain/Subscription';
import db from '../../../shared/infrastructure/db';

export class SqliteSubscriptionRepository implements SubscriptionRepository {
  private readonly db: Database;

  constructor() {
    this.db = db;
  }

  async save(subscription: PushSubscription, userId?: string): Promise<void> {
    const id = crypto.randomUUID();
    const keysStr = JSON.stringify(subscription.keys);
    
    // Check if exists to avoid duplicates (by endpoint)
    const existing = this.db.query('SELECT id FROM push_subscriptions WHERE endpoint = ?').get(subscription.endpoint);
    
    if (existing) {
        // Update user_id if provided and different? Or just ignore
        if (userId) {
            this.db.run('UPDATE push_subscriptions SET user_id = ? WHERE endpoint = ?', [userId, subscription.endpoint]);
        }
        return;
    }

    this.db.run(
      'INSERT INTO push_subscriptions (id, user_id, endpoint, keys) VALUES (?, ?, ?, ?)',
      [id, userId || null, subscription.endpoint, keysStr]
    );
  }

  async getAll(): Promise<StoredSubscription[]> {
    const rows = this.db.query('SELECT * FROM push_subscriptions').all() as any[];
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      endpoint: row.endpoint,
      keys: JSON.parse(row.keys),
      createdAt: new Date(row.created_at)
    }));
  }

  async delete(endpoint: string): Promise<void> {
    this.db.run('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
  }
}
