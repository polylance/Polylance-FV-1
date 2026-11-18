import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Tag, ShieldCheck, ArrowRight, ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import { BlogPostData } from '../../seo/types';
import { useWeb3 } from '../../context/Web3Context';

interface BlogListingSidebarProps {
  categories: Array<{ name: string; count: number }>;
  tags: string[];
  latestPosts: BlogPostData[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  className?: string;
}

export const BlogListingSidebar: React.FC<BlogListingSidebarProps> = ({
  categories,
  tags,
  latestPosts,
  selectedCategory,
  onSelectCategory,
  className = '',
}) => {
  const { isConnected, connectWallet } = useWeb3();
  const [showAllTags, setShowAllTags] = useState<boolean>(false);
  const group2Ref = useRef<HTMLDivElement | null>(null);
  const [canStick, setCanStick] = useState<boolean>(true);

  // Group 2 sticky fit detection (ResizeObserver + viewport check)
  useEffect(() => {
    const el = group2Ref.current;
    if (!el) return;

    const checkFit = () => {
      // Navbar height (64px) + 48px padding clearance = 112px
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

  const visibleTags = showAllTags ? tags.slice(0, 20) : tags.slice(0, 8);
  const hasMoreTags = tags.length > 8;

  return (
    <aside
      aria-label="Blog Topics and Latest Guides"
      className={`space-y-6 ${className}`}
    >
      {/* ── GROUP 1: Normal Flow Information Cards (Not Sticky) ── */}
      <div className="space-y-6">
        {/* Browse Topics & Categories */}
        <div className="p-5 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Tag size={13} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Browse Topics
            </h2>
          </div>

          <div className="space-y-1">
            {categories.map((c) => {
              const isActive = selectedCategory.toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onSelectCategory(c.name)}
                  className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#0047AB] font-bold border-l-2 border-[#0047AB]'
                      : 'text-slate-600 hover:text-[#0047AB] hover:bg-slate-50'
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="text-[11px] text-slate-400">({c.count})</span>
                </button>
              );
            })}
          </div>

          {/* Popular Tags (Max 8 chips initially, expands in place with Show More) */}
          {tags.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Popular Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {visibleTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onSelectCategory(t)}
                    className="inline-block text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-[#EFF6FF] text-slate-600 hover:text-[#0047AB] border border-slate-200 hover:border-[#BFDBFE] transition-colors font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
                  >
                    {t}
                  </button>
                ))}
              </div>

              {hasMoreTags && (
                <button
                  type="button"
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0047AB] hover:underline pt-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
                >
                  <span>{showAllTags ? 'Show fewer tags' : `Show ${tags.length - 8} more tags`}</span>
                  {showAllTags ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── GROUP 2: Compact Stack (Sticky top = 88px ONLY if it fits viewport) ── */}
      <div
        ref={group2Ref}
        className={`space-y-6 ${canStick ? 'sticky top-[88px]' : ''}`}
      >
        {/* Latest Guides (Limited strictly to 4 items) */}
        <div className="p-5 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock size={13} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Latest Guides
            </h2>
          </div>

          <div className="space-y-3">
            {latestPosts.slice(0, 4).map((lp) => (
              <Link
                key={lp.slug}
                to={`/blog/${lp.slug}`}
                className="group block p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
              >
                <h3 className="text-xs font-bold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors line-clamp-2 leading-snug">
                  {lp.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 tabular-nums whitespace-nowrap">
                  <span>
                    {new Date(lp.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span>{lp.readingTimeMinutes} min read</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Call-to-Action Card: WCAG AA Compliant High Contrast */}
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
    </aside>
  );
};

export default BlogListingSidebar;
