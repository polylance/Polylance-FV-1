import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  Clock,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Shield,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  AlertCircle,
  List,
  Check,
  Copy,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { getBlogPostBySlug, getAllBlogPosts } from '../seo';
import { MarkdownRenderer } from '../components/blog/MarkdownRenderer';
import { BlogToc } from '../components/blog/BlogToc';
import { BlogCard } from '../components/blog/BlogCard';
import { ArticleLeftRail } from '../components/blog/ArticleLeftRail';
import { ArticleRightRail } from '../components/blog/ArticleRightRail';
import { ArticleMobileDrawer } from '../components/blog/ArticleMobileDrawer';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useWeb3 } from '../context/Web3Context';
import { getBackendSyncUrl } from '../utils/backendUrl';
import { calculateReadingTime, formatReadingTime } from '../utils/readingTime';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [readingProgress, setReadingProgress] = useState(0);
  const [updatedNotice, setUpdatedNotice] = useState<boolean>(false);
  const [isArchivedOrDeleted, setIsArchivedOrDeleted] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const articleRef = useRef<HTMLDivElement>(null);

  const { width } = useBreakpoint();
  const prefersReduced = useReducedMotion();
  const { isConnected, connectWallet } = useWeb3();

  // Desktop width tiers:
  // >= 1280px: 3 columns (Left rail 260px, Center 720px, Right rail 300px)
  // 1024px - 1279px: 2 columns (Center 720px, Right rail 280px with TOC)
  // < 1024px: 1 column
  const isWideDesktop = width >= 1280;
  const isMediumDesktop = width >= 1024 && width < 1280;

  const post = slug ? getBlogPostBySlug(slug) : undefined;
  const allPosts = getAllBlogPosts();

  // Track Reading Progress Bar
  useEffect(() => {
    const handleScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const elTop = rect.top + window.scrollY;
      const elHeight = el.offsetHeight;
      const winHeight = window.innerHeight;
      const scrollPos = window.scrollY;

      if (scrollPos < elTop) {
        setReadingProgress(0);
      } else if (scrollPos > elTop + elHeight - winHeight) {
        setReadingProgress(100);
      } else {
        const progress = ((scrollPos - elTop) / (elHeight - winHeight)) * 100;
        setReadingProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for realtime blog updates
  useEffect(() => {
    if (!slug) return;
    const backendUrl = getBackendSyncUrl();

    const interval = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`${backendUrl}/api/blog/posts/${slug}`, {
          headers: { Accept: 'application/json' },
        });
        if (res.status === 404) {
          setIsArchivedOrDeleted(true);
        } else if (res.ok) {
          const data = await res.json();
          if (data?.post?.updatedAt && post?.updatedAt && data.post.updatedAt !== post.updatedAt) {
            setUpdatedNotice(true);
          }
        }
      } catch {
        /* silent polling failure fallback */
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [slug, post?.updatedAt]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  // Related posts: matched by shared category/tags, never the current post
  const matchedRelated = allPosts
    .filter((p) => p.slug !== post.slug)
    .filter(
      (p) =>
        (post.category && p.category === post.category) ||
        p.tags?.some((t) => post.tags?.includes(t))
    );

  const relatedPosts = (
    matchedRelated.length >= 3
      ? matchedRelated
      : [
          ...matchedRelated,
          ...allPosts.filter((p) => p.slug !== post.slug && !matchedRelated.some((r) => r.slug === p.slug)),
        ]
  ).slice(0, 3);

  // Previous & Next posts
  const currentIndex = allPosts.findIndex((p) => p.slug === post.slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  // More guides (for bottom grid)
  const moreGuides = allPosts.filter((p) => p.slug !== post.slug).slice(0, 4);

  const canonicalUrl = `https://polylance.codes/blog/${post.slug}`;

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      setShareCopied(false);
    }
  };

  const customSeo = {
    path: `/blog/${post.slug}`,
    title: `${post.title} | PolyLance`,
    description: post.description,
    canonicalPath: `/blog/${post.slug}`,
    primaryKeywordId: post.primaryKeywordId,
    secondaryKeywordIds: post.secondaryKeywordIds,
    robots: 'index, follow' as const,
    jsonLdTypes: ['Article' as const, 'BreadcrumbList' as const],
    ogType: 'article' as const,
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' },
      { name: post.title, url: `/blog/${post.slug}` },
    ],
  };

  const progressPercent = Math.min(100, Math.max(0, Math.round(readingProgress)));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B0B0F] flex flex-col">
      <Seo customConfig={customSeo} extraData={{ article: post }} />

      {/* Reading Progress Bar (Fixed at very top) */}
      <div
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
        className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50 pointer-events-none"
      >
        <div
          className="h-full bg-[#0047AB] transition-all duration-100 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Realtime Notification Banners */}
      {isArchivedOrDeleted && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm font-medium text-amber-900 sticky top-16 z-40 flex items-center justify-center gap-2">
          <AlertCircle size={16} className="text-amber-700" />
          <span>This article is no longer available.</span>
          <Link to="/blog" className="underline font-bold text-[#0047AB] ml-2">
            Back to blog
          </Link>
        </div>
      )}

      {updatedNotice && !isArchivedOrDeleted && (
        <div className="bg-[#EFF6FF] border-b border-[#BFDBFE] px-4 py-2.5 text-center text-xs sm:text-sm font-medium text-[#1E3A8A] sticky top-16 z-40 flex items-center justify-center gap-2">
          <span>This article was updated.</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1 font-bold text-[#0047AB] hover:underline cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Refresh to see changes</span>
          </button>
        </div>
      )}

      {/* Mobile Sticky Mini-Bar (below navbar on <1024px) */}
      <div className="lg:hidden sticky top-16 z-30 bg-white/95 backdrop-blur-xs border-b border-[#E2E6EC] px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
          <span className="font-semibold text-slate-600 shrink-0">{progressPercent}%</span>
          <div className="w-24 sm:w-32 h-1 bg-slate-100 rounded-full overflow-hidden shrink-0">
            <div
              className="h-full bg-[#0047AB] transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-slate-400 truncate hidden sm:inline">{post.title}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-[#0047AB] font-bold text-xs border border-slate-200 transition-colors shrink-0"
        >
          <List size={13} />
          <span>Contents</span>
        </button>
      </div>

      {/* Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="w-full bg-white border-b border-[#E2E6EC] py-3 px-4 sm:px-6">
        <div className="max-w-[1360px] mx-auto flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#0047AB] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-[#0047AB] transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium truncate max-w-xs">{post.title}</span>
        </div>
      </nav>

      {/* Article Header Area */}
      <header className="w-full bg-white border-b border-[#E2E6EC] py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1540px] mx-auto">
          {post.coverImage ? (
            /* Two-column Header on >=1280px */
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="xl:col-span-7 space-y-4">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0047AB] hover:underline transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Back to all guides</span>
                </Link>

                {post.category && (
                  <div className="pt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E7EEF9] text-[#0047AB]">
                      {post.category}
                    </span>
                  </div>
                )}

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B0B0F] tracking-tight leading-tight">
                  {post.title}
                </h1>

                {post.summary && (
                  <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed">
                    {post.summary}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">By {post.author}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    {formatReadingTime(calculateReadingTime(post.content || '') || post.readingTimeMinutes || 1)}
                  </span>
                </div>
              </div>

              {/* Cover Image Column (16:9, fixed aspect ratio, lazy loaded) */}
              <div className="xl:col-span-5">
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-[#CBD5E1] shadow-xs bg-slate-100">
                  <img
                    src={post.coverImage}
                    alt={post.coverAlt || post.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Single Full-Width Header when NO cover image exists */
            <div className="max-w-4xl space-y-4">
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0047AB] hover:underline transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back to all guides</span>
              </Link>

              {post.category && (
                <div className="pt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E7EEF9] text-[#0047AB]">
                    {post.category}
                  </span>
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B0B0F] tracking-tight leading-tight">
                {post.title}
              </h1>

              {post.summary && (
                <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed">
                  {post.summary}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span className="font-semibold text-slate-700">By {post.author}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  {formatReadingTime(calculateReadingTime(post.content || '') || post.readingTimeMinutes || 1)}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Layout with 3 Columns on >=1280px, 2 on 1024-1279px, 1 on <1024px */}
      <main className="max-w-[1540px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row xl:flex-row gap-10 items-start justify-center">
        {/*
          DOM ORDER & SEO REQUIREMENT:
          Article body comes FIRST in DOM order so crawlers and screen readers read it first.
          Using flexbox `order` utility to place the Left rail visually first on desktop.
        */}

        {/* Center Column: Article Body (Measure ~720px for optimal readability) */}
        <article className="w-full max-w-[720px] flex-1 min-w-0 order-1 xl:order-2 space-y-8">
          {/* Mobile-Only Collapsible Table of Contents (<1024px) */}
          <div className="lg:hidden">
            <BlogToc
              articleRef={articleRef}
              collapsible={true}
              defaultOpen={false}
              className="w-full"
            />
          </div>

          {/* Mobile-Only Key Takeaways (if present and <1024px) */}
          {post.keyTakeaways && post.keyTakeaways.length > 0 && (
            <div className="lg:hidden p-5 bg-[#EFF6FF] rounded-2xl border border-[#BFDBFE] shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-[#0047AB]">
                <CheckCircle2 size={16} className="shrink-0" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                  Key Takeaways
                </h2>
              </div>
              <ul className="space-y-2 text-xs text-[#1E3A8A] leading-relaxed">
                {post.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0047AB] mt-1.5 shrink-0" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Article Markdown Pipeline */}
          <div ref={articleRef} className="overflow-x-auto min-w-0">
            <MarkdownRenderer
              content={post.content}
              keyTakeaways={(post as any).keyTakeaways}
            />
          </div>

          {/* Article FAQs */}
          {post.faqs && post.faqs.length > 0 && (
            <div className="mt-12 p-6 sm:p-7 bg-white rounded-3xl border border-[#E2E6EC] space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 text-[#0047AB] font-bold text-sm">
                <HelpCircle size={17} />
                <span>Frequently Asked Questions</span>
              </div>
              <div className="space-y-4 divide-y divide-slate-100">
                {post.faqs.map((f, idx) => (
                  <div key={idx} className={idx > 0 ? 'pt-4' : ''}>
                    <h3 className="font-bold text-base text-[#0B0B0F]">{f.question}</h3>
                    <p className="text-sm text-[#4B5563] mt-1.5 leading-relaxed">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources & Citations */}
          {post.sources && post.sources.length > 0 && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
              <span className="font-bold text-slate-700 block">References & Source Citations:</span>
              <ul className="space-y-1.5">
                {post.sources.map((src, idx) => (
                  <li key={idx}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0047AB] hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <span>{src.label}</span>
                      <ExternalLink size={12} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          {post.disclaimer && (
            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Shield size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{post.disclaimer}</span>
            </div>
          )}

          {/* Mobile-Only Share Row (<1024px) */}
          <div className="lg:hidden p-4 bg-white rounded-2xl border border-[#E2E6EC] flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Share this guide</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold"
              >
                {shareCopied ? (
                  <>
                    <Check size={12} className="text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(canonicalUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-bold"
              >
                X
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold"
              >
                <Share2 size={12} />
              </a>
            </div>
          </div>

          {/* Mobile-Only Author Card (<1024px) */}
          <div className="lg:hidden p-5 bg-white rounded-2xl border border-[#E2E6EC] space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Written by
            </span>
            <div className="flex items-center gap-3">
              {post.authorAvatar ? (
                <img
                  src={post.authorAvatar}
                  alt={post.author}
                  className="w-11 h-11 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#E7EEF9] text-[#0047AB] font-bold text-sm flex items-center justify-center border border-[#BFDBFE]">
                  {post.author.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-bold text-sm text-[#0B0B0F]">{post.author}</h3>
                <p className="text-xs text-slate-500">
                  {post.authorBio || post.authorRole || 'PolyLance Core Team'}
                </p>
              </div>
            </div>
          </div>

          {/* End-of-Article Author Box (All breakpoints) */}
          <div className="p-6 sm:p-7 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0047AB] block">
              Written by
            </span>
            <div className="flex items-start gap-4">
              {post.authorAvatar ? (
                <img
                  src={post.authorAvatar}
                  alt={post.author}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#E7EEF9] text-[#0047AB] font-bold text-base flex items-center justify-center shrink-0 border border-[#BFDBFE]">
                  {post.author.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="space-y-1">
                <h3 className="font-bold text-base text-[#0B0B0F]">{post.author}</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {post.authorBio ||
                    post.authorRole ||
                    'PolyLance core protocol contributor focusing on smart contract escrow, secure decentralized milestone payments, and on-chain freelance reputation.'}
                </p>
              </div>
            </div>
          </div>

          {/* Previous / Next Post Navigation Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            {prevPost ? (
              <Link
                to={`/blog/${prevPost.slug}`}
                className="group p-4 bg-white rounded-2xl border border-[#E2E6EC] hover:border-[#CBD5E1] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
              >
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-[#0047AB] transition-colors">
                  <ArrowLeft size={12} />
                  <span>Previous guide</span>
                </span>
                <span className="font-bold text-xs sm:text-sm text-[#0B0B0F] mt-2 line-clamp-2 leading-snug">
                  {prevPost.title}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {nextPost && (
              <Link
                to={`/blog/${nextPost.slug}`}
                className="group p-4 bg-white rounded-2xl border border-[#E2E6EC] hover:border-[#CBD5E1] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
              >
                <span className="inline-flex items-center justify-end gap-1 text-[11px] font-bold text-slate-400 group-hover:text-[#0047AB] transition-colors">
                  <span>Next guide</span>
                  <ArrowRight size={12} />
                </span>
                <span className="font-bold text-xs sm:text-sm text-[#0B0B0F] mt-2 line-clamp-2 leading-snug">
                  {nextPost.title}
                </span>
              </Link>
            )}
          </div>
        </article>

        {/*
          Left Rail (Desktop >=1280px):
          Sticky, width ~260px, Table of contents + compact progress & share card.
          Visually positioned on the left via `order-2 xl:order-1`.
        */}
        <aside
          aria-label="Table of contents"
          className="hidden xl:block w-[260px] shrink-0 order-2 xl:order-1 sticky top-[88px]"
        >
          {isWideDesktop && (
            <ArticleLeftRail
              articleRef={articleRef}
              slug={post.slug}
              title={post.title}
              readingTimeMinutes={post.readingTimeMinutes}
              readingProgress={readingProgress}
            />
          )}
        </aside>

        {/*
          Right Rail (Desktop >=1280px and Medium 1024-1279px):
          Width ~320px (or 280px on medium), author, takeaways, related, topics, CTA.
          Visually positioned on the right via `order-3`.
        */}
        <aside
          aria-label="Related content"
          className="hidden lg:block w-[280px] xl:w-[320px] shrink-0 order-3"
        >
          <ArticleRightRail
            post={post}
            relatedPosts={relatedPosts}
            includeToc={isMediumDesktop}
            articleRef={articleRef}
          />
        </aside>
      </main>

      {/* Full-Width "More Guides" Grid */}
      <section aria-label="More guides from PolyLance" className="w-full bg-white border-t border-[#E2E6EC] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1540px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0B0B0F]">
              More Guides & Tutorials
            </h2>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0047AB] hover:underline"
            >
              <span>View all guides</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-6 sm:gap-7 items-stretch">
            {moreGuides.map((item) => (
              <BlogCard key={item.slug} post={item} />
            ))}
          </div>

          {/* Final CTA Band */}
          <div className="mt-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#0047AB] to-[#0A3D8F] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-2 text-center sm:text-left max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold">
                <ShieldCheck size={14} />
                <span>POLYGON MAINNET ESCROW</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Start your first escrow-protected job today
              </h3>
              <p className="text-xs sm:text-sm text-blue-100">
                Non-custodial milestone contracts with automated settlement and transparent platform fees.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isConnected ? (
                <>
                  <Link
                    to="/jobs"
                    className="py-3 px-5 bg-white text-[#0047AB] font-bold text-xs sm:text-sm rounded-xl hover:bg-blue-50 transition-colors shadow-xs"
                  >
                    Find jobs
                  </Link>
                  <Link
                    to="/jobs/post"
                    className="py-3 px-5 bg-transparent text-white border-2 border-white font-bold text-xs sm:text-sm rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Post a job
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => connectWallet?.()}
                  className="py-3 px-6 bg-white text-[#0047AB] font-bold text-xs sm:text-sm rounded-xl hover:bg-blue-50 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Connect wallet to start</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Bottom Sheet TOC Drawer */}
      <ArticleMobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        articleRef={articleRef}
      />
    </div>
  );
};

export default BlogPostPage;
