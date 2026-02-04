export interface JobPost {
  id: string;
  content: string;
  url: string;
  authorName?: string;
  postedAt?: string;
  scrapedAt: Date;
  isJobOffer: boolean;
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  techStack?: string[];
  mainStack?: string;
}
