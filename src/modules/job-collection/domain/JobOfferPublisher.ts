import type { JobPost } from './JobPost';

export interface JobOfferPublisher {
  publish(post: JobPost, userId?: string): Promise<void> | void;
}
