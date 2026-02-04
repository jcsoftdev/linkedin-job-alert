import crypto from 'node:crypto';
import type { PostScraper, RawPost } from '../domain/PostScraper';
import type { JobAnalyzer } from '../domain/JobAnalyzer';
import type { PostRepository } from '../domain/PostRepository';
import type { JobOfferPublisher } from '../domain/JobOfferPublisher';

export class CollectAndFilterPosts {
  constructor(
    private readonly scraper: PostScraper,
    private readonly analyzer: JobAnalyzer,
    private readonly repository: PostRepository,
    private readonly publisher: JobOfferPublisher
  ) {}

  async execute(url: string, userId?: string, filterId?: string): Promise<void> {
    console.log(`Use Case: Starting collection for user=${userId ?? 'anon'}...`);
    const rawPosts = await this.scraper.scrape(url);
    console.log(`Use Case: Scraped ${rawPosts.length} posts. Analyzing...`);

    for (const raw of rawPosts) {
      await this.processPost(raw, userId, filterId);
    }
    console.log('Use Case: Collection finished.');
  }

  private async processPost(raw: RawPost, userId?: string, filterId?: string): Promise<void> {
    if (userId && await this.repository.existsForUser(raw.url, userId)) {
      console.log(`Skipping existing user post: ${raw.url}`);
      return;
    }

    const existing = await this.repository.getByUrl(raw.url);
    if (existing) {
      await this.handleExistingPost(existing, userId, filterId);
      return;
    }

    const analysis = await this.analyzer.analyze(raw.content);
    
    if (analysis.isJobOffer) {
      const id = crypto.createHash('md5').update(raw.url).digest('hex');
      const saved = {
        id,
        content: raw.content,
        url: raw.url,
        authorName: raw.authorName,
        postedAt: raw.postedAt,
        scrapedAt: new Date(),
        isJobOffer: true,
        title: analysis.title,
        company: analysis.company,
        location: analysis.location,
        description: analysis.description,
        techStack: analysis.techStack,
        mainStack: analysis.mainStack
      };
      await this.repository.save(saved, userId, filterId);
      await this.publisher.publish(saved, userId);
      console.log(`Saved Job Offer: ${analysis.title} at ${analysis.company}`);
    } else {
      console.log('Post is not a job offer. Skipping.');
    }
  }

  private async handleExistingPost(existing: any, userId?: string, filterId?: string): Promise<void> {
    if (userId) {
      await this.repository.save(existing, userId, filterId);
      if (existing.isJobOffer) {
        await this.publisher.publish(existing, userId);
      }
    }
    console.log(`Skipping AI analysis for existing post: ${existing.url}`);
  }
}
