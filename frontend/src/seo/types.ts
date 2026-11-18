/**
 * PolyLance SEO Type Definitions
 * Single source of truth for SEO metadata, keywords, schemas, and routes.
 */

export type KeywordCluster =
  | 'core'
  | 'web3'
  | 'problem'
  | 'question'
  | 'geo'
  | 'brand'
  | 'skill';

export type SearchIntent =
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'navigational';

export type KeywordStatus = 'active' | 'planned' | 'paused';

export interface KeywordDefinition {
  id: string;
  term: string;
  cluster: KeywordCluster;
  intent: SearchIntent;
  priority: 1 | 2 | 3;
  targetPage: string;
  status: KeywordStatus;
  notes?: string;
}

export type RobotsDirective =
  | 'index, follow'
  | 'noindex, nofollow'
  | 'noindex, follow'
  | 'index, nofollow';

export type JsonLdType =
  | 'Organization'
  | 'WebSite'
  | 'JobPosting'
  | 'FAQPage'
  | 'BreadcrumbList'
  | 'Article'
  | 'BlogPosting'
  | 'Person'
  | 'ProfilePage'
  | 'SoftwareApplication'
  | 'WebApplication';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface RouteSeoConfig {
  path: string;
  title: string;
  description: string;
  canonicalPath: string;
  primaryKeywordId: string;
  secondaryKeywordIds: string[];
  robots: RobotsDirective;
  jsonLdTypes: JsonLdType[];
  sitemapPriority?: number;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export type FaqCategory =
  | 'general'
  | 'escrow'
  | 'fees'
  | 'wallet'
  | 'freelancers'
  | 'clients'
  | 'disputes'
  | 'security'
  | 'certificates';

export interface FaqItem {
  id: string;
  pageIds: string[];
  category: FaqCategory;
  question: string;
  answer: string;
  keywordIds: string[];
  schemaEligible: boolean;
  needsReview?: boolean;
  updatedAt: string;
}

export interface BlogPostData {
  slug: string;
  title: string;
  description: string;
  primaryKeywordId: string;
  secondaryKeywordIds: string[];
  author: string;
  authorRole?: string;
  authorBio?: string;
  authorAvatar?: string;
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
  heroImage?: string;
  coverImage?: string;
  coverVideo?: string;
  coverAlt?: string;
  category?: string;
  tags?: string[];
  keyTakeaways?: string[];
  summary: string;
  content: string; // Markdown/HTML structured content
  tableOfContents: { id: string; title: string }[];
  faqs?: { question: string; answer: string }[];
  sources?: { label: string; url: string }[];
  disclaimer?: string;
}

export interface SiteConfig {
  siteName: string;
  siteUrl: string;
  defaultLocale: string;
  defaultOgImage: string;
  twitterHandle: string;
  githubUrl: string;
  contactEmail: string;
  themeColor: string;
  platformFeePercent: number;
  feePaidBy: 'both' | 'freelancer' | 'client';
  reviewWindowDays: number;
  deliveryGraceDays: number;
  autoReleaseOnReviewTimeout: boolean;
  polygonscanUrl: string;
  contracts: {
    jobFactory: string;
    jobEscrowImpl: string;
    reputationSBT: string;
    profileRegistry: string;
    judgeDAO: string;
    timelockController: string;
  };
}
