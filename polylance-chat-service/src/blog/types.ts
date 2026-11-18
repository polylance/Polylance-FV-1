/**
 * PolyLance Blog Studio — Type Definitions
 * Strict server-side types for roles, posts, revisions, media, and audit logging.
 */

export type BlogRole = 'admin' | 'blog_editor' | 'blog_author';

export type PostStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';

export interface BlogTeamMember {
  wallet: string; // Checksummed or lowercase 0x address
  role: BlogRole;
  active: boolean;
  addedBy: string;
  addedAt: string; // ISO string
}

export interface BlogPostRevision {
  id: string;
  postId: string;
  title: string;
  contentMarkdown: string;
  contentHtml: string;
  contentJson?: any;
  authorWallet: string;
  savedAt: string; // ISO string
  changeSummary?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  coverVideo?: string;
  coverAlt?: string;
  category: string;
  tags: string[];
  authorId: string; // Wallet address
  authorName: string;
  status: PostStatus;
  contentJson?: any; // WYSIWYG / Editor AST
  contentMarkdown: string;
  contentHtml: string; // Server-sanitized HTML render
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
  publishedAt?: string; // ISO string
  scheduledAt?: string; // ISO string
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  previewToken?: string | null;
  previewExpiresAt?: number | null; // Timestamp ms
}

export interface BlogMedia {
  id: string;
  url: string;
  alt: string;
  size: number;
  mime: string;
  uploadedBy: string;
  createdAt: string;
}

export interface BlogAuditEntry {
  id: string;
  actorWallet: string;
  action: string;
  targetType: 'post' | 'team' | 'media' | 'settings';
  targetId?: string;
  details?: Record<string, any>;
  ipHash?: string;
  timestamp: string;
}

export interface BlogState {
  posts: BlogPost[];
  revisions: Record<string, BlogPostRevision[]>; // Keyed by postId
  team: Record<string, BlogTeamMember>; // Keyed by normalized lowercase wallet
  media: BlogMedia[];
  auditLog: BlogAuditEntry[];
  slugRedirects: Record<string, string>; // oldSlug -> newSlug (301)
}
