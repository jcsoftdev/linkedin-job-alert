import { Database } from 'bun:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = Bun.env.DATABASE_PATH || process.env.DATABASE_PATH || path.resolve(process.cwd(), 'posts.db');

// Ensure the directory exists (useful for Railway volumes)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize tables
db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    content TEXT,
    url TEXT UNIQUE,
    authorName TEXT,
    postedAt TEXT,
    scrapedAt TEXT,
    isJobOffer INTEGER,
    title TEXT,
    company TEXT,
    location TEXT,
    description TEXT,
    techStack TEXT,
    mainStack TEXT
  )
`);

// Add missing columns if they don't exist
try {
  db.run("ALTER TABLE posts ADD COLUMN description TEXT");
} catch (e) {}
try {
  db.run("ALTER TABLE posts ADD COLUMN techStack TEXT");
} catch (e) {}
try {
  db.run("ALTER TABLE posts ADD COLUMN mainStack TEXT");
} catch (e) {}

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS user_filters (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    config TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS user_posts (
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    filter_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY(filter_id) REFERENCES user_filters(id) ON DELETE SET NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS job_run_locks (
    lock_key TEXT PRIMARY KEY,
    started_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )
`);

export default db;
