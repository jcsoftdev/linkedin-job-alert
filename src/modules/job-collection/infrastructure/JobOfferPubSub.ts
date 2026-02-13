import type { JobOfferPublisher } from '../domain/JobOfferPublisher';
import type { JobPost } from '../domain/JobPost';
import type { NotificationService } from '../../notifications/application/NotificationService';

export class JobOfferPubSub implements JobOfferPublisher {
  // Map of userId -> Set of subscription IDs
  private readonly userSubscriptions = new Map<string, Set<string>>();
  // Map of subscription ID -> Controller
  private readonly controllers = new Map<string, ReadableStreamDefaultController<Uint8Array>>();
  private readonly encoder = new TextEncoder();
  private heartbeatInterval?: Timer;
  private isRunning = false;

  constructor(private readonly notificationService?: NotificationService) {
    this.startHeartbeat();
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const ping = this.encoder.encode(': ping\n\n');
      for (const controller of this.controllers.values()) {
        try {
          controller.enqueue(ping);
        } catch {
          // Controller might be closed, it will be cleaned up by subscription map if needed
          // but for simplicity here we just catch
        }
      }
    }, 30000); // 30 seconds
  }

  async publish(post: JobPost, userId?: string) {
    console.log(`PubSub: Publishing post to user=${userId || 'anon'}`);
    
    // Send SSE event
    if (userId) {
        this.publishEvent(userId, 'job', post);
    }

    // Send Push Notification
    if (this.notificationService) {
        const payload = {
            title: `New Job: ${post.title}`,
            body: `${post.company} - ${post.location}`,
            url: post.url,
            icon: '/vite.svg'
        };
        // Broadcast to all for now as we don't have user-bound push subs fully enforced yet
        // or if we do, we should filter. For now, broadcast.
        await this.notificationService.sendNotificationToAll(payload);
    }
  }

  publishStatus(userId: string, status: { running: boolean }) {
    this.isRunning = status.running;
    this.publishEvent(userId, 'status', status);
  }

  publishStatusToAll(status: { running: boolean }) {
    this.isRunning = status.running;
    this.publishEventToAll('status', status);
  }

  subscribe(userId: string, controller: ReadableStreamDefaultController<Uint8Array>) {
    const subId = crypto.randomUUID();
    console.log(`PubSub: New subscription for user=${userId}, subId=${subId}`);
    
    // Store controller
    this.controllers.set(subId, controller);
    
    // Store user subscription mapping
    if (!this.userSubscriptions.has(userId)) {
      this.userSubscriptions.set(userId, new Set());
    }
    this.userSubscriptions.get(userId)!.add(subId);

    controller.enqueue(this.encoder.encode('event: ready\ndata: connected\n\n'));
    
    // Send initial status
    const statusMessage = `event: status\ndata: ${JSON.stringify({ running: this.isRunning })}\n\n`;
    controller.enqueue(this.encoder.encode(statusMessage));
    
    return () => this.cleanupSubscription(userId, subId);
  }

  private publishEvent(userId: string, eventName: string, payload: unknown) {
    const subscriptionIds = this.userSubscriptions.get(userId);
    console.log(`PubSub: Found ${subscriptionIds?.size || 0} subscriptions for user=${userId}`);
    if (!subscriptionIds) return;

    const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;

    for (const subId of subscriptionIds) {
      const controller = this.controllers.get(subId);
      if (controller) {
        try {
          console.log(`PubSub: Enqueueing payload to subId=${subId}`);
          controller.enqueue(this.encoder.encode(message));
        } catch (e) {
          console.error(`PubSub: Error enqueueing to subId=${subId}`, e);
          this.cleanupSubscription(userId, subId);
        }
      }
    }
  }

  private publishEventToAll(eventName: string, payload: unknown) {
    for (const userId of this.userSubscriptions.keys()) {
      this.publishEvent(userId, eventName, payload);
    }
  }

  private cleanupSubscription(userId: string, subId: string) {
    // Remove controller
    const controller = this.controllers.get(subId);
    if (controller) {
      try {
        controller.close();
      } catch {}
      this.controllers.delete(subId);
    }

    // Remove from user map
    const userSubs = this.userSubscriptions.get(userId);
    if (userSubs) {
      userSubs.delete(subId);
      if (userSubs.size === 0) {
        this.userSubscriptions.delete(userId);
      }
    }
  }
}
