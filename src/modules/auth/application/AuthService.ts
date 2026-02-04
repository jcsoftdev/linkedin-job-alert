import type { UserRepository } from '../domain/UserRepository';
import type { User } from '../domain/User';
import { sign } from 'hono/jwt';

export class AuthService {
  constructor(private readonly repository: UserRepository, private readonly jwtSecret: string) {}

  async register(username: string, password: string): Promise<User> {
    const existing = await this.repository.findByUsername(username);
    if (existing) {
      throw new Error('Username already exists');
    }

    const passwordHash = await Bun.password.hash(password);
    const user: User = {
      id: crypto.randomUUID(),
      username,
      passwordHash,
      createdAt: new Date()
    };

    await this.repository.save(user);
    return user;
  }

  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const user = await this.repository.findByUsername(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await Bun.password.verify(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = await sign(
      {
        sub: user.id,
        username: user.username,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
      },
      this.jwtSecret
    );

    return { token, user };
  }
}
