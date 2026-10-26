/**
 * PolyLance Blog Studio & Public API Routes
 *
 * Implements:
 * 1. Public endpoints: GET /api/blog/posts, GET /api/blog/posts/:slug, GET /api/blog/preview
 *    - Never returns drafts, in_review, or archived posts to the public.
 * 2. Protected Studio endpoints: /api/studio/blog/*
 *    - Enforces requireBlogRole middleware on every endpoint.
 *    - Re-checks role on every request from database/store.
 *    - 401 for unauthenticated, 403 for insufficient roles.
 * 3. Realtime event emission via Socket.IO (io.emit) on publish/update/delete.
 * 4. Secure media upload with MIME verification, size limit (5MB), and alt text.
 * 5. Team management (admin only) with last-admin removal prevention.
 */

import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  getPublicPosts,
  getPublicPostBySlug,
  getPostById,
  getPostByPreviewToken,
  getAllStudioPosts,
  createPostDraft,
  updatePost,
  setPostStatus,
  softDeletePost,
  getPostRevisions,
  restorePostRevision,
  generatePreviewToken,
  revokePreviewToken,
  getAllTeamMembers,
  addOrUpdateTeamMember,
  removeTeamMember,
  addMediaRecord,
  getAllMedia,
  getAuditLogs,
  getBlogTeamMember,
} from './store.js';
import { BlogRole } from './types.js';
import { io } from '../server.js';
import { getSystemAdminWallets } from '../auth.js';

export const blogRouter = express.Router();

// ─────────────────────────────────────────────
// Middleware: Server-side Role Authorization
// ─────────────────────────────────────────────
export function requireBlogRole(allowedRoles: BlogRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const session = (req as any).session;
    if (!session || !session.wallet) {
      res.status(401).json({ error: 'Authentication required. Please sign in with your wallet.', code: 'UNAUTHORIZED' });
      return;
    }

    const member = getBlogTeamMember(session.wallet);
    if (!member || !member.active) {
      res.status(403).json({ error: 'Access denied: You are not an authorized Blog Studio team member.', code: 'FORBIDDEN' });
      return;
    }

    if (!allowedRoles.includes(member.role)) {
      res.status(403).json({
        error: `Insufficient role privileges. Required: [${allowedRoles.join(', ')}], current: ${member.role}.`,
        code: 'FORBIDDEN',
      });
      return;
    }

    (req as any).blogUser = member;
    next();
  };
}

// ─────────────────────────────────────────────
// Public API Endpoints
// ─────────────────────────────────────────────

/**
 * GET /api/blog/posts — List all published posts
 */
blogRouter.get('/api/blog/posts', (req: Request, res: Response) => {
  const posts = getPublicPosts().map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.excerpt,
    summary: p.excerpt,
    author: p.authorName,
    publishedAt: p.publishedAt,
    updatedAt: p.updatedAt,
    readingTimeMinutes: p.readingMinutes,
    category: p.category,
    tags: p.tags,
    coverImage: p.coverImage,
    coverVideo: p.coverVideo,
    coverAlt: p.coverAlt,
    keyTakeaways: p.keyTakeaways,
  }));
  res.json({ success: true, posts });
});

/**
 * GET /api/blog/posts/:slug — Get single published post
 */
blogRouter.get('/api/blog/posts/:slug', (req: Request, res: Response) => {
  const post = getPublicPostBySlug(req.params.slug as string);
  if (!post) {
    res.status(404).json({ error: 'Article not found or no longer available', code: 'NOT_FOUND' });
    return;
  }
  res.json({ success: true, post });
});

/**
 * GET /api/blog/preview — Time-limited preview for draft/in_review posts
 */
blogRouter.get('/api/blog/preview', (req: Request, res: Response) => {
  const token = String(req.query.token || '');
  if (!token) {
    res.status(400).json({ error: 'Missing preview token', code: 'BAD_REQUEST' });
    return;
  }
  const post = getPostByPreviewToken(token);
  if (!post) {
    res.status(404).json({ error: 'Invalid or expired preview link', code: 'PREVIEW_EXPIRED' });
    return;
  }
  res.json({ success: true, post, isPreview: true });
});

// ─────────────────────────────────────────────
// Studio API Endpoints (Role Protected)
// ─────────────────────────────────────────────

/**
 * GET /api/studio/me and GET /api/studio/blog/me — Check current user's Blog Studio permissions
 * Accessible to ANY signed-in user.
 * Returns 200 { role: "admin"|"blog_editor"|"blog_author"|null, active: boolean, address: string }
 * Returns 401 only if not signed in (missing valid session).
 */
const handleStudioMe = (req: Request, res: Response): void => {
  res.setHeader('Cache-Control', 'no-store');
  const session = (req as any).session;
  if (!session || !session.wallet) {
    res.status(401).json({ error: 'Authentication required. Please sign in with your wallet.', code: 'UNAUTHORIZED' });
    return;
  }

  const rawAddress = String(session.wallet);
  const address = rawAddress.toLowerCase().trim();
  const isSystemAdmin = getSystemAdminWallets().has(address);
  const member = getBlogTeamMember(address);

  let role: BlogRole | null = null;
  let active = false;

  if (member) {
    if (member.active) {
      role = member.role;
      active = true;
    } else {
      // Inactive flag respected even if wallet is in admin config
      role = null;
      active = false;
    }
  } else if (isSystemAdmin) {
    // Admin wallets from existing admin config always resolve to admin even without a blog_team row
    role = 'admin';
    active = true;
  }

  // Server logs (without sensitive data) when a wallet present in blog_team or admin config resolves to null
  if (role === null && (member || isSystemAdmin)) {
    console.warn(`[BLOG STUDIO AUTH] Wallet ${address.slice(0, 6)}...${address.slice(-4)} present in blog_team/admin config resolved to null (member_active=${member?.active ?? false})`);
  }

  res.status(200).json({
    role,
    active,
    address,
  });
};

blogRouter.get('/api/studio/me', handleStudioMe);
blogRouter.get('/api/studio/blog/me', handleStudioMe);

/**
 * GET /api/studio/blog/posts — List posts for Studio dashboard
 */
blogRouter.get(
  '/api/studio/blog/posts',
  requireBlogRole(['admin', 'blog_editor', 'blog_author']),
  (req: Request, res: Response) => {
    const user = (req as any).blogUser;
    const posts = getAllStudioPosts(user.role, user.wallet);
    res.json({ success: true, posts });
  }
);

/**
 * GET /api/studio/blog/posts/:id — Get full post details & revisions
 */
blogRouter.get(
  '/api/studio/blog/posts/:id',
  requireBlogRole(['admin', 'blog_editor', 'blog_author']),
  (req: Request, res: Response) => {
    const post = getPostById(req.params.id as string);
    if (!post) {
      res.status(404).json({ error: 'Post not found', code: 'NOT_FOUND' });
      return;
    }
    const user = (req as any).blogUser;
    if (user.role === 'blog_author' && post.authorId.toLowerCase() !== user.wallet.toLowerCase()) {
      res.status(403).json({ error: 'Access denied: You can only view your own drafts', code: 'FORBIDDEN' });
      return;
    }
    const revisions = getPostRevisions(post.id);
    res.json({ success: true, post, revisions });
  }
);

/**
 * POST /api/studio/blog/posts — Create new post draft
 */
blogRouter.post(
  '/api/studio/blog/posts',
  requireBlogRole(['admin', 'blog_editor', 'blog_author']),
  (req: Request, res: Response) => {
    const user = (req as any).blogUser;
    const { title, contentMarkdown, excerpt, category, tags, authorName, contentJson } = req.body;

    const post = createPostDraft(
      { title, contentMarkdown, excerpt, category, tags, contentJson },
      user.wallet,
      authorName || 'PolyLance Team'
    );

    res.status(201).json({ success: true, post });
  }
);

/**
 * PUT /api/studio/blog/posts/:id — Update existing post (Autosave endpoint)
 */
blogRouter.put(
  '/api/studio/blog/posts/:id',
  requireBlogRole(['admin', 'blog_editor', 'blog_author']),
  (req: Request, res: Response) => {
    const user = (req as any).blogUser;
    const result = updatePost(req.params.id as string, req.body, user.wallet, user.role);

    if (!result.success) {
      res.status(result.error?.includes('denied') ? 403 : 400).json({ error: result.error });
      return;
    }

    // If published post is updated, broadcast realtime update event
    if (result.post?.status === 'published') {
      try {
        io.emit('blog:event', {
          type: 'updated',
          slug: result.post.slug,
          updatedAt: result.post.updatedAt,
        });
      } catch {
        /* socket emit fallback */
      }
    }

    res.json({ success: true, post: result.post });
  }
);

/**
 * POST /api/studio/blog/posts/:id/publish — Publish post (Editors & Admins only)
 */
blogRouter.post(
  '/api/studio/blog/posts/:id/publish',
  requireBlogRole(['admin', 'blog_editor']),
  (req: Request, res: Response) => {
    const user = (req as any).blogUser;
    const result = setPostStatus(req.params.id as string, 'published', user.wallet, user.role);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Realtime broadcast to all connected readers
    try {
      io.emit('blog:event', {
        type: 'published',
        slug: result.post?.slug,
        updatedAt: result.post?.updatedAt,
      });
    } catch {
      /* socket emit fallback */
    }

    res.json({ success: true, post: result.post });
  }
);

/**
 * POST /api/studio/blog/posts/:id/unpublish — Unpublish post back to draft
 */
blogRouter.post(
  '/api/studio/blog/posts/:id/unpublish',
  requireBlogRole(['admin', 'blog_editor']),
  (req: Request, res: Response) => {
    const user = (req as any).blogUser;
    const result = setPostStatus(req.params.id as string, 'draft', user.wallet, user.role);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    try {
      io.emit('blog:event', {
        type: 'unpublished',
        slug: result.post?.slug,
        updatedAt: result.post?.updatedAt,
      });
    } catch {
      /* socket emit fallback */
    }

    res.json({ success: true, post: result.post });
  }
);

/**
 * POST /api/studio/blog/posts/:id/archive — Archive post
 */
blogRouter.post(
  '/api/studio/blog/posts/:id/archive',
  requireBlogRole(['admin', 'blog_editor']),
  (req: Request, res: Response) => {
    const user = (req as any).blogUser;
    const result = setPostStatus(req.params.id as string, 'archived', user.wallet, user.role);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    try {
      io.emit('blog:event', {
        type: 'deleted',
        slug: result.post?.slug,
        updatedAt: result.post?.updatedAt,
      });
    } catch {
      /* socket emit fallback */
    }

    res.json({ success: true, post: result.post });
  }
);

/**
 * DELETE /api/studio/blog/posts/:id — Soft delete post
 */
blogRouter.delete(
  '/api/studio/blog/posts/:id',
  requireBlogRole(['admin', 'blog_editor']),
  (req: Request, res: Response) => {
    const user = (req as any).blogUser;
    const post = getPostById(req.params.id as string);
    const result = softDeletePost(req.params.id as string, user.wallet);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    try {
      io.emit('blog:event', {
        type: 'deleted',
        slug: post?.slug,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      /* socket emit fallback */
    }

    res.json({ success: true });
  }
);

/**
 * POST /api/studio/blog/posts/:id/preview-token — Generate unguessable preview link
 */
blogRouter.post(
  '/api/studio/blog/posts/:id/preview-token',
  requireBlogRole(['admin', 'blog_editor', 'blog_author']),
  (req: Request, res: Response) => {
    const { token, expiresAt } = generatePreviewToken(req.params.id as string, 48);
    res.json({ success: true, token, expiresAt });
  }
);

/**
 * POST /api/studio/blog/posts/:id/preview-token/revoke — Revoke preview link
 */
blogRouter.post(
  '/api/studio/blog/posts/:id/preview-token/revoke',
  requireBlogRole(['admin', 'blog_editor', 'blog_author']),
  (req: Request, res: Response) => {
    revokePreviewToken(req.params.id as string);
    res.json({ success: true });
  }
);

/**
 * POST /api/studio/blog/posts/:id/revisions/:revId/restore — Restore previous revision
 */
blogRouter.post(
  '/api/studio/blog/posts/:id/revisions/:revId/restore',
  requireBlogRole(['admin', 'blog_editor']),
  (req: Request, res: Response) => {
    const user = (req as any).blogUser;
    const result = restorePostRevision(req.params.id as string, req.params.revId as string, user.wallet);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ success: true, post: result.post });
  }
);

// ─────────────────────────────────────────────
// Team Management (Admin Only)
// ─────────────────────────────────────────────

/**
 * GET /api/studio/blog/team — List team members
 */
blogRouter.get(
  '/api/studio/blog/team',
  requireBlogRole(['admin']),
  (req: Request, res: Response) => {
    const members = getAllTeamMembers();
    res.json({ success: true, team: members });
  }
);

/**
 * POST /api/studio/blog/team — Add/update team member
 */
blogRouter.post(
  '/api/studio/blog/team',
  requireBlogRole(['admin']),
  (req: Request, res: Response) => {
    const user = (req as any).blogUser;
    const { wallet, role } = req.body;

    if (!wallet || !role || !['admin', 'blog_editor', 'blog_author'].includes(role)) {
      res.status(400).json({ error: 'Valid wallet address and role (admin, blog_editor, blog_author) required' });
      return;
    }

    const result = addOrUpdateTeamMember(wallet, role, user.wallet);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ success: true, member: result.member });
  }
);

/**
 * DELETE /api/studio/blog/team/:wallet — Remove team member
 */
blogRouter.delete(
  '/api/studio/blog/team/:wallet',
  requireBlogRole(['admin']),
  (req: Request, res: Response) => {
    const user = (req as any).blogUser;
    const result = removeTeamMember(req.params.wallet as string, user.wallet);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ success: true });
  }
);

// ─────────────────────────────────────────────
// Media Management & Upload
// ─────────────────────────────────────────────

/**
 * POST /api/studio/blog/media — Upload media asset
 */
blogRouter.post(
  '/api/studio/blog/media',
  requireBlogRole(['admin', 'blog_editor', 'blog_author']),
  (req: Request, res: Response) => {
    const user = (req as any).blogUser;
    const { dataUrl, alt, mime, size } = req.body;

    if (!alt || typeof alt !== 'string' || !alt.trim()) {
      res.status(400).json({ error: 'Alt text is strictly required for all uploaded images for accessibility & SEO.' });
      return;
    }

    const allowedMimes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!mime || !allowedMimes.includes(mime.toLowerCase())) {
      res.status(400).json({ error: 'Invalid file format. Allowed types: PNG, JPEG, WebP.' });
      return;
    }

    const maxBytes = 5 * 1024 * 1024; // 5MB limit
    if (size && size > maxBytes) {
      res.status(400).json({ error: 'File size exceeds 5MB limit.' });
      return;
    }

    // Save media record (using data URL or public asset path)
    const media = addMediaRecord({
      url: dataUrl || `/assets/blog/${crypto.randomBytes(8).toString('hex')}.webp`,
      alt: alt.trim(),
      size: size || 10240,
      mime: mime.toLowerCase(),
      uploadedBy: user.wallet,
    });

    res.status(201).json({ success: true, media });
  }
);

/**
 * GET /api/studio/blog/media — List media library
 */
blogRouter.get(
  '/api/studio/blog/media',
  requireBlogRole(['admin', 'blog_editor', 'blog_author']),
  (req: Request, res: Response) => {
    const media = getAllMedia();
    res.json({ success: true, media });
  }
);

// ─────────────────────────────────────────────
// Audit Log (Admin Only)
// ─────────────────────────────────────────────

/**
 * GET /api/studio/blog/audit — View audit log
 */
blogRouter.get(
  '/api/studio/blog/audit',
  requireBlogRole(['admin']),
  (req: Request, res: Response) => {
    const logs = getAuditLogs(200);
    res.json({ success: true, auditLogs: logs });
  }
);

console.log('[BLOG STUDIO] Routes mounted: /api/studio/me, /api/studio/blog/me, /api/studio/blog/posts, /api/studio/blog/team, /api/studio/blog/media, /api/studio/blog/audit');

