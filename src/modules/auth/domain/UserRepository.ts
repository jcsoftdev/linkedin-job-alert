import type { User, UserFilter } from './User';

export interface UserRepository {
  save(user: User): Promise<void>;
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  
  // Filter methods
  saveFilter(filter: UserFilter): Promise<void>;
  getFilters(userId: string): Promise<UserFilter[]>;
  getFilterById(id: string): Promise<UserFilter | null>;
  deleteFilter(id: string): Promise<void>;
}
