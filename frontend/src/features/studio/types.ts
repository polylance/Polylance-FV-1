/**
 * PolyLance Blog Studio — Frontend Type Definitions
 */

export type BlogRole = 'admin' | 'blog_editor' | 'blog_author';

export type PostStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';

export interface StudioPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  coverVideo?: string;
  coverAlt?: string;
  category: string;
  tags: string[];
  authorId: string;
  authorName: string;
  status: PostStatus;
  contentJson?: any;
  contentMarkdown: string;
  contentHtml: string;
  keyTakeaways?: string[];
  tableOfContents?: Array<{ id: string; title: string; level: number }>;
  faqs?: Array<{ question: string; answer: string }>;
  sources?: Array<{ label: string; url: string }>;
  disclaimer?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  readingMinutes: number;
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  previewToken?: string | null;
  previewExpiresAt?: number | null;
}

export interface StudioRevision {
  id: string;
  postId: string;
  title: string;
  contentMarkdown: string;
  contentHtml: string;
  contentJson?: any;
  authorWallet: string;
  savedAt: string;
  changeSummary?: string;
}

export interface StudioTeamMember {
  wallet: string;
  role: BlogRole;
  active: boolean;
  addedBy: string;
  addedAt: string;
}

export interface StudioMedia {
  id: string;
  url: string;
  alt: string;
  size: number;
  mime: string;
  uploadedBy: string;
  createdAt: string;
}

export interface StudioAuditLog {
  id: string;
  actorWallet: string;
  action: string;
  targetType: 'post' | 'team' | 'media' | 'settings';
  targetId?: string;
  details?: Record<string, any>;
  ipHash?: string;
  timestamp: string;
}

export interface PublishChecklistItem {
  id: string;
  label: string;
  passed: boolean;
  isCritical: boolean; // If true, blocks publishing
  message?: string;
}
