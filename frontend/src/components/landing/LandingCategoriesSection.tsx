import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCategories } from '../../utils/taxonomy';
import { Category } from '../../types/taxonomy';
import { Job, UserProfile } from '../../types';
import { isJobInDomain, isJobListed, DomainId } from '../../utils/domainMapping';
import { isRealPublicJob, sanitizeText } from '../../config/testDataFilter';

export interface LandingCategoriesSectionProps {
  jobs?: Job[];
  profiles?: Record<string, UserProfile>;
  isLoading?: boolean;
  extraCategories?: Category[];
}

const MASONRY_ASPECTS: Array<'aspect-[4/5]' | 'aspect-[16/11]' | 'aspect-square'> = [
  'aspect-[4/5]',
  'aspect-[16/11]',
  'aspect-square',
  'aspect-[4/5]',
  'aspect-[16/11]',
  'aspect-square',
  'aspect-[4/5]',
];

interface SubcategoryCardData {
  id: string;
  slug: string;
  title: string;
  skillsHint: string;
  image: string;
  aspect: 'aspect-[4/5]' | 'aspect-[16/11]' | 'aspect-square';
}

interface SubcategoryTiltCardProps {
  card: SubcategoryCardData;
  categorySlug: string;
  index: number;
  openCount: number;
}

const HAS_INTERSECTION_OBSERVER = typeof IntersectionObserver !== 'undefined';

const SubcategoryTiltCard: React.FC<SubcategoryTiltCardProps> = ({
  card,
  categorySlug,
  index,
  openCount,
}) => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const springConfig = { stiffness: 280, damping: 24, mass: 0.5 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), springConfig);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-4, 4]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      {...(HAS_INTERSECTION_OBSERVER
        ? {
            whileInView: { opacity: 1, y: 0, scale: 1 },
            viewport: { once: true, amount: 0.12 },
          }
        : {
            animate: { opacity: 1, y: 0, scale: 1 },
          })}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.42,
        delay: Math.min(index, 7) * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="break-inside-avoid mb-6"
      style={{ perspective: 900 }}
    >
      <Link
        to={`/categories/${categorySlug}?sub=${encodeURIComponent(card.slug)}`}
        className="block group cursor-pointer"
      >
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          className={`rounded-2xl overflow-hidden bg-[#EEF2F6] border border-slate-200/70 relative shadow-2xs group-hover:shadow-md transition-shadow duration-300 ${card.aspect}`}
        >
          <img
            src={card.image}
            alt={card.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          />

          {/* Subtle Diagonal Glass Sheen Sweep on Hover */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-[120%] group-hover:translate-x-[120%] transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12"
          />

          {/* Hover-Only Frosted White Corner Pill */}
          <div className="translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm text-xs font-semibold text-[#0F172A] inline-flex items-center gap-1.5">
            <span>Explore</span>
            <ArrowRight size={12} className="text-[#0A52B8]" />
            {openCount > 0 && (
              <span className="font-mono text-[11px] text-[#0A52B8] ml-0.5 tabular-nums">
                · {openCount} open
              </span>
            )}
          </div>
        </motion.div>

        <div className="mt-3 space-y-0.5">
          <h3 className="text-[15px] font-semibold text-[#0F172A] group-hover:text-[#0A52B8] transition-colors leading-snug">
            {card.title}
          </h3>
          {card.skillsHint && (
            <p className="text-xs text-slate-500 truncate">{card.skillsHint}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

function doesJobMatchCategory(job: Job, category: Category, allCategories: Category[]): boolean {
  if (!isRealPublicJob(job) || !isJobListed(job)) return false;

  const jobCat = (job.category || '').toLowerCase().trim();
  const jobCatId = ((job as any).categoryId || '').toLowerCase().trim();
  const slugLower = category.slug.toLowerCase();
  const idLower = category.id.toLowerCase();
  const nameLower = category.name.toLowerCase();

  if (jobCatId === idLower || jobCat === slugLower || jobCat === nameLower) {
    return true;
  }

  for (const sub of category.subcategories) {
    if (
      jobCat === sub.slug.toLowerCase() ||
      jobCat === sub.name.toLowerCase() ||
      jobCatId === sub.id.toLowerCase()
    ) {
      return true;
    }
  }

  const mapped = isJobInDomain(job, category.slug as DomainId);
  if (mapped) {
    const exactOther = allCategories.some(
      (c) =>
        c.id !== category.id &&
        (jobCat === c.slug.toLowerCase() ||
          jobCat === c.name.toLowerCase() ||
          jobCatId === c.id.toLowerCase())
    );
    return !exactOther;
  }

  return false;
}

export const LandingCategoriesSection: React.FC<LandingCategoriesSectionProps> = ({
  jobs = [],
  extraCategories = [],
}) => {
  const categories = useMemo(() => {
    const base = getCategories();
    if (!extraCategories.length) return base;
    const seen = new Set(base.map((c) => c.slug));
    return [...base, ...extraCategories.filter((c) => !seen.has(c.slug))];
  }, [extraCategories]);

  const [activeSlug, setActiveSlug] = useState<string>(categories[0]?.slug || 'development-it');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const pillScrollRef = useRef<HTMLDivElement>(null);

  const updateScrollButtons = () => {
    const el = pillScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 12);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 12);
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [categories]);

  const categoryStats = useMemo(() => {
    const map: Record<string, { openJobs: Job[]; count: number }> = {};
    for (const cat of categories) {
      const openJobs = jobs.filter((j) => doesJobMatchCategory(j, cat, categories));
      map[cat.slug] = { openJobs, count: openJobs.length };
    }
    return map;
  }, [categories, jobs]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === activeSlug) || categories[0],
    [categories, activeSlug]
  );

  const selectCategory = (slug: string) => {
    setActiveSlug(slug);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('category', slug);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleScrollBy = (delta: number) => {
    pillScrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  if (!activeCategory) return null;

  const activeStats = categoryStats[activeCategory.slug] || { openJobs: [], count: 0 };
  const latestOpenJob = activeStats.openJobs[0];

  const cards: SubcategoryCardData[] = activeCategory.subcategories.map((sub, idx) => ({
    id: sub.id,
    slug: sub.slug,
    title: sub.name,
    skillsHint: sub.skills.slice(0, 3).join(' · '),
    image: `/images/subcategories/${sub.slug}.webp`,
    aspect: MASONRY_ASPECTS[idx % MASONRY_ASPECTS.length],
  }));

  return (
    <section
      id="categories"
      aria-label="Categories explorer"
      className="relative z-0 w-full bg-white py-16 sm:py-24 scroll-mt-28 border-b border-slate-200/70"
    >
      <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-10 text-left">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[#0A52B8]">
              Explore Disciplines
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Browse work across Web3, AI &amp; product craft.
            </h2>
          </div>

          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0A52B8] hover:text-[#084298] hover:underline shrink-0"
          >
            <span>All categories</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Horizontal Scrollable Category Pill Bar with Left & Right Scroll Buttons + Fade Masks */}
        <div className="relative mt-7">
          {canScrollLeft && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-20 flex items-center pr-12 bg-gradient-to-r from-white via-white/95 to-transparent">
              <button
                type="button"
                onClick={() => handleScrollBy(-260)}
                aria-label="Scroll categories left"
                className="pointer-events-auto w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-[#0F172A] hover:border-[#0A52B8] hover:text-[#0A52B8] transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}

          <div
            ref={pillScrollRef}
            role="tablist"
            aria-label="Work categories"
            onScroll={updateScrollButtons}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1 py-1"
          >
            {categories.map((cat) => {
              const isSelected = cat.slug === activeCategory.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  data-cat-slug={cat.slug}
                  onClick={() => selectCategory(cat.slug)}
                  className={`relative z-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'text-white'
                      : 'bg-slate-50 border border-slate-200/90 text-slate-700 hover:border-slate-300 hover:text-[#0F172A]'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="activeCategoryPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-[#0F172A] z-0"
                    />
                  )}
                  <span className="relative z-10">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-20 flex items-center pl-12 bg-gradient-to-l from-white via-white/95 to-transparent">
              <button
                type="button"
                onClick={() => handleScrollBy(260)}
                aria-label="Scroll categories right"
                className="pointer-events-auto w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-[#0F172A] hover:border-[#0A52B8] hover:text-[#0A52B8] transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Live Open Job Strip (Rendered ONLY when real count > 0) */}
        {activeStats.count > 0 && (
          <div className="mt-5 px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-[#0F172A] tabular-nums">
              {activeStats.count} open {activeStats.count === 1 ? 'job' : 'jobs'} in {activeCategory.name}
            </span>
            {latestOpenJob && (
              <Link
                to={`/jobs/${latestOpenJob.id}`}
                className="text-[#0A52B8] font-medium hover:underline truncate max-w-md"
              >
                Latest: {sanitizeText(latestOpenJob.title)}
              </Link>
            )}
          </div>
        )}

        {/* Staggered 4-Column Visual Masonry Grid — Cursor 3D Tilt, Sheen Sweep & Reveal */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory.slug}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 columns-1 sm:columns-2 lg:columns-4 gap-6"
          >
            {cards.map((card, idx) => (
              <SubcategoryTiltCard
                key={card.id}
                card={card}
                categorySlug={activeCategory.slug}
                index={idx}
                openCount={activeStats.count}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default LandingCategoriesSection;
