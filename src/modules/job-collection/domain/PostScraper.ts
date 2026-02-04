export interface RawPost {
  content: string;
  url: string;
  authorName?: string;
  postedAt?: string;
}

export interface PostScraper {
  scrape(url: string): Promise<RawPost[]>;
}
