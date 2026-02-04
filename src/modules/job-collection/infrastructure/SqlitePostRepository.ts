import { Database } from 'bun:sqlite';
import type { PostRepository } from '../domain/PostRepository';
import type { JobPost } from '../domain/JobPost';
import db from '../../../shared/infrastructure/db';

export class SqlitePostRepository implements PostRepository {
  private readonly db: Database;

  constructor() {
    this.db = db;
  }

  async save(post: JobPost, userId?: string, filterId?: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO posts (id, content, url, authorName, postedAt, scrapedAt, isJobOffer, title, company, location, description, techStack, mainStack)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      post.id,
      post.content,
      post.url,
      post.authorName ?? null,
      post.postedAt ?? null,
      post.scrapedAt.toISOString(),
      post.isJobOffer ? 1 : 0,
      post.title ?? null,
      post.company ?? null,
      post.location ?? null,
      post.description ?? null,
      post.techStack ? JSON.stringify(post.techStack) : null,
      post.mainStack ?? null
    );

    if (userId) {
      const userPostStmt = this.db.prepare(`
        INSERT OR REPLACE INTO user_posts (user_id, post_id, filter_id, created_at)
        VALUES (?, ?, ?, ?)
      `);
      userPostStmt.run(userId, post.id, filterId ?? null, new Date().toISOString());
    }
  }

  async exists(url: string): Promise<boolean> {
    const stmt = this.db.prepare('SELECT 1 FROM posts WHERE url = ?');
    const result = stmt.get(url);
    return !!result;
  }

  async existsForUser(url: string, userId: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM posts p
      JOIN user_posts up ON p.id = up.post_id
      WHERE p.url = ? AND up.user_id = ?
    `);
    const result = stmt.get(url, userId);
    return !!result;
  }

  async getByUrl(url: string): Promise<JobPost | null> {
    const stmt = this.db.prepare('SELECT * FROM posts WHERE url = ?');
    const row = stmt.get(url) as any;
    if (!row) return null;
    return {
      id: row.id,
      content: row.content,
      url: row.url,
      authorName: row.authorName,
      postedAt: row.postedAt,
      scrapedAt: new Date(row.scrapedAt),
      isJobOffer: Boolean(row.isJobOffer),
      title: row.title,
      company: row.company,
      location: row.location,
      description: row.description,
      techStack: row.techStack ? JSON.parse(row.techStack) : undefined,
      mainStack: row.mainStack
    };
  }

  async getAll(userId?: string, filterId?: string): Promise<JobPost[]> {
    let sql = 'SELECT * FROM posts WHERE isJobOffer = 1';
    let params: any[] = [];

    if (userId) {
      sql = `
        SELECT p.* FROM posts p
        JOIN user_posts up ON p.id = up.post_id
        WHERE p.isJobOffer = 1 AND up.user_id = ?
      `;
      params = [userId];

      if (filterId) {
        sql += ' AND up.filter_id = ?';
        params.push(filterId);
      }
    }
    
    sql += ' ORDER BY scrapedAt DESC';
    
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    
    return rows.map(row => ({
      id: row.id,
      content: row.content,
      url: row.url,
      authorName: row.authorName,
      postedAt: row.postedAt,
      scrapedAt: new Date(row.scrapedAt),
      isJobOffer: Boolean(row.isJobOffer),
      title: row.title,
      company: row.company,
      location: row.location,
      description: row.description,
      techStack: row.techStack ? JSON.parse(row.techStack) : undefined,
      mainStack: row.mainStack
    }));
  }
}
