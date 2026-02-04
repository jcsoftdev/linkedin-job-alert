import type { JobPost } from './JobPost';

export interface PostRepository {
  save(post: JobPost, userId?: string, filterId?: string): Promise<void>;
  exists(url: string): Promise<boolean>;
  existsForUser(url: string, userId: string): Promise<boolean>;
  getByUrl(url: string): Promise<JobPost | null>;
  getAll(userId?: string, filterId?: string): Promise<JobPost[]>;
}
