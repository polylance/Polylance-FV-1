import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  MessageSquare,
  AlertCircle,
  PlusCircle,
  ThumbsUp,
  Bookmark,
  Search,
  ShieldCheck,
  Sparkles,
  Clock,
  ArrowUpRight,
  Send,
  Layers,
  Flame,
  Users,
  Github,
  Palette,
  Star,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Seo } from '../components/seo/Seo';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useAccountMode } from '../hooks/useAccountMode';
import { calculateClientTrustStats } from '../utils/clientReputation';
import { truncateAddress, formatTimeAgo } from '../utils/formatters';
import {
  CommunityTab,
  CommunityPost,
  CommunityPostKind,
  ComplaintCategory,
  AuthorRoleKind,
} from '../features/community/communityTypes';
import { communityService } from '../features/community/communityService';

const COMMUNITY_TABS: Array<{ id: CommunityTab; label: string }> = [
  { id: 'all', label: 'All Posts' },
  { id: 'opinion', label: 'Opinions & Discussions' },
  { id: 'blog', label: 'Blogs & Guides' },
  { id: 'complaint', label: 'Complaints & Feedback' },
];

const COMPLAINT_CATEGORIES: ComplaintCategory[] = [
  'Escrow',
  'UI/UX',
  'Dispute',
  'Verification',
  'General',
];

const DISCIPLINE_OPTIONS = [
  'Web3 & Blockchain',
  'Development & IT',
  'AI & Automation',
  'Design & Creative',
  'Video, Audio & Animation',
  'Creators & Brand Collabs',
  'Marketing',
  'Writing & Content',
  'Data & Analytics',
  'Protocol Governance',
];

export const CommunityPage: React.FC = () => {
  const { address, isConnected, currentRole, connectWallet } = useWeb3();
  const { jobs, profiles } = usePolyLanceData();
  const { accountMode } = useAccountMode();

  const [activeTab, setActiveTab] = useState<CommunityTab>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'freelancer' | 'client'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() =>
    communityService.getBookmarkedIds()
  );
  const [isLoading, setIsLoading] = useState(true);

  // Expanded thread & article reader
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [readingPost, setReadingPost] = useState<CommunityPost | null>(null);

  // Create Post Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [postKind, setPostKind] = useState<CommunityPostKind>('opinion');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postDiscipline, setPostDiscipline] = useState(DISCIPLINE_OPTIONS[0]);
  const [complaintCat, setComplaintCat] = useState<ComplaintCategory>('Escrow');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const data = await communityService.getPosts();
        if (mounted) setPosts(data);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Derive authenticated user's locked role (cannot spoof roles)
  const currentUserProfile = useMemo(() => {
    if (!address) return null;
    const key = Object.keys(profiles || {}).find((k) => k.toLowerCase() === address.toLowerCase());
    return key ? profiles[key] : null;
  }, [address, profiles]);

  const detectedRoleKind: AuthorRoleKind = useMemo(() => {
    if (accountMode === 'client' || currentRole === 'client' || currentUserProfile?.role === 'client') {
      return 'client';
    }
    if (currentUserProfile?.freelancerTrack === 'non-tech' || currentUserProfile?.portfolioVerified) {
      return 'non-tech-freelancer';
    }
    return 'tech-freelancer';
  }, [accountMode, currentRole, currentUserProfile]);

  const resolveAuthorMeta = (authorAddr: string, fallbackKind?: AuthorRoleKind) => {
    const key = Object.keys(profiles || {}).find((k) => k.toLowerCase() === authorAddr.toLowerCase());
    const prof = key ? profiles[key] : null;
    const clientStats = calculateClientTrustStats(authorAddr, jobs, prof);

    const isClientAuthor =
      fallbackKind === 'client' ||
      prof?.accountMode === 'client' ||
      prof?.role === 'client';

    if (isClientAuthor) {
      return {
        handle: prof?.displayName || truncateAddress(authorAddr),
        roleGroup: 'client' as const,
        badgeText:
          clientStats.jobsSettled > 0
            ? `Client • ${clientStats.averageRating.toFixed(1)}★ • ${clientStats.jobsSettled} Settled`
            : `Client • Verified Escrow Patron`,
        isClient: true,
        isTechVerified: false,
        isPortfolioVerified: false,
      };
    }

    const isNonTech =
      fallbackKind === 'non-tech-freelancer' ||
      prof?.freelancerTrack === 'non-tech' ||
      Boolean(prof?.portfolioVerified);

    if (isNonTech) {
      return {
        handle: prof?.displayName || truncateAddress(authorAddr),
        roleGroup: 'freelancer' as const,
        badgeText: prof?.portfolioVerified
          ? 'Non-Tech Freelancer • Portfolio Verified ✓'
          : 'Non-Tech Freelancer',
        isClient: false,
        isTechVerified: false,
        isPortfolioVerified: true,
      };
    }

    return {
      handle: prof?.displayName || truncateAddress(authorAddr),
      roleGroup: 'freelancer' as const,
      badgeText: prof?.githubVerified
        ? 'Tech Freelancer • GitHub Verified ✓'
        : 'Tech Freelancer',
      isClient: false,
      isTechVerified: true,
      isPortfolioVerified: false,
    };
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      connectWallet();
      return;
    }
    if (!postTitle.trim() || !postContent.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await communityService.createPost({
        author: address,
        authorName: currentUserProfile?.displayName,
        authorRoleKind: detectedRoleKind,
        kind: postKind,
        discipline: postDiscipline,
        complaintCategory: postKind === 'complaint' ? complaintCat : undefined,
        complaintStatus: postKind === 'complaint' ? 'Open' : undefined,
        coverImage:
          postKind === 'blog' ? '/images/showcase/editorial-docs.webp' : undefined,
        title: postTitle.trim(),
        content: postContent.trim(),
        tags: [
          postKind === 'complaint' ? complaintCat : postDiscipline,
        ],
        language: 'en',
        isPinned: false,
      });
      setPosts((prev) => [created, ...prev]);
      setPostTitle('');
      setPostContent('');
      setIsCreateOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (postId: string) => {
    const updated = await communityService.togglePostUpvote(postId);
    setPosts(updated);
  };

  const handleToggleBookmark = (postId: string) => {
    const next = communityService.toggleBookmark(postId);
    setBookmarkedIds(next);
  };

  const handleAddReply = async (postId: string) => {
    const text = (replyDrafts[postId] || '').trim();
    if (!text) return;
    if (!isConnected || !address) {
      connectWallet();
      return;
    }
    const updated = await communityService.addPostReply(postId, {
      author: address,
      authorName: currentUserProfile?.displayName,
      authorRoleKind: detectedRoleKind,
      content: text,
    });
    setPosts(updated);
    setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const kind: CommunityPostKind = p.kind || 'opinion';
      if (activeTab !== 'all' && kind !== activeTab) return false;

      if (roleFilter !== 'all') {
        const meta = resolveAuthorMeta(p.author, p.authorRoleKind);
        if (meta.roleGroup !== roleFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hit =
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.discipline || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [posts, activeTab, roleFilter, searchQuery, profiles, jobs]);

  const trendingPosts = useMemo(() => {
    return [...posts].sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0)).slice(0, 4);
  }, [posts]);

  const topContributors = useMemo(() => {
    const map = new Map<string, { address: string; postsCount: number; roleKind?: AuthorRoleKind }>();
    posts.forEach((p) => {
      const key = p.author.toLowerCase();
      const existing = map.get(key);
      map.set(key, {
        address: p.author,
        postsCount: (existing?.postsCount || 0) + 1,
        roleKind: p.authorRoleKind,
      });
    });
    Object.keys(profiles || {}).slice(0, 4).forEach((addr) => {
      const key = addr.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { address: addr, postsCount: 0 });
      }
    });
    return Array.from(map.values()).slice(0, 5);
  }, [posts, profiles]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] pb-24 text-left">
      <Seo routeKey="/community" />

      {/* Top Hero & Sliding Cobalt Tab Header */}
      <section className="w-full bg-[#F8FAFC] border-b border-slate-200/80 pt-10 pb-8">
        <PageContainer noVerticalPadding>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#0A52B8] text-xs font-mono font-semibold">
                <Sparkles size={13} />
                <span>Verified Community Network</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
                PolyLance Community Hub
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Discuss Web3 &amp; creative craft, read verified guides, and share transparent platform feedback—with every post displaying verified Client or Freelancer credentials.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (!isConnected) {
                  connectWallet();
                  return;
                }
                setIsCreateOpen(true);
              }}
              icon={<PlusCircle size={16} />}
            >
              Create Post
            </Button>
          </div>

          {/* Interactive Tabs with Shared layoutId Indicator */}
          <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-white border border-slate-200 max-w-full">
              {COMMUNITY_TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      active ? 'text-white' : 'text-slate-600 hover:text-[#0F172A]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="communityMainTab"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-[#0A52B8] z-0"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Secondary Role Filter + Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center p-1 rounded-xl bg-white border border-slate-200 text-xs">
                {[
                  { id: 'all' as const, label: 'All Roles' },
                  { id: 'freelancer' as const, label: 'Freelancers' },
                  { id: 'client' as const, label: 'Clients' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoleFilter(r.id)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      roleFilter === r.id
                        ? 'bg-[#0F172A] text-white'
                        : 'text-slate-600 hover:text-[#0F172A]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[210px] flex-1 sm:flex-initial">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0A52B8]"
                />
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Main Feed + Sidebar */}
      <PageContainer className="pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT FEED COLUMN (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-4">
            {isLoading ? (
              <div className="p-10 rounded-2xl border border-slate-200 bg-white text-center text-sm text-slate-500">
                Loading community discussions...
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-10 rounded-2xl border border-slate-200/90 bg-white text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#0A52B8] mx-auto flex items-center justify-center">
                  <MessageSquare size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#0F172A]">
                    No posts in this feed yet
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                    Start the first discussion, publish a technical or creative guide, or submit structured platform feedback with your verified wallet role.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!isConnected) {
                      connectWallet();
                      return;
                    }
                    setIsCreateOpen(true);
                  }}
                  icon={<PlusCircle size={14} />}
                >
                  Create the First Post
                </Button>
              </div>
            ) : (
              filteredPosts.map((post, idx) => {
                const kind: CommunityPostKind = post.kind || 'opinion';
                const authorMeta = resolveAuthorMeta(post.author, post.authorRoleKind);
                const isBookmarked = bookmarkedIds.includes(post.id);
                const isThreadOpen = openThreadId === post.id;

                return (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: Math.min(idx * 0.04, 0.25) }}
                    className="rounded-2xl bg-white border border-slate-200/90 hover:border-[#BFDBFE] p-5 sm:p-6 space-y-4 transition-colors shadow-2xs"
                  >
                    {/* Author Row + Role Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#0A52B8] flex items-center justify-center text-xs font-bold">
                          {(authorMeta.handle || 'P').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-[#0F172A]">
                          {post.authorName || authorMeta.handle}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            authorMeta.isClient
                              ? 'bg-[#F8FAFC] border-slate-200 text-[#0F172A]'
                              : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0A52B8]'
                          }`}
                        >
                          {authorMeta.isClient ? (
                            <Star size={11} className="text-[#0A52B8] fill-[#0A52B8]" />
                          ) : authorMeta.isPortfolioVerified ? (
                            <Palette size={11} />
                          ) : (
                            <Github size={11} />
                          )}
                          <span>{authorMeta.badgeText}</span>
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-slate-500">
                        {formatTimeAgo(new Date(post.createdAt).getTime())}
                      </span>
                    </div>

                    {/* Kind & Category Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-[#0F172A] text-[11px] font-mono font-semibold uppercase">
                        {kind === 'blog' ? 'Blog & Guide' : kind === 'complaint' ? 'Complaint & Feedback' : 'Discussion'}
                      </span>
                      {post.discipline && (
                        <span className="px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#0A52B8] text-[11px] font-medium">
                          {post.discipline}
                        </span>
                      )}
                      {kind === 'complaint' && post.complaintCategory && (
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                          Area: {post.complaintCategory}
                        </span>
                      )}
                      {kind === 'complaint' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#0A52B8] text-[11px] font-semibold">
                          Status: {post.complaintStatus || 'Open'}
                        </span>
                      )}
                      {kind === 'blog' && post.readTimeMin && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
                          <Clock size={11} />
                          <span>{post.readTimeMin} min read</span>
                        </span>
                      )}
                    </div>

                    {/* Blog Cover Preview OR Body */}
                    {kind === 'blog' && post.coverImage && (
                      <div className="rounded-xl overflow-hidden border border-slate-200/80 aspect-[16/7] bg-[#F8FAFC]">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <h2 className="text-lg font-bold text-[#0F172A] leading-snug">
                        {post.title}
                      </h2>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-4">
                        {post.content}
                      </p>
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.92 }}
                          onClick={() => handleUpvote(post.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                            post.userHasVoted
                              ? 'bg-[#EFF6FF] border-[#0A52B8] text-[#0A52B8]'
                              : 'bg-[#F8FAFC] border-slate-200 text-slate-700 hover:border-[#0A52B8]'
                          }`}
                        >
                          <ThumbsUp size={13} />
                          <span className="tabular-nums">{post.upvotesCount || 0}</span>
                        </motion.button>

                        <button
                          type="button"
                          onClick={() => setOpenThreadId(isThreadOpen ? null : post.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-slate-200 hover:border-[#0A52B8] text-xs font-semibold text-slate-700 cursor-pointer"
                        >
                          <MessageSquare size={13} />
                          <span>{post.replies?.length || post.commentsCount || 0} Replies</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(post.id)}
                          aria-label="Bookmark post"
                          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                            isBookmarked
                              ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0A52B8]'
                              : 'bg-[#F8FAFC] border-slate-200 text-slate-500 hover:text-[#0F172A]'
                          }`}
                        >
                          <Bookmark size={14} className={isBookmarked ? 'fill-current' : ''} />
                        </button>
                      </div>

                      {kind === 'blog' && (
                        <button
                          type="button"
                          onClick={() => setReadingPost(post)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A52B8] hover:underline cursor-pointer"
                        >
                          <span>Read Full Article</span>
                          <ArrowUpRight size={13} />
                        </button>
                      )}
                    </div>

                    {/* Threaded Replies */}
                    {isThreadOpen && (
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        {(post.replies || []).map((rep) => {
                          const repMeta = resolveAuthorMeta(rep.author, rep.authorRoleKind);
                          return (
                            <div key={rep.id} className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#0F172A]">
                                    {rep.authorName || repMeta.handle}
                                  </span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-[#0A52B8]">
                                    {repMeta.badgeText}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {formatTimeAgo(new Date(rep.createdAt).getTime())}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed">{rep.content}</p>
                            </div>
                          );
                        })}

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={replyDrafts[post.id] || ''}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            placeholder="Write a reply with your verified role..."
                            className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] focus:outline-none focus:border-[#0A52B8]"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddReply(post.id)}
                            className="shrink-0 px-3.5 py-2 rounded-xl bg-[#0A52B8] hover:bg-[#084298] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Send size={12} />
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.article>
                );
              })
            )}
          </div>

          {/* RIGHT SIDEBAR WIDGETS (lg:col-span-4) */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            {/* Trending Discussions */}
            <div className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#0A52B8]">
                <Flame size={14} />
                <span>Trending Discussions</span>
              </div>
              {trendingPosts.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Publish a post or guide to start trending community discussions.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {trendingPosts.map((tp) => (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => setReadingPost(tp)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-slate-200/70 transition-colors cursor-pointer space-y-1"
                    >
                      <div className="text-xs font-bold text-[#0F172A] line-clamp-1">{tp.title}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {tp.upvotesCount || 0} upvotes • {tp.discipline || 'Community'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Top Contributors */}
            <div className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#0A52B8]">
                <Users size={14} />
                <span>Verified Contributors</span>
              </div>
              {topContributors.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Verified builders and clients appear here as profiles and community posts grow.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {topContributors.map((c) => {
                    const meta = resolveAuthorMeta(c.address, c.roleKind);
                    return (
                      <Link
                        key={c.address}
                        to={`/profile/${c.address}`}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F8FAFC] hover:border-[#0A52B8] border border-slate-200/70 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#0F172A] truncate">{meta.handle}</div>
                          <div className="text-[10.5px] font-mono text-[#0A52B8] truncate">{meta.badgeText}</div>
                        </div>
                        <ArrowUpRight size={13} className="text-slate-400 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Community Guidelines & Protocol Changelog */}
            <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/90 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#0F172A]">
                <ShieldCheck size={14} className="text-[#0A52B8]" />
                <span>Guidelines &amp; Protocol Changelog</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li>• Role badges reflect your verified wallet track (Client, GitHub Tech, or Portfolio Creative).</li>
                <li>• Complaints include structured Escrow, Dispute &amp; UX area tracking.</li>
                <li>• Protocol update: Dual Tech &amp; Non-Tech verification live on Polygon PoS.</li>
              </ul>
            </div>
          </aside>
        </div>
      </PageContainer>

      {/* CREATE POST MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Publish to PolyLance Community"
        description="Your verified account role attaches automatically."
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePost} className="space-y-4 text-left">
          {/* Verified Role Preview (Cannot spoof) */}
          <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between text-xs">
            <span className="text-slate-700 font-medium">Posting with verified identity:</span>
            <span className="font-mono font-bold text-[#0A52B8]">
              {detectedRoleKind === 'client'
                ? 'Client Account'
                : detectedRoleKind === 'non-tech-freelancer'
                ? 'Non-Tech Freelancer • Portfolio'
                : 'Tech Freelancer • GitHub'}
            </span>
          </div>

          {/* Post Type */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'opinion' as CommunityPostKind, label: 'Opinion / Discussion', icon: MessageSquare },
              { id: 'blog' as CommunityPostKind, label: 'Blog & Guide', icon: BookOpen },
              { id: 'complaint' as CommunityPostKind, label: 'Complaint / Feedback', icon: AlertCircle },
            ].map((item) => {
              const Icon = item.icon;
              const active = postKind === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPostKind(item.id)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    active
                      ? 'bg-[#0A52B8] border-[#0A52B8] text-white'
                      : 'bg-white border-slate-200 text-[#0F172A] hover:border-[#0A52B8]'
                  }`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                {postKind === 'complaint' ? 'Issue Category' : 'Discipline Tag'}
              </label>
              {postKind === 'complaint' ? (
                <select
                  value={complaintCat}
                  onChange={(e) => setComplaintCat(e.target.value as ComplaintCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-[#0F172A]"
                >
                  {COMPLAINT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={postDiscipline}
                  onChange={(e) => setPostDiscipline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-[#0F172A]"
                >
                  {DISCIPLINE_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-end">
              <div className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-slate-200 text-[11px] font-mono text-slate-600 flex items-center gap-1.5">
                <Layers size={13} className="text-[#0A52B8]" />
                <span>Auto-badged to {address ? truncateAddress(address) : 'Wallet'}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Title</label>
            <input
              type="text"
              required
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder={
                postKind === 'complaint'
                  ? 'Clear summary of the issue or feedback...'
                  : 'Headline for your post or guide...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] focus:outline-none focus:border-[#0A52B8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Content</label>
            <textarea
              required
              rows={5}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Write clearly with helpful context, steps, or takeaways..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] focus:outline-none focus:border-[#0A52B8]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Publish Post
            </Button>
          </div>
        </form>
      </Modal>

      {/* ARTICLE / POST READER MODAL */}
      <Modal
        isOpen={Boolean(readingPost)}
        onClose={() => setReadingPost(null)}
        title={readingPost?.title || ''}
        description={readingPost?.discipline || 'Community Article'}
        maxWidth="lg"
      >
        {readingPost && (
          <div className="space-y-4 text-left">
            {readingPost.coverImage && (
              <img
                src={readingPost.coverImage}
                alt={readingPost.title}
                className="w-full rounded-xl border border-slate-200 max-h-64 object-cover"
              />
            )}
            <p className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">
              {readingPost.content}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CommunityPage;
