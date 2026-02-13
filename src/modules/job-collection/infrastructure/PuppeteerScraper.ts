import puppeteer, { Page, ElementHandle } from 'puppeteer';
import type { PostScraper, RawPost } from '../domain/PostScraper';

export interface CookieProvider {
  getCookie(): Promise<string | null>;
}

export class PuppeteerScraper implements PostScraper {
  constructor(
    private readonly initialCookie: string,
    private readonly cookieProvider?: CookieProvider
  ) {}

  async scrape(url: string): Promise<RawPost[]> {
    console.log(`Starting scrape for ${url}`);
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await this.setupBrowserPermissions(browser, url);

    try { 
      await this.setupPage(page);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await this.autoScroll(page);

      const articles = await page.$$('.feed-shared-update-v2');
      console.log(`Found ${articles.length} posts. Extracting details...`);

      const results = await this.extractPosts(page, articles);
      console.log(`Scraped ${results.length} posts.`);
      return results;

    } catch (error: any) {
      if (error.message.includes('ERR_TOO_MANY_REDIRECTS')) {
        console.error('LinkedIn redirected too many times. This usually means your session cookie (li_at) is invalid or expired.');
        throw new Error('Session cookie invalid/expired (ERR_TOO_MANY_REDIRECTS)');
      }
      console.error('Error during scraping:', error);
      return [];
    } finally {
      await browser.close();
    }
  }

  private async setupBrowserPermissions(browser: any, url: string) {
    const context = browser.defaultBrowserContext();
    const origin = new URL(url).origin;
    await context.overridePermissions(origin, ['clipboard-read', 'clipboard-write']);
  }

  private async setupPage(page: Page) {
    const dynamicCookie = this.cookieProvider ? await this.cookieProvider.getCookie() : null;
    const cookieToUse = dynamicCookie || this.initialCookie;

    await page.browserContext().setCookie({
      name: 'li_at',
      value: cookieToUse,
      domain: '.linkedin.com',
      path: '/',
      secure: true,
      httpOnly: true,
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 800 });

    // First try to go to the home page to check if the cookie is valid
    try {
      await page.goto('https://www.linkedin.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      const currentUrl = page.url();
      if (currentUrl.includes('login') || currentUrl.includes('checkpoint')) {
        throw new Error('Redirected to login/checkpoint page. Your session cookie might be invalid or expired.');
      }
    } catch (error: any) {
      if (error.message.includes('Redirected to login')) {
        throw error;
      }
      console.warn('Warning: Could not load home page, proceeding to target URL anyway:', error.message);
    }
  }

  private async extractPosts(page: Page, articles: ElementHandle[]): Promise<RawPost[]> {
    const results: RawPost[] = [];
    
    for (const article of articles) {
      try {
        const post = await this.extractSinglePost(page, article);
        if (post) {
          results.push(post);
        }
      } catch (err) {
        console.error('Error extracting post:', err);
      }
    }
    
    return results;
  }

  private async extractSinglePost(page: Page, article: ElementHandle): Promise<RawPost | null> {
    const data = await article.evaluate(el => {
      const textElement = el.querySelector('.update-components-text') || 
                          el.querySelector('.feed-shared-update-v2__commentary') ||
                          el.querySelector('.feed-shared-text');
      
      const titleElement = el.querySelector('.update-components-actor__title') ||
                           el.querySelector('.feed-shared-actor__title');
      
      const subDescription = el.querySelector('.update-components-actor__sub-description') ||
                             el.querySelector('.feed-shared-actor__sub-description');

      const authorName = (titleElement as HTMLElement)?.innerText?.trim() || undefined;
      const postedAt = (subDescription as HTMLElement)?.innerText?.trim() || undefined;

      return {
        content: textElement?.textContent?.trim() || null,
        authorName,
        postedAt
      };
    });

    const { content, authorName, postedAt } = data;
    
    let postUrl = await this.extractPostUrl(page, article);

    if (content && postUrl) {
      if (!postUrl.startsWith('http')) {
        postUrl = 'https://www.linkedin.com' + postUrl;
      }
      postUrl = postUrl.split('?')[0];

      return {
        content,
        url: postUrl,
        authorName,
        postedAt
      };
    }
    
    return null;
  }

  private async extractPostUrl(page: Page, article: ElementHandle): Promise<string> {
    // Attempt 1: Get from data-urn (most reliable)
    const dataUrn = await article.evaluate(el => (el as HTMLElement).dataset.urn);
    if (dataUrn) {
      const id = dataUrn.split(':').pop();
      if (id) return `https://www.linkedin.com/feed/update/urn:li:activity:${id}`;
    }

    // Attempt 2: Get from data-id
    const dataId = await article.evaluate(el => (el as HTMLElement).dataset.id);
    if (dataId) {
      const id = dataId.split(':').pop();
      if (id) return `https://www.linkedin.com/feed/update/urn:li:activity:${id}`;
    }

    // Attempt 3: Clipboard extraction (fallback)
    const trigger = await article.$('.feed-shared-control-menu__trigger');
    if (!trigger) return '';

    try {
      await page.bringToFront();
      
      // Preparamos una variable global en el navegador para capturar el link
      await page.evaluate(() => {
        (globalThis as any)._lastCopiedUrl = '';
        const originalWriteText = navigator.clipboard.writeText;
        navigator.clipboard.writeText = async (text) => {
          (globalThis as any)._lastCopiedUrl = text;
          return originalWriteText.call(navigator.clipboard, text);
        };
      });

      await trigger.scrollIntoView();
      await trigger.click();
      
      const shareBtnSelector = '.feed-shared-control-menu__item.option-share-via>div[role="button"]';
      const shareBtn = await page.waitForSelector(shareBtnSelector, { visible: true, timeout: 3000 });
      
      if (shareBtn) {
        await shareBtn.click();
        
        // Esperamos a que la variable global se llene con la URL
        let postUrl = '';
        const startTime = Date.now();
        const timeout = 3000;

        while (Date.now() - startTime < timeout) {
          postUrl = await page.evaluate(() => (globalThis as any)._lastCopiedUrl);
          if (postUrl && (postUrl.includes('linkedin.com/feed/update') || postUrl.includes('linkedin.com/posts'))) {
            break;
          }
          await new Promise(r => setTimeout(r, 200));
        }
        
        await page.mouse.click(0, 0);
        return postUrl || '';
      }
      
      return '';
    } catch (e) {
      console.error('Clipboard extraction failed for a post', e);
      return '';
    }
  }

  private async autoScroll(page: Page) {
    let previousHeight = await page.evaluate(() => document.body.scrollHeight);
    let scrolls = 0;
    const maxScrolls = 20;

    while (scrolls < maxScrolls) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      try {
        await page.waitForFunction(
          (prevHeight) => document.body.scrollHeight > prevHeight,
          { timeout: 3000 },
          previousHeight
        );
      } catch (e) {
        // Break on timeout if no more content loads
        break;
      }

      previousHeight = await page.evaluate(() => document.body.scrollHeight);
      scrolls++;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
