import type { PostRepository } from '../domain/PostRepository';
import type { JobPost } from '../domain/JobPost';

export class GetJobOffers {
  constructor(private readonly repository: PostRepository) {}

  async execute(userId?: string, filterId?: string): Promise<JobPost[]> {
    return this.repository.getAll(userId, filterId);
  }
}
