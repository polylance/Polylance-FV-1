import React, { useState } from 'react';
import { ArrowUp, Check, Copy, Share2 } from 'lucide-react';
import { BlogToc } from './BlogToc';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface ArticleLeftRailProps {
  articleRef: React.RefObject<HTMLElement | null>;
  slug: string;
  title: string;
  readingTimeMinutes: number;
  readingProgress: number;
  className?: string;
}

export const ArticleLeftRail: React.FC<ArticleLeftRailProps> = ({
  articleRef,
  slug,
  title,
  readingTimeMinutes,
  readingProgress,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const prefersReduced = useReducedMotion();
  const canonicalUrl = `https://polylance.codes/blog/${slug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    window.history.pushState(null, '', window.location.pathname);
  };

  const percent = Math.min(100, Math.max(0, Math.round(readingProgress)));
  const minutesLeft = Math.max(1, Math.round(readingTimeMinutes * (1 - percent / 100)));

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(canonicalUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    canonicalUrl
  )}`;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table of Contents Card */}
      <BlogToc
        articleRef={articleRef}
        collapsible={false}
        hideBackToTop={true}
        className="w-full"
      />

      {/* Reading Progress, Share & Navigation Card */}
      <div className="p-4 bg-white rounded-2xl border border-[#E2E6EC] shadow-2xs space-y-4 text-xs">
        {/* Progress header & meter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-600 font-semibold">
            <span>{percent}% read</span>
            <span className="text-slate-400 font-normal">~{minutesLeft} min left</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Article reading progress"
            className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-[#0047AB] rounded-full transition-all duration-150 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Share Actions */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Share Guide
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy canonical link"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-600 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} className="text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on X"
              aria-label="Share on X (opens in new tab)"
              className="py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 transition-colors inline-flex items-center justify-center hover:text-[#0047AB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
            >
              <span className="font-bold">X</span>
            </a>

            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on LinkedIn"
              aria-label="Share on LinkedIn (opens in new tab)"
              className="py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 transition-colors inline-flex items-center justify-center hover:text-[#0047AB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
            >
              <Share2 size={13} />
            </a>
          </div>
        </div>

        {/* Back to top button */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleScrollToTop}
            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-slate-600 hover:text-[#0047AB] font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
          >
            <ArrowUp size={13} />
            <span>Back to top</span>
          </button>
        </div>
      </div>
    </div>
  );
};
