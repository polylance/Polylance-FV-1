import { getBaseApiUrl } from '../../utils/apiClient';
import {
  CommunityPost,
  CommunityReply,
  ProjectReview,
  IssueReport,
  ModerationLogEntry,
} from './communityTypes';

const LOCAL_STORAGE_POSTS_KEY = 'polylance_community_posts';
const LOCAL_STORAGE_ISSUES_KEY = 'polylance_community_issues';
const LOCAL_STORAGE_REVIEWS_KEY = 'polylance_community_reviews';
const LOCAL_STORAGE_BOOKMARKS_KEY = 'polylance_community_bookmarks';
const COMMUNITY_API_ENABLED = import.meta.env.VITE_ENABLE_COMMUNITY_API === 'true';

function getLocalItems<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalItems<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {}
}

export const communityService = {
  async getPosts(): Promise<CommunityPost[]> {
    if (COMMUNITY_API_ENABLED) {
      try {
        const res = await fetch(`${getBaseApiUrl()}/api/community/posts`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : data.posts || [];
        }
      } catch {
        // Fallback to localStorage persistence
      }
    }
    return getLocalItems<CommunityPost>(LOCAL_STORAGE_POSTS_KEY);
  },

  async createPost(
    postData: Omit<
      CommunityPost,
      'id' | 'createdAt' | 'updatedAt' | 'upvotesCount' | 'commentsCount' | 'slug'
    >
  ): Promise<CommunityPost> {
    const wordCount = (postData.content || '').trim().split(/\s+/).filter(Boolean).length;
    const readTimeMin = Math.max(1, Math.ceil(wordCount / 180));
    const newPost: CommunityPost = {
      ...postData,
      readTimeMin: postData.readTimeMin || readTimeMin,
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      slug: postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      upvotesCount: 1,
      userHasVoted: true,
      commentsCount: 0,
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (COMMUNITY_API_ENABLED) {
      try {
        const res = await fetch(`${getBaseApiUrl()}/api/community/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newPost),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {}
    }

    const localPosts = getLocalItems<CommunityPost>(LOCAL_STORAGE_POSTS_KEY);
    const updated = [newPost, ...localPosts];
    setLocalItems(LOCAL_STORAGE_POSTS_KEY, updated);
    return newPost;
  },

  async togglePostUpvote(postId: string): Promise<CommunityPost[]> {
    const posts = getLocalItems<CommunityPost>(LOCAL_STORAGE_POSTS_KEY);
    const updated = posts.map((p) => {
      if (p.id !== postId) return p;
      const voted = Boolean(p.userHasVoted);
      return {
        ...p,
        upvotesCount: voted ? Math.max(0, (p.upvotesCount || 0) - 1) : (p.upvotesCount || 0) + 1,
        userHasVoted: !voted,
      };
    });
    setLocalItems(LOCAL_STORAGE_POSTS_KEY, updated);
    return updated;
  },

  async addPostReply(postId: string, reply: Omit<CommunityReply, 'id' | 'createdAt'>): Promise<CommunityPost[]> {
    const posts = getLocalItems<CommunityPost>(LOCAL_STORAGE_POSTS_KEY);
    const newReply: CommunityReply = {
      ...reply,
      id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = posts.map((p) => {
      if (p.id !== postId) return p;
      const nextReplies = [...(p.replies || []), newReply];
      return {
        ...p,
        replies: nextReplies,
        commentsCount: nextReplies.length,
        updatedAt: new Date().toISOString(),
      };
    });
    setLocalItems(LOCAL_STORAGE_POSTS_KEY, updated);
    return updated;
  },

  getBookmarkedIds(): string[] {
    return getLocalItems<string>(LOCAL_STORAGE_BOOKMARKS_KEY);
  },

  toggleBookmark(postId: string): string[] {
    const current = getLocalItems<string>(LOCAL_STORAGE_BOOKMARKS_KEY);
    const next = current.includes(postId)
      ? current.filter((id) => id !== postId)
      : [...current, postId];
    setLocalItems(LOCAL_STORAGE_BOOKMARKS_KEY, next);
    return next;
  },

  async getReviews(): Promise<ProjectReview[]> {
    if (COMMUNITY_API_ENABLED) {
      try {
        const res = await fetch(`${getBaseApiUrl()}/api/community/reviews`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : data.reviews || [];
        }
      } catch {}
    }
    return getLocalItems<ProjectReview>(LOCAL_STORAGE_REVIEWS_KEY);
  },

  async getIssues(): Promise<IssueReport[]> {
    if (COMMUNITY_API_ENABLED) {
      try {
        const res = await fetch(`${getBaseApiUrl()}/api/community/issues`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : data.issues || [];
        }
      } catch {}
    }
    return getLocalItems<IssueReport>(LOCAL_STORAGE_ISSUES_KEY);
  },

  async createIssue(
    issueData: Omit<IssueReport, 'id' | 'createdAt' | 'updatedAt' | 'upvotesCount' | 'status'>
  ): Promise<IssueReport> {
    const newIssue: IssueReport = {
      ...issueData,
      id: `issue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: 'Open',
      upvotesCount: 1,
      userHasVoted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (COMMUNITY_API_ENABLED) {
      try {
        const res = await fetch(`${getBaseApiUrl()}/api/community/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newIssue),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {}
    }

    const localIssues = getLocalItems<IssueReport>(LOCAL_STORAGE_ISSUES_KEY);
    const updated = [newIssue, ...localIssues];
    setLocalItems(LOCAL_STORAGE_ISSUES_KEY, updated);
    return newIssue;
  },

  async toggleIssueVote(issueId: string, walletAddress: string): Promise<IssueReport[]> {
    const issues = getLocalItems<IssueReport>(LOCAL_STORAGE_ISSUES_KEY);
    const updated = issues.map((iss) => {
      if (iss.id === issueId) {
        const hasVoted = !!iss.userHasVoted;
        return {
          ...iss,
          upvotesCount: hasVoted ? Math.max(0, iss.upvotesCount - 1) : iss.upvotesCount + 1,
          userHasVoted: !hasVoted,
        };
      }
      return iss;
    });
    setLocalItems(LOCAL_STORAGE_ISSUES_KEY, updated);

    if (COMMUNITY_API_ENABLED) {
      try {
        await fetch(`${getBaseApiUrl()}/api/community/issues/${issueId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ voter: walletAddress }),
        });
      } catch {}
    }

    return updated;
  },

  async getModerationLog(): Promise<ModerationLogEntry[]> {
    if (COMMUNITY_API_ENABLED) {
      try {
        const res = await fetch(`${getBaseApiUrl()}/api/community/moderation-log`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : data.logs || [];
        }
      } catch {}
    }
    return [];
  },
};
