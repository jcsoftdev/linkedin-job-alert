import type { UserRepository } from '../domain/UserRepository';
import type { UserFilter, FilterConfig } from '../domain/User';

export class FilterManagement {
  constructor(private readonly repository: UserRepository) {}

  async createFilter(userId: string, name: string, config: FilterConfig): Promise<UserFilter> {
    const filter: UserFilter = {
      id: crypto.randomUUID(),
      userId,
      name,
      config,
      createdAt: new Date()
    };
    await this.repository.saveFilter(filter);
    return filter;
  }

  async getUserFilters(userId: string): Promise<UserFilter[]> {
    return this.repository.getFilters(userId);
  }

  async deleteFilter(userId: string, filterId: string): Promise<void> {
    const filter = await this.repository.getFilterById(filterId);
    if (!filter) {
      throw new Error('Filter not found');
    }
    if (filter.userId !== userId) {
      throw new Error('Unauthorized');
    }
    await this.repository.deleteFilter(filterId);
  }
}
