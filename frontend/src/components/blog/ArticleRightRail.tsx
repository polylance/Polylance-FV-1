import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Calendar, ArrowRight, ShieldCheck, Tag, Wallet } from 'lucide-react';
import { BlogPostData } from '../../seo/types';
import { BlogToc } from './BlogToc';
import { useWeb3 } from '../../context/Web3Context';

interface ArticleRightRailProps {
  post: BlogPostData;
  relatedPosts: BlogPostData[];
  includeToc?: boolean;
  articleRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

export const ArticleRightRail: React.FC<ArticleRightRailProps> = ({
  post,
  relatedPosts,
  includeToc = false,
  articleRef,
  className = '',
}) => {
  const { isConnected, connectWallet } = useWeb3();
  const group2Ref = useRef<HTMLDivElement | null>(null);
  const [canStick, setCanStick] = useState<boolean>(true);

  // Group 2 sticky fit detection (ResizeObserver + viewport check)
  useEffect(() => {
    const el = group2Ref.current;
    if (!el) return;

    const checkFit = () => {
      // Navbar height (64px) + 48px clearance = 112px
      const availableHeight = window.innerHeight - 112;
      setCanStick(el.offsetHeight <= availableHeight);
    };

    checkFit();
    const observer = new ResizeObserver(checkFit);
    observer.observe(el);
    window.addEventListener('resize', checkFit);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkFit);
    };
  }, []);

  const hasTakeaways = Boolean(post.keyTakeaways && post.keyTakeaways.length > 0);

  // Filter related posts: NEVER include current post, max 3 items
  const cleanRelatedPosts = useMemo(() => {
    return (relatedPosts || [])
      .filter((r) => r.slug !== post.slug)
      .slice(0, 3);
  }, [relatedPosts, post.slug]);

  // Topics: Merge category and tags, de-duplicate case-insensitively, max 8 chips
  const deduplicatedTopics = useMemo(() => {
    const map = new Map<string, { label: string; param: 'category' | 'tag' }>();
    if (post.category) {
      map.set(post.category.toLowerCase().trim(), {
        label: post.category.trim(),
        param: 'category',
      });
    }
    if (Array.isArray(post.tags)) {
      post.tags.forEach((t) => {
        const key = t.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, { label: t.trim(), param: 'tag' });
        }
      });
    }
    return Array.from(map.values()).slice(0, 8);
  }, [post.category, post.tags]);

  // Author role & bio: omit role line if role equals name or is empty
  const roleDisplay = useMemo(() => {
    if (post.authorBio && post.authorBio.trim() && post.authorBio.trim() !== post.author.trim()) {
      return post.authorBio;
    }
    if (post.authorRole && post.authorRole.trim() && post.authorRole.trim().toLowerCase() !== post.author.trim().toLowerCase()) {
      return post.authorRole;
    }
    return null;
  }, [post.author, post.authorRole, post.authorBio]);

  // Check if dates differ
  const hasDistinctUpdateDate = Boolean(
    post.updatedAt &&
      post.publishedAt &&
      new Date(post.updatedAt).toDateString() !== new Date(post.publishedAt).toDateString()
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ── GROUP 1: Main Information Cards (Normal Flow) ── */}
      <div className="space-y-6">
        {/* Table of contents on medium screens (1024-1279px) */}
        {includeToc && (
          <BlogToc
            articleRef={articleRef}
            collapsible={false}
            className="w-full"
          />
        )}

        {/* 1. Author Card */}
        <div className="p-5 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            About the Author
          </span>
          <div className="flex items-start gap-3">
            {post.authorAvatar ? (
              <img
                src={post.authorAvatar}
                alt={post.author}
                className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#E7EEF9] text-[#0047AB] font-bold text-sm flex items-center justify-center shrink-0 border border-[#BFDBFE]">
                {post.author
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
            )}
            <div className="space-y-1 min-w-0 flex-1">
              <h3 className="font-bold text-sm text-[#0B0B0F] truncate" title={post.author}>
                {post.author}
              </h3>
              {roleDisplay && (
                <p className="text-xs text-slate-500 leading-snug">
                  {roleDisplay}
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-[11px] text-slate-500 tabular-nums">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Calendar size={12} className="text-slate-400 shrink-0" />
              <span>
                Published{' '}
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            {hasDistinctUpdateDate && (
              <div className="flex items-center gap-1.5 text-slate-600 whitespace-nowrap">
                <Clock size={12} className="text-slate-400 shrink-0" />
                <span>
                  Updated{' '}
                  {new Date(post.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Key Takeaways Card (Normal flow, only if data exists) */}
        {hasTakeaways && (
          <div className="p-5 bg-[#EFF6FF] rounded-3xl border border-[#BFDBFE] shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-[#0047AB]">
              <CheckCircle2 size={16} className="shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                Key Takeaways
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-[#1E3A8A] leading-relaxed">
              {post.keyTakeaways!.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0047AB] mt-1.5 shrink-0" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Topics (De-duplicated case-insensitively, max 8) */}
        {deduplicatedTopics.length > 0 && (
          <div className="p-5 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Tag size={12} />
              <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500">
                Topics
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {deduplicatedTopics.map((item, idx) => (
                <Link
                  key={idx}
                  to={`/blog?${item.param}=${encodeURIComponent(item.label)}`}
                  className="inline-flex items-center text-xs px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-[#EFF6FF] text-slate-700 hover:text-[#0047AB] border border-slate-200 hover:border-[#BFDBFE] transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── GROUP 2: Compact Stack (Sticky top = 88px ONLY if it fits viewport) ── */}
      <div
        ref={group2Ref}
        className={`space-y-6 ${canStick ? 'sticky top-[88px]' : ''}`}
      >
        {/* 4. Related Guides — Consistent 64px square thumbnail + title (3-line clamp) + read time */}
        {cleanRelatedPosts.length > 0 && (
          <div className="p-5 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Related Guides
            </span>
            <div className="space-y-3">
              {cleanRelatedPosts.map((rel) => (
                <Link
                  key={rel.slug}
                  to={`/blog/${rel.slug}`}
                  className="group block p-2 rounded-2xl hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
                >
                  <div className="flex items-start gap-3">
                    {/* Consistent 64px square thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                      {rel.coverImage ? (
                        <img
                          src={rel.coverImage}
                          alt={rel.coverAlt || rel.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#EFF6FF] to-slate-100 text-[#0047AB] font-bold text-xs">
                          {rel.category ? rel.category.slice(0, 3).toUpperCase() : 'GUIDE'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors line-clamp-3 leading-snug [text-wrap:balance]">
                        {rel.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 tabular-nums whitespace-nowrap">
                        <Clock size={10} className="shrink-0" />
                        <span>{rel.readingTimeMinutes} min read</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 5. Call-to-Action Card: WCAG AA Compliant High Contrast */}
        <div className="p-6 bg-gradient-to-b from-[#0047AB] to-[#0A3D8F] text-white rounded-3xl shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
            <ShieldCheck size={22} />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-base text-white leading-snug tracking-tight">
              Start your first escrow-protected job
            </h3>
            <p className="text-xs text-blue-100 leading-relaxed font-normal">
              Non-custodial milestone contracts with verified settlement on Polygon.
            </p>
          </div>

          <div className="pt-2">
            {isConnected ? (
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/jobs"
                  className="text-center py-2.5 px-3 bg-white text-[#0047AB] font-bold text-xs rounded-xl hover:bg-blue-50 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Find jobs
                </Link>
                <Link
                  to="/jobs/post"
                  className="text-center py-2.5 px-3 bg-transparent text-white border-2 border-white font-bold text-xs rounded-xl hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Post a job
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => connectWallet?.()}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-white text-[#0047AB] font-extrabold text-xs rounded-xl hover:bg-blue-50 transition-all shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Wallet size={15} />
                <span>Connect wallet</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleRightRail;
