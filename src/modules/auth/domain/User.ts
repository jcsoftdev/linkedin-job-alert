export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

export interface UserFilter {
  id: string;
  userId: string;
  name: string;
  config: FilterConfig;
  createdAt: Date;
}

export interface FilterConfig {
  keywords?: string[];
  locations?: string[];
  searchUrl?: string;
}
