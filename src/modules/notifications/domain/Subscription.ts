export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: PushSubscriptionKeys;
}

export interface StoredSubscription {
  id: string;
  userId: string | null; // Optional, if we want to support anonymous or user-bound subs
  endpoint: string;
  keys: PushSubscriptionKeys;
  createdAt: Date;
}
