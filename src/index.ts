import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { jwt, verify } from 'hono/jwt';
import cron from 'node-cron';
import { PuppeteerScraper } from './modules/job-collection/infrastructure/PuppeteerScraper';
import { OpenAIJobAnalyzer } from './modules/job-collection/infrastructure/OpenAIJobAnalyzer';
import { SqlitePostRepository } from './modules/job-collection/infrastructure/SqlitePostRepository';
import { JobOfferPubSub } from './modules/job-collection/infrastructure/JobOfferPubSub';
import { SqliteJobRunLock } from './modules/job-collection/infrastructure/SqliteJobRunLock';
import { CollectAndFilterPosts } from './modules/job-collection/application/CollectAndFilterPosts';
import { GetJobOffers } from './modules/job-collection/application/GetJobOffers';
import { SqliteUserRepository } from './modules/auth/infrastructure/SqliteUserRepository';
import { AuthService } from './modules/auth/application/AuthService';
import { FilterManagement } from './modules/auth/application/FilterManagement';
import { ConfigRepository } from './modules/auth/infrastructure/ConfigRepository';
import db from './shared/infrastructure/db';

const app = new Hono();
const port = Number(Bun.env.PORT || process.env.PORT) || 3000;

console.log('Environment check:', {
  PORT: !!(Bun.env.PORT || process.env.PORT),
  LINKEDIN_SESSION_COOKIE: !!(Bun.env.LINKEDIN_SESSION_COOKIE || process.env.LINKEDIN_SESSION_COOKIE),
  OPENAI_API_KEY: !!(Bun.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY),
  DATABASE_PATH: !!(Bun.env.DATABASE_PATH || process.env.DATABASE_PATH),
  NODE_ENV: Bun.env.NODE_ENV || process.env.NODE_ENV
});

// Configuration
const cookie = Bun.env.LINKEDIN_SESSION_COOKIE || process.env.LINKEDIN_SESSION_COOKIE || '';
const openaiKey = Bun.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';

if (Bun.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production') {
  if (!cookie) console.warn('⚠️ WARNING: LINKEDIN_SESSION_COOKIE is missing in production environment');
  if (!openaiKey) console.warn('⚠️ WARNING: OPENAI_API_KEY is missing in production environment');
}

const openaiBaseUrl = Bun.env.OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1';
const jwtSecret = Bun.env.JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-me';
// The URL provided by the user (default)
const defaultSearchUrl = 'https://www.linkedin.com/search/results/content/?keywords=frontend%20developer%20latam&origin=FACETED_SEARCH&position=0&sid=USX&sortBy=%22date_posted%22';

// Config
const configRepo = new ConfigRepository(db);
const cookieProvider = {
  getCookie: async () => configRepo.get('LINKEDIN_SESSION_COOKIE')
};

// Dependency Injection
const scraper = new PuppeteerScraper(cookie, cookieProvider);
const analyzer = new OpenAIJobAnalyzer(openaiKey, openaiBaseUrl);
const repository = new SqlitePostRepository();
const pubsub = new JobOfferPubSub();
const jobRunLock = new SqliteJobRunLock();

const collectLockKey = 'collection:global';
const collectLockTtlMs = 60 * 60 * 1000;

// Initialize pubsub status from lock
jobRunLock.isLocked(collectLockKey).then(isLocked => {
  if (isLocked) pubsub.publishStatusToAll({ running: true });
});

const collectUseCase = new CollectAndFilterPosts(scraper, analyzer, repository, pubsub);
const getUseCase = new GetJobOffers(repository);

// Auth & Filter Dependencies
const userRepository = new SqliteUserRepository();
const authService = new AuthService(userRepository, jwtSecret);
const filterManagement = new FilterManagement(userRepository);

// Routes
// Old UI routes removed in favor of React client
// app.get('/', (c) => c.redirect('/dashboard'));
// app.get('/dashboard', ...);
// app.get('/test', ...);

// Auth Routes
app.get('/api/health', (c) => c.json({ status: 'ok', message: 'Backend is reachable' }));

// Config routes (protected)
app.use('/api/config/*', jwt({ secret: jwtSecret, alg: 'HS256' }));

app.post('/api/config/linkedin-cookie', async (c) => {
  const { cookie } = await c.req.json();
  if (!cookie) return c.json({ error: 'Cookie is required' }, 400);
  
  configRepo.set('LINKEDIN_SESSION_COOKIE', cookie);
  return c.json({ success: true, message: 'LinkedIn cookie updated successfully' });
});

app.post('/api/auth/register', async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) return c.json({ error: 'Username and password required' }, 400);
  try {
    const user = await authService.register(username, password);
    return c.json({ id: user.id, username: user.username });
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) return c.json({ error: 'Username and password required' }, 400);
  try {
    const result = await authService.login(username, password);
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: e.message }, 401);
  }
});

// Protected Filter Routes
app.use('/api/filters/*', jwt({ secret: jwtSecret, alg: 'HS256' }));

app.get('/api/filters', async (c) => {
  const payload = c.get('jwtPayload');
  const filters = await filterManagement.getUserFilters(payload.sub);
  return c.json(filters);
});

app.post('/api/filters', async (c) => {
  const payload = c.get('jwtPayload');
  const { name, config } = await c.req.json();
  if (!name || !config) return c.json({ error: 'Name and config required' }, 400);
  const filter = await filterManagement.createFilter(payload.sub, name, config);
  return c.json(filter);
});

app.delete('/api/filters/:id', async (c) => {
  const payload = c.get('jwtPayload');
  const id = c.req.param('id');
  try {
    await filterManagement.deleteFilter(payload.sub, id);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

// Protect collect route
app.use('/api/collect', jwt({ secret: jwtSecret, alg: 'HS256' }));

app.post('/api/collect', async (c) => {
  if (!cookie) {
    return c.json({ 
      error: 'Missing LINKEDIN_SESSION_COOKIE. Please ensure it is set in your production environment variables (e.g., in your hosting provider dashboard).' 
    }, 500);
  }
  if (!openaiKey) {
    return c.json({ 
      error: 'Missing OPENAI_API_KEY. Please ensure it is set in your production environment variables.' 
    }, 500);
  }
  
  const lockAcquired = await jobRunLock.acquire(collectLockKey, collectLockTtlMs);
  if (!lockAcquired) {
    return c.json({ error: 'Collection already running' }, 409);
  }

  const payload = c.get('jwtPayload');
  const body = await c.req.json().catch(() => ({}));
  const urlToUse = body.url || defaultSearchUrl;
  const filterId = body.filterId; // Optional: Pass filterId if triggered from a filter

  console.log(`Manual collection triggered via API for user ${payload.sub} with URL:`, urlToUse);
  pubsub.publishStatusToAll({ running: true });
  
  // Trigger background task
  collectUseCase.execute(urlToUse, payload.sub as string, filterId)
    .then(() => console.log('Manual collection completed successfully'))
    .catch(err => console.error('Manual collection failed:', err))
    .finally(async () => {
      await jobRunLock.release(collectLockKey);
      pubsub.publishStatusToAll({ running: false });
    });
    
  return c.json({ message: 'Collection process started in background' });
});

// Protect posts route
app.use('/api/posts', jwt({ secret: jwtSecret, alg: 'HS256' }));

app.get('/api/posts', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const filterId = c.req.query('filterId');
    const posts = await getUseCase.execute(payload.sub as string, filterId);
    return c.json(posts);
  } catch (error) {
    return c.json({ error: 'Failed to retrieve posts' }, 500);
  }
});

app.get('/api/subscribe', async (c) => {
  // Use query param for token since EventSource doesn't support headers easily
  const token = c.req.query('token');
  const filterId = c.req.query('filterId');
  let userId: string | undefined;

  if (token) {
    try {
      const payload = await verify(token, jwtSecret, 'HS256');
      userId = payload.sub as string;
    } catch (e) {
      console.error('Invalid token for subscription:', e);
      return c.text('Unauthorized', 401);
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      if (!userId) {
        controller.enqueue(new TextEncoder().encode('event: error\ndata: Unauthorized\n\n'));
        controller.close();
        return;
      }

      // 1. Send historical posts first
      try {
        const historicalPosts = await getUseCase.execute(userId, filterId);
        const encoder = new TextEncoder();
        for (const post of historicalPosts) {
          controller.enqueue(encoder.encode(`event: job\ndata: ${JSON.stringify(post)}\n\n`));
        }
      } catch (error) {
        console.error('Error sending historical posts to stream:', error);
      }

      // 2. Subscribe for new posts
      const unsubscribe = pubsub.subscribe(userId, controller);
      if (c.req.raw.signal.aborted) {
        unsubscribe();
        return;
      }
      c.req.raw.signal.addEventListener('abort', () => unsubscribe(), { once: true });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
});

// Demo route removed
// app.get('/demo', ...);

// Serve Static Files (Frontend)
app.use('/*', serveStatic({ root: './client/dist' }));

// SPA Fallback: Serve index.html for any other route
app.get('*', serveStatic({ path: './client/dist/index.html' }));

// Scheduler: Run every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily collection task (Cron)...');
  if (cookie && openaiKey) {
    const lockAcquired = await jobRunLock.acquire(collectLockKey, collectLockTtlMs);
    if (!lockAcquired) {
      console.log('Skipping cron task: Collection already running');
      return;
    }
    pubsub.publishStatusToAll({ running: true });
    collectUseCase.execute(defaultSearchUrl)
      .catch(err => console.error(err))
      .finally(async () => {
        await jobRunLock.release(collectLockKey);
        pubsub.publishStatusToAll({ running: false });
      });
  } else {
    console.log('Skipping cron task: Missing credentials');
  }
});

console.log(`Server is running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 255, // Max allowed value for Bun.serve
};
