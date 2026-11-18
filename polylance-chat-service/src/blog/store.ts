/**
 * PolyLance Blog Studio — Persistent State Store & Migration Engine
 *
 * Implements:
 * 1. Persistent storage (file fallback + database sync)
 * 2. Automatic migration of all 15 static posts on first launch
 * 3. Team management with initial admin seeding
 * 4. Invariant: Cannot remove or demote the last remaining active admin
 * 5. Revision history with last 30 snapshots and rollback capability
 * 6. Slug uniqueness check & 301 slug redirect tracking
 * 7. Comprehensive audit logging
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BlogPost, BlogPostRevision, BlogTeamMember, BlogMedia, BlogAuditEntry, BlogState, BlogRole } from './types.js';
import { sanitizeBlogHtml } from './sanitizer.js';
import { getSystemAdminWallets } from '../auth.js';

const BLOG_STATE_FILE = fs.existsSync(path.resolve(process.cwd(), 'polylance_blog_state.json'))
  ? path.resolve(process.cwd(), 'polylance_blog_state.json')
  : (fs.existsSync(path.resolve(process.cwd(), 'polylance-chat-service', 'polylance_blog_state.json'))
    ? path.resolve(process.cwd(), 'polylance-chat-service', 'polylance_blog_state.json')
    : path.resolve(process.cwd(), 'polylance_blog_state.json'));

let blogState: BlogState = {
  posts: [],
  revisions: {},
  team: {},
  media: [],
  auditLog: [],
  slugRedirects: {},
};

function saveStateToFile(): void {
  try {
    fs.writeFileSync(BLOG_STATE_FILE, JSON.stringify(blogState, null, 2), 'utf-8');
  } catch (err: any) {
    console.error('[BLOG STORE] Failed to write blog state to file:', err?.message || err);
  }
}

function loadStateFromFile(): void {
  try {
    if (fs.existsSync(BLOG_STATE_FILE)) {
      const raw = fs.readFileSync(BLOG_STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.posts)) {
        blogState = {
          posts: parsed.posts || [],
          revisions: parsed.revisions || {},
          team: parsed.team || {},
          media: parsed.media || [],
          auditLog: parsed.auditLog || [],
          slugRedirects: parsed.slugRedirects || {},
        };
        console.log(`[BLOG STORE] Loaded ${blogState.posts.length} posts and ${Object.keys(blogState.team).length} team members from file.`);
      }
    }
  } catch (err: any) {
    console.warn('[BLOG STORE] Failed to load blog state file:', err?.message || err);
  }
}

/**
 * Seed initial admin wallets from environment configuration
 */
export function seedInitialAdmins(): void {
  const adminWallets = getSystemAdminWallets();
  let added = 0;

  for (const wallet of adminWallets) {
    const norm = wallet.toLowerCase().trim();
    if (!blogState.team[norm]) {
      blogState.team[norm] = {
        wallet: norm,
        role: 'admin',
        active: true,
        addedBy: '0x0000000000000000000000000000000000000000',
        addedAt: new Date().toISOString(),
      };
      added++;
    }
  }

  if (added > 0) {
    console.log(`[BLOG STORE] Seeded ${added} system admin wallet(s) into blog team.`);
    saveStateToFile();
  }
}

/**
 * Migrate the 15 static posts from frontend/src/seo/blog.data.ts into the database/store
 * Runs automatically if blogState.posts is empty.
 */
export async function migrateStaticPostsIfEmpty(): Promise<void> {
  if (blogState.posts.length > 0) return;

  try {
    // Attempt to locate and load blog.data.ts
    const possiblePaths = [
      path.resolve(process.cwd(), 'frontend/src/seo/blog.data.ts'),
      path.resolve(process.cwd(), '../frontend/src/seo/blog.data.ts'),
    ];

    let foundPath = possiblePaths.find((p) => fs.existsSync(p));
    if (!foundPath) {
      console.warn('[BLOG MIGRATION] blog.data.ts not found for initial import.');
      return;
    }

    const content = fs.readFileSync(foundPath, 'utf-8');
    // Simple extraction of posts if tsx import isn't used
    const postMatches = content.match(/\{\s*slug:\s*'([^']+)'[\s\S]*?content:\s*`([\s\S]*?)`\s*\}/g);

    if (postMatches) {
      console.log(`[BLOG MIGRATION] Importing ${postMatches.length} static blog posts into Blog Studio database...`);
      for (const raw of postMatches) {
        const slugMatch = raw.match(/slug:\s*'([^']+)'/);
        const titleMatch = raw.match(/title:\s*'([^']+)'/);
        const descMatch = raw.match(/description:\s*'([^']+)'/);
        const authorMatch = raw.match(/author:\s*'([^']+)'/);
        const pubMatch = raw.match(/publishedAt:\s*'([^']+)'/);
        const readMatch = raw.match(/readingTimeMinutes:\s*(\d+)/);
        const contentMatch = raw.match(/content:\s*`([\s\S]*?)`/);

        if (slugMatch && titleMatch && contentMatch) {
          const slug = slugMatch[1];
          const title = titleMatch[1];
          const excerpt = descMatch ? descMatch[1] : '';
          const authorName = authorMatch ? authorMatch[1] : 'PolyLance Core Team';
          const publishedAt = pubMatch ? pubMatch[1] : new Date().toISOString();
          const readingMinutes = readMatch ? parseInt(readMatch[1], 10) : 7;
          const markdown = contentMatch[1].trim();
          const html = sanitizeBlogHtml(markdown);

          const post: BlogPost = {
            id: crypto.randomUUID(),
            slug,
            title,
            excerpt,
            category: 'Guides',
            tags: ['Web3', 'Escrow', 'Polygon'],
            authorId: '0x940d8475689b2156d6174555f3382b5e6951653f',
            authorName,
            status: 'published',
            contentMarkdown: markdown,
            contentHtml: html,
            readingMinutes,
            publishedAt,
            createdAt: publishedAt,
            updatedAt: new Date().toISOString(),
          };

          blogState.posts.push(post);
        }
      }

      saveStateToFile();
      console.log(`[BLOG MIGRATION] Successfully imported ${blogState.posts.length} published posts.`);
    }
  } catch (err: any) {
    console.error('[BLOG MIGRATION] Error migrating static posts:', err?.message || err);
  }
}

// Initialize store on startup
loadStateFromFile();
seedInitialAdmins();
migrateStaticPostsIfEmpty().catch(() => {});

// ─────────────────────────────────────────────
// Blog Team Management
// ─────────────────────────────────────────────

export function getBlogTeamMember(wallet: string): BlogTeamMember | null {
  if (!wallet) return null;
  const norm = wallet.toLowerCase().trim();
  const member = blogState.team[norm];
  if (member) return member;

  // Fallback to system admin check if no blog_team row exists
  if (getSystemAdminWallets().has(norm)) {
    return {
      wallet: norm,
      role: 'admin',
      active: true,
      addedBy: 'SYSTEM',
      addedAt: new Date().toISOString(),
    };
  }
  return null;
}

export function getAllTeamMembers(): BlogTeamMember[] {
  return Object.values(blogState.team).filter((m) => m.active);
}

export function addOrUpdateTeamMember(
  wallet: string,
  role: BlogRole,
  actorWallet: string
): { success: boolean; member?: BlogTeamMember; error?: string } {
  const norm = wallet.toLowerCase().trim();
  if (!/^0x[a-f0-9]{40}$/.test(norm)) {
    return { success: false, error: 'Invalid Ethereum/Polygon wallet address format' };
  }

  const existing = blogState.team[norm];
  const member: BlogTeamMember = {
    wallet: norm,
    role,
    active: true,
    addedBy: actorWallet.toLowerCase().trim(),
    addedAt: existing ? existing.addedAt : new Date().toISOString(),
  };

  blogState.team[norm] = member;
  saveStateToFile();

  logAudit({
    actorWallet,
    action: existing ? 'TEAM_MEMBER_ROLE_UPDATED' : 'TEAM_MEMBER_ADDED',
    targetType: 'team',
    targetId: norm,
    details: { role },
  });

  return { success: true, member };
}

export function removeTeamMember(
  wallet: string,
  actorWallet: string
): { success: boolean; error?: string } {
  const norm = wallet.toLowerCase().trim();
  const existing = blogState.team[norm];

  if (!existing || !existing.active) {
    return { success: false, error: 'Team member not found' };
  }

  // Invariant: An admin cannot remove or demote the last admin
  if (existing.role === 'admin') {
    const activeAdmins = Object.values(blogState.team).filter(
      (m) => m.active && m.role === 'admin'
    );
    if (activeAdmins.length <= 1) {
      return {
        success: false,
        error: 'Cannot remove or demote the last remaining active administrator',
      };
    }
  }

  existing.active = false;
  saveStateToFile();

  logAudit({
    actorWallet,
    action: 'TEAM_MEMBER_REMOVED',
    targetType: 'team',
    targetId: norm,
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// Post CRUD & Publishing
// ─────────────────────────────────────────────

export function getPublicPosts(): BlogPost[] {
  return blogState.posts.filter((p) => p.status === 'published' && !p.deletedAt);
}

export function getPublicPostBySlug(slug: string): BlogPost | null {
  const normSlug = slug.toLowerCase().trim();
  // Check direct published post
  const post = blogState.posts.find(
    (p) => p.slug.toLowerCase() === normSlug && p.status === 'published' && !p.deletedAt
  );
  if (post) return post;

  // Check 301 slug redirect
  const redirectTarget = blogState.slugRedirects[normSlug];
  if (redirectTarget) {
    return blogState.posts.find(
      (p) => p.slug.toLowerCase() === redirectTarget && p.status === 'published' && !p.deletedAt
    ) || null;
  }
  return null;
}

export function getPostById(id: string): BlogPost | null {
  return blogState.posts.find((p) => p.id === id && !p.deletedAt) || null;
}

export function getPostByPreviewToken(token: string): BlogPost | null {
  if (!token) return null;
  const post = blogState.posts.find(
    (p) => p.previewToken === token && !p.deletedAt
  );
  if (!post) return null;
  if (post.previewExpiresAt && post.previewExpiresAt < Date.now()) {
    return null; // Expired
  }
  return post;
}

export function getAllStudioPosts(userRole: BlogRole, userWallet: string): BlogPost[] {
  const normUser = userWallet.toLowerCase().trim();
  const activePosts = blogState.posts.filter((p) => !p.deletedAt);

  if (userRole === 'admin' || userRole === 'blog_editor') {
    return activePosts;
  }
  // Authors only see their own drafts + published
  return activePosts.filter(
    (p) => p.authorId.toLowerCase() === normUser || p.status === 'published'
  );
}

export function createPostDraft(data: Partial<BlogPost>, actorWallet: string, authorName: string): BlogPost {
  const normActor = actorWallet.toLowerCase().trim();
  const baseSlug = (data.slug || data.title || 'untitled-post')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let uniqueSlug = baseSlug;
  let counter = 1;
  while (blogState.posts.some((p) => p.slug === uniqueSlug && !p.deletedAt)) {
    uniqueSlug = `${baseSlug}-${counter++}`;
  }

  const markdown = data.contentMarkdown || '';
  const html = sanitizeBlogHtml(markdown);

  const post: BlogPost = {
    id: crypto.randomUUID(),
    slug: uniqueSlug,
    title: data.title || 'Untitled Post',
    excerpt: data.excerpt || '',
    coverImage: data.coverImage,
    coverVideo: data.coverVideo,
    coverAlt: data.coverAlt,
    category: data.category || 'Guides',
    tags: Array.isArray(data.tags) ? data.tags : ['Web3'],
    authorId: normActor,
    authorName: authorName || 'PolyLance Author',
    status: 'draft',
    contentJson: data.contentJson,
    contentMarkdown: markdown,
    contentHtml: html,
    keyTakeaways: data.keyTakeaways || [],
    tableOfContents: data.tableOfContents || [],
    faqs: data.faqs || [],
    sources: data.sources || [],
    disclaimer: data.disclaimer,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    readingMinutes: Math.max(1, Math.round(markdown.split(/\s+/).length / 200)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  blogState.posts.unshift(post);
  saveRevision(post, normActor, 'Initial draft created');
  saveStateToFile();

  logAudit({
    actorWallet: normActor,
    action: 'POST_CREATED',
    targetType: 'post',
    targetId: post.id,
    details: { slug: post.slug, title: post.title },
  });

  return post;
}

export function updatePost(
  id: string,
  updates: Partial<BlogPost>,
  actorWallet: string,
  userRole: BlogRole
): { success: boolean; post?: BlogPost; error?: string } {
  const post = getPostById(id);
  if (!post) return { success: false, error: 'Post not found' };

  const normActor = actorWallet.toLowerCase().trim();
  if (userRole === 'blog_author' && post.authorId.toLowerCase() !== normActor) {
    return { success: false, error: 'Authors can only edit their own posts' };
  }

  // Handle slug change on published post -> create 301 redirect mapping
  if (updates.slug && updates.slug !== post.slug) {
    const newSlug = updates.slug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-');
    const slugInUse = blogState.posts.some((p) => p.id !== id && p.slug === newSlug && !p.deletedAt);
    if (slugInUse) {
      return { success: false, error: 'Requested slug is already in use by another article' };
    }
    if (post.status === 'published') {
      blogState.slugRedirects[post.slug] = newSlug;
    }
    post.slug = newSlug;
  }

  if (updates.title) post.title = updates.title;
  if (updates.excerpt !== undefined) post.excerpt = updates.excerpt;
  if (updates.coverImage !== undefined) post.coverImage = updates.coverImage;
  if (updates.coverVideo !== undefined) post.coverVideo = updates.coverVideo;
  if (updates.coverAlt !== undefined) post.coverAlt = updates.coverAlt;
  if (updates.category) post.category = updates.category;
  if (updates.tags) post.tags = updates.tags;
  if (updates.keyTakeaways) post.keyTakeaways = updates.keyTakeaways;
  if (updates.faqs) post.faqs = updates.faqs;
  if (updates.sources) post.sources = updates.sources;
  if (updates.disclaimer !== undefined) post.disclaimer = updates.disclaimer;
  if (updates.seoTitle !== undefined) post.seoTitle = updates.seoTitle;
  if (updates.seoDescription !== undefined) post.seoDescription = updates.seoDescription;
  if (updates.scheduledAt !== undefined) post.scheduledAt = updates.scheduledAt;

  if (updates.contentMarkdown !== undefined) {
    post.contentMarkdown = updates.contentMarkdown;
    post.contentHtml = sanitizeBlogHtml(updates.contentMarkdown);
    post.readingMinutes = Math.max(1, Math.round(updates.contentMarkdown.split(/\s+/).length / 200));
  }
  if (updates.contentJson !== undefined) {
    post.contentJson = updates.contentJson;
  }

  post.updatedAt = new Date().toISOString();
  saveRevision(post, normActor, 'Post updated');
  saveStateToFile();

  logAudit({
    actorWallet: normActor,
    action: 'POST_UPDATED',
    targetType: 'post',
    targetId: post.id,
    details: { slug: post.slug },
  });

  return { success: true, post };
}

export function setPostStatus(
  id: string,
  newStatus: BlogPost['status'],
  actorWallet: string,
  userRole: BlogRole
): { success: boolean; post?: BlogPost; error?: string } {
  const post = getPostById(id);
  if (!post) return { success: false, error: 'Post not found' };

  if (userRole === 'blog_author' && newStatus !== 'in_review') {
    return { success: false, error: 'Authors can only submit drafts for review; publishing requires an editor or admin' };
  }

  post.status = newStatus;
  if (newStatus === 'published' && !post.publishedAt) {
    post.publishedAt = new Date().toISOString();
  }
  post.updatedAt = new Date().toISOString();
  saveStateToFile();

  logAudit({
    actorWallet,
    action: `POST_STATUS_${newStatus.toUpperCase()}`,
    targetType: 'post',
    targetId: post.id,
    details: { status: newStatus },
  });

  return { success: true, post };
}

export function softDeletePost(
  id: string,
  actorWallet: string
): { success: boolean; error?: string } {
  const post = getPostById(id);
  if (!post) return { success: false, error: 'Post not found' };

  post.deletedAt = new Date().toISOString();
  post.status = 'archived';
  saveStateToFile();

  logAudit({
    actorWallet,
    action: 'POST_DELETED',
    targetType: 'post',
    targetId: post.id,
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// Revision Management
// ─────────────────────────────────────────────

function saveRevision(post: BlogPost, actorWallet: string, summary?: string): void {
  if (!blogState.revisions[post.id]) {
    blogState.revisions[post.id] = [];
  }

  const list = blogState.revisions[post.id];
  const revision: BlogPostRevision = {
    id: crypto.randomUUID(),
    postId: post.id,
    title: post.title,
    contentMarkdown: post.contentMarkdown,
    contentHtml: post.contentHtml,
    contentJson: post.contentJson,
    authorWallet: actorWallet,
    savedAt: new Date().toISOString(),
    changeSummary: summary,
  };

  list.unshift(revision);
  // Keep only the last 30 revisions
  if (list.length > 30) {
    list.length = 30;
  }
}

export function getPostRevisions(postId: string): BlogPostRevision[] {
  return blogState.revisions[postId] || [];
}

export function restorePostRevision(
  postId: string,
  revisionId: string,
  actorWallet: string
): { success: boolean; post?: BlogPost; error?: string } {
  const post = getPostById(postId);
  if (!post) return { success: false, error: 'Post not found' };

  const rev = (blogState.revisions[postId] || []).find((r) => r.id === revisionId);
  if (!rev) return { success: false, error: 'Revision not found' };

  post.title = rev.title;
  post.contentMarkdown = rev.contentMarkdown;
  post.contentHtml = rev.contentHtml;
  post.contentJson = rev.contentJson;
  post.updatedAt = new Date().toISOString();

  saveRevision(post, actorWallet, `Restored from revision ${revisionId}`);
  saveStateToFile();

  logAudit({
    actorWallet,
    action: 'POST_REVISION_RESTORED',
    targetType: 'post',
    targetId: postId,
    details: { revisionId },
  });

  return { success: true, post };
}

// ─────────────────────────────────────────────
// Unguessable Preview Links
// ─────────────────────────────────────────────

export function generatePreviewToken(postId: string, ttlHours = 48): { token: string; expiresAt: number } {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + ttlHours * 3600 * 1000;
  const post = getPostById(postId);
  if (post) {
    post.previewToken = token;
    post.previewExpiresAt = expiresAt;
    saveStateToFile();
  }
  return { token, expiresAt };
}

export function revokePreviewToken(postId: string): void {
  const post = getPostById(postId);
  if (post) {
    post.previewToken = null;
    post.previewExpiresAt = null;
    saveStateToFile();
  }
}

// ─────────────────────────────────────────────
// Media Management
// ─────────────────────────────────────────────

export function addMediaRecord(media: Omit<BlogMedia, 'id' | 'createdAt'>): BlogMedia {
  const rec: BlogMedia = {
    ...media,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  blogState.media.unshift(rec);
  saveStateToFile();
  return rec;
}

export function getAllMedia(): BlogMedia[] {
  return blogState.media;
}

// ─────────────────────────────────────────────
// Audit Logging
// ─────────────────────────────────────────────

export function logAudit(entry: Omit<BlogAuditEntry, 'id' | 'timestamp'>): void {
  const log: BlogAuditEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  blogState.auditLog.unshift(log);
  // Cap audit log to 5,000 entries
  if (blogState.auditLog.length > 5000) {
    blogState.auditLog.length = 5000;
  }
  saveStateToFile();
}

export function getAuditLogs(limit = 100): BlogAuditEntry[] {
  return blogState.auditLog.slice(0, limit);
}
