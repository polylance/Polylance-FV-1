import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Globe, Server, Smartphone, ArrowRight, RotateCcw } from 'lucide-react';
import { DomainConfig } from '../../utils/domainMapping';
import { CategoryVideo } from './CategoryVideo';
import { MOTION } from '../../styles/motion';
import { useReducedMotion } from '../../media/useDataSaver';

export interface CategoryCardProps {
  domain: DomainConfig;
  count: number;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  staggerIndex?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  domain,
  count,
  isLoading = false,
  isError = false,
  onRetry,
  staggerIndex = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking a nested link/button (like skill or post-job), let child handler execute
    const target = e.target as HTMLElement;
    if (target.closest('[data-nested-action]')) return;

    if (count > 0) {
      navigate(`/jobs?domain=${domain.id}`);
    } else {
      navigate(`/jobs/post?domain=${domain.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (count > 0) {
        navigate(`/jobs?domain=${domain.id}`);
      } else {
        navigate(`/jobs/post?domain=${domain.id}`);
      }
    }
  };

  const handleSkillClick = (skill: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/jobs?domain=${domain.id}&skill=${encodeURIComponent(skill)}`);
  };

  const handlePostJobClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/jobs/post?domain=${domain.id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className="p-3 bg-white rounded-[18px] border border-[#E5E7EB] flex flex-col justify-between group h-full outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:ring-offset-2 focus-visible:ring-offset-white cursor-pointer select-none active:scale-[0.99]"
      style={{
        transform: !reducedMotion && isHovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow:
          !reducedMotion && isHovered
            ? '0 1px 3px rgba(11, 11, 15, 0.04), 0 16px 36px -4px rgba(0, 71, 171, 0.14)'
            : '0 1px 2px rgba(11, 11, 15, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)',
        borderColor: isHovered ? 'rgba(0, 47, 171, 0.35)' : '#E5E7EB',
        transition: reducedMotion
          ? 'border-color 150ms ease-out'
          : `transform 300ms ${MOTION.ease.brand}, box-shadow 300ms ${MOTION.ease.brand}, border-color 300ms ${MOTION.ease.brand}`,
      }}
      aria-label={`${domain.label} - ${domain.eyebrow}. ${count > 0 ? `${count} open jobs` : 'No open jobs yet'}`}
    >
      {/* ── 1. Hero Clean Video (16:10, 14px radius, 0.8x playback, 300ms stagger) ── */}
      <CategoryVideo
        categoryId={domain.id}
        openJobsCount={count}
        isCardHovered={isHovered}
        staggerIndex={staggerIndex}
      />

      {/* ── 2. Card Body Layout (Consistent 12-16px vertical rhythm) ── */}
      <div className="px-2 pt-4 pb-2 flex-1 flex flex-col gap-3">
        {/* Row 1: Role Eyebrow + Icon Tile (36px, #F6F7F9, cobalt icon) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center text-[#0047AB] shrink-0 transition-all duration-300"
            style={{
              borderColor: isHovered ? 'rgba(0, 47, 171, 0.3)' : '#E5E7EB',
              boxShadow: !reducedMotion && isHovered ? '0 0 12px rgba(0, 71, 171, 0.18)' : 'none',
            }}
          >
            {domain.id === 'web3' && <Code2 size={18} />}
            {domain.id === 'frontend' && <Globe size={18} />}
            {domain.id === 'backend' && <Server size={18} />}
            {domain.id === 'mobile' && <Smartphone size={18} />}
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0047AB] whitespace-nowrap truncate leading-none">
            {domain.eyebrow}
          </span>
        </div>

        {/* Row 2: Title (22px semibold, ink, letter-spacing -0.01em) */}
        <h3 className="text-[22px] font-semibold text-[#0B0B0F] leading-[1.25] tracking-[-0.01em] group-hover:text-[#0047AB] transition-colors">
          {domain.label}
        </h3>

        {/* Row 3: Job Line (15px, #374151) */}
        <p className="text-[15px] leading-[1.5] text-[#374151] font-normal">
          {domain.jobLine}
        </p>

        {/* Row 4: Tech Description (13px, #6B7280) */}
        <p className="text-[13px] text-[#6B7280] leading-snug line-clamp-2">
          {domain.description}
        </p>

        {/* Row 5: Skill Tags (12px chips, clickable -> /jobs?domain=<id>&skill=<tag>) */}
        <div className="flex flex-wrap gap-2 pt-0.5">
          {domain.skills.slice(0, 2).map((skill) => (
            <button
              key={skill}
              type="button"
              data-nested-action="true"
              onClick={(e) => handleSkillClick(skill, e)}
              className="text-[12px] font-medium px-2.5 py-1 rounded-[6px] bg-[#F6F7F9] text-[#4B5563] border border-[#E5E7EB] hover:bg-[#EFF6FF] hover:text-[#0047AB] hover:border-[#BFDBFE] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#0047AB]"
              title={`View ${skill} jobs in ${domain.label}`}
            >
              {skill}
            </button>
          ))}
        </div>

        {/* Row 6: Divider 1px #E5E7EB, then Footer Row (Pinned to bottom via mt-auto) */}
        <div className="mt-auto pt-3.5 border-t border-[#E5E7EB] flex items-center justify-between text-xs min-h-[32px]">
          {isLoading ? (
            /* Skeleton shimmer loader */
            <div className="w-full flex items-center justify-between animate-pulse">
              <span className="h-4 w-24 bg-[#E5E7EB] rounded-full" />
              <span className="h-4 w-4 bg-[#E5E7EB] rounded-full" />
            </div>
          ) : isError ? (
            /* Error state with retry */
            <div className="w-full flex items-center justify-between text-[#DC2626]">
              <span>Couldn't load jobs</span>
              <button
                type="button"
                data-nested-action="true"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry?.();
                }}
                className="hover:underline flex items-center gap-1 font-medium"
              >
                <RotateCcw size={12} />
                <span>Retry</span>
              </button>
            </div>
          ) : count > 0 ? (
            /* Count > 0 with live pulsing green dot and animated count */
            <>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
                </span>
                <span
                  key={`count-${count}`}
                  className="font-medium text-[#0B0B0F] animate-in fade-in slide-in-from-bottom-1 duration-200"
                >
                  {count} open {count === 1 ? 'job' : 'jobs'}
                </span>
              </div>
              <ArrowRight
                size={14}
                className="text-[#0047AB]"
                style={{
                  transform: !reducedMotion && isHovered ? 'translateX(4px)' : 'translateX(0)',
                  transition: `transform 300ms ${MOTION.ease.brand}`,
                }}
              />
            </>
          ) : (
            /* Count = 0 with neutral grey dot + Post the first job link */
            <>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#9CA3AF]" />
                <span className="text-[#6B7280]">No open jobs yet</span>
              </div>
              <button
                type="button"
                data-nested-action="true"
                onClick={handlePostJobClick}
                className="text-[#0047AB] font-medium group-hover:underline flex items-center gap-1"
              >
                <span>Post the first job</span>
                <span>&rarr;</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;
