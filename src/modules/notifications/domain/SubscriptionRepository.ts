import type { StoredSubscription, PushSubscription } from './Subscription';

export interface SubscriptionRepository {
  save(subscription: PushSubscription, userId?: string): Promise<void>;
  getAll(): Promise<StoredSubscription[]>;
  delete(endpoint: string): Promise<void>;
}
