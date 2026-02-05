// Based on backend types from:
// src/modules/auth/domain/User.ts
// src/modules/job-collection/domain/JobPost.ts

export interface User {
  id: string;
  username: string;
  createdAt: string; // Serialized Date
}

export interface FilterConfig {
  keywords?: string[];
  locations?: string[];
  searchUrl?: string;
}

export interface UserFilter {
  id: string;
  userId: string;
  name: string;
  config: FilterConfig;
  createdAt: string; // Serialized Date
}

export interface JobPost {
  id: string;
  content: string;
  url: string;
  authorName?: string;
  postedAt?: string;
  scrapedAt: string; // Serialized Date
  isJobOffer: boolean;
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  techStack?: string[];
  mainStack?: string;
  createdAt?: string; // Mapped from scrapedAt in frontend sometimes or added by API
}
