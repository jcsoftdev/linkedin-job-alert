import webpush from 'web-push';
import type { SubscriptionRepository } from '../domain/SubscriptionRepository';
import type { PushSubscription } from '../domain/Subscription';

export class NotificationService {
  constructor(
    private subscriptionRepo: SubscriptionRepository,
    publicKey: string,
    privateKey: string,
    private email: string = 'mailto:example@example.com'
  ) {
    webpush.setVapidDetails(
      email,
      publicKey,
      privateKey
    );
  }

  async subscribe(subscription: PushSubscription, userId?: string): Promise<void> {
    await this.subscriptionRepo.save(subscription, userId);
  }

  async sendNotificationToAll(payload: any): Promise<void> {
    const subscriptions = await this.subscriptionRepo.getAll();
    const payloadString = JSON.stringify(payload);

    const promises = subscriptions.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: sub.keys
      };

      try {
        await webpush.sendNotification(pushSub, payloadString);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription is no longer valid
          console.log(`Subscription expired/invalid for ${sub.endpoint}, deleting...`);
          await this.subscriptionRepo.delete(sub.endpoint);
        } else {
          console.error(`Error sending notification to ${sub.endpoint}:`, error);
        }
      }
    });

    await Promise.all(promises);
  }
  
  async sendNotification(userId: string, payload: any): Promise<void> {
      // Implement targeted notification if needed
      // For now we only broadcast or no-op
  }
}
