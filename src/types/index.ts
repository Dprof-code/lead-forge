// Common types for the LeadForge platform

export type JobType =
  | "query_generator"
  | "gmaps_scraper"
  | "data_cleaner"
  | "website_separator"
  | "email_scraper"
  | "ai_analyzer";

export type JobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "paused";

export interface JobConfig {
  [key: string]: unknown;
}

export interface QueryGeneratorConfig {
  businessType: string;
  city: string;
  state: string;
  country?: string;
}

export interface GMapScraperConfig {
  maxResults?: number;
  delay?: number;
  headless?: boolean;
  queries: string[];
}

export interface DataCleanerConfig {
  removeDuplicates?: boolean;
  removeEmpty?: boolean;
  standardizePhone?: boolean;
  validateEmail?: boolean;
}

export interface Business {
  name: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  reviews?: number;
  address?: string;
  category?: string;
}

export interface AIAnalysisResult {
  issues: string[];
  solutions: string[];
  score?: number;
}
