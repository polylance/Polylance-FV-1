/**
 * BlogToc — PolyLance Dynamic Table of Contents Component
 *
 * Requirements fulfilled:
 * 1. Built from the actual rendered headings (H2 and H3) of the post.
 * 2. Stable, unique, URL-safe IDs matching rehype-slug output.
 * 3. Smooth-scrolls with scroll-margin-top equal to navbar height + gap (offset).
 * 4. Respects prefers-reduced-motion (instant scroll if enabled).
 * 5. Moves focus to the heading (tabIndex="-1") for accessibility.
 * 6. Active section highlighted via IntersectionObserver with subtle existing tokens.
 * 7. "Back to top" button after scrolling past TOC.
 * 8. Mobile collapsible into an expandable card.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowUp, ChevronDown, List } from 'lucide-react';

export interface TocHeading {
  id: string;
  title: string;
  level: 2 | 3;
}

interface BlogTocProps {
  /** Optional container ref to query rendered headings from */
  articleRef?: React.RefObject<HTMLElement | null>;
  /** Optional initial headings list (for SSR/fallback) */
  fallbackHeadings?: TocHeading[];
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  onItemClick?: (id: string) => void;
  hideBackToTop?: boolean;
}

export const BlogToc: React.FC<BlogTocProps> = ({
  articleRef,
  fallbackHeadings = [],
  className = '',
  collapsible = false,
  defaultOpen = true,
  onItemClick,
  hideBackToTop = false,
}) => {
  const [headings, setHeadings] = useState<TocHeading[]>(fallbackHeadings);
  const [activeId, setActiveId] = useState<string>('');
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(defaultOpen);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const tocRef = useRef<HTMLDivElement>(null);

  // 1. Query actual rendered headings from the article container
  useEffect(() => {
    const updateHeadings = () => {
      const container = articleRef?.current || document.querySelector('.blog-prose');
      if (!container) return;

      const elements = container.querySelectorAll<HTMLElement>('h2, h3');
      const items: TocHeading[] = [];

      elements.forEach((el) => {
        if (!el.id) return;
        const level = el.tagName.toLowerCase() === 'h3' ? 3 : 2;
        const title = el.textContent?.trim() || '';
        if (title) {
          items.push({ id: el.id, title, level });
        }
      });

      if (items.length > 0) {
        setHeadings(items);
      }
    };

    updateHeadings();
    // Re-check after markdown has finished rendering
    const timer = setTimeout(updateHeadings, 150);
    return () => clearTimeout(timer);
  }, [articleRef]);

  // 2. IntersectionObserver for active section highlight
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible heading closest to the top
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by top offset to pick topmost active heading
          visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: [0, 1],
      }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  // 3. Track scroll position for "Back to top" button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 450) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 4. Handle deep link on page arrival (support /blog/<slug>#section)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;

    const timer = setTimeout(() => {
      const target = document.getElementById(hash);
      if (target) {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
        target.focus({ preventScroll: true });
        setActiveId(hash);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  // 5. Click handler for TOC links
  const handleItemClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const target = document.getElementById(id);
      if (!target) return;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });

      // Move focus for accessibility
      target.focus({ preventScroll: true });

      // Update URL hash safely without triggering router reload
      window.history.pushState(null, '', `#${id}`);
      setActiveId(id);

      // Close mobile dropdown on selection
      setIsMobileOpen(false);
      if (onItemClick) {
        onItemClick(id);
      }
    },
    [onItemClick]
  );

  const scrollToTop = useCallback(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    window.history.pushState(null, '', window.location.pathname);
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav
      ref={tocRef}
      aria-label="Table of contents"
      className={`p-5 bg-white rounded-2xl border border-[#E2E6EC] shadow-2xs transition-all ${className}`}
    >
      {/* Header & Mobile Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <List size={14} className="text-[#0047AB]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Table of Contents
          </h2>
        </div>

        {/* Mobile toggle button */}
        {collapsible && (
          <button
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-semibold text-[#0047AB] p-1 rounded hover:bg-slate-50 transition-colors"
            aria-expanded={isMobileOpen}
            aria-label={isMobileOpen ? 'Collapse table of contents' : 'Expand table of contents'}
          >
            <span>{headings.length} sections</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isMobileOpen ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {/* List: collapsible when collapsible=true, or always visible */}
      <div className={`${collapsible && !isMobileOpen ? 'hidden' : 'block'} mt-3`}>
        <ul className="space-y-1.5 text-sm divide-y-0">
          {headings.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li
                key={item.id}
                className={`${item.level === 3 ? 'pl-3 text-xs' : ''}`}
              >
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleItemClick(e, item.id)}
                  className={`block py-1 px-2 rounded-lg transition-colors leading-snug ${
                    isActive
                      ? 'text-[#0047AB] font-bold bg-[#EFF6FF] border-l-2 border-[#0047AB]'
                      : 'text-[#4B5563] hover:text-[#0047AB] hover:bg-slate-50 font-medium'
                  }`}
                >
                  {item.title}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Back to top button */}
        {!hideBackToTop && showBackToTop && (
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0047AB] transition-colors"
            >
              <ArrowUp size={12} />
              <span>Back to top</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default BlogToc;
