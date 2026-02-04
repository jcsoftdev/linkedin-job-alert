export interface JobRunLock {
  acquire(key: string, ttlMs: number): Promise<boolean>;
  release(key: string): Promise<void>;
  isLocked(key: string): Promise<boolean>;
}
