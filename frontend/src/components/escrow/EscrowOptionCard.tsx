import React from 'react';
import { LucideIcon } from 'lucide-react';
import { MOTION } from '../../styles/motion';

export interface EscrowOptionCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  isActive: boolean;
  progress: number;
  onClick: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  cardIndex: number;
}

export const EscrowOptionCard = React.forwardRef<HTMLButtonElement, EscrowOptionCardProps>(
  (
    {
      id,
      title,
      description,
      icon: Icon,
      isActive,
      progress,
      onClick,
      onKeyDown,
      cardIndex,
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={`escrow-tab-${cardIndex}`}
        aria-controls={`escrow-video-${cardIndex}`}
        aria-selected={isActive}
        tabIndex={0}
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={`group relative w-full text-left p-4 rounded-[8px] border outline-none cursor-pointer overflow-hidden transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0F] ${
          isActive
            ? 'border-[#0047AB]/70 shadow-[0_0_0_1px_rgba(0,71,171,0.5),0_8px_32px_rgba(0,71,171,0.25)]'
            : 'border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-white/20'
        }`}
        style={{
          background: isActive
            ? 'linear-gradient(90deg, rgba(0, 71, 171, 0.14) 0%, rgba(0, 71, 171, 0) 100%)'
            : undefined,
          transition: `transform ${MOTION.duration.standard}ms ${MOTION.ease.brand}, opacity ${MOTION.duration.standard}ms ${MOTION.ease.brand}, box-shadow ${MOTION.duration.standard}ms ${MOTION.ease.brand}, border-color ${MOTION.duration.standard}ms ${MOTION.ease.brand}`,
        }}
      >
        {/* ── 3px Cobalt Accent Bar on left edge (slides/fades in when active) ── */}
        <span
          className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[#0047AB] transition-all duration-300 pointer-events-none ${
            isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'
          }`}
          style={{
            transition: `opacity ${MOTION.duration.standard}ms ${MOTION.ease.brand}, transform ${MOTION.duration.standard}ms ${MOTION.ease.brand}`,
          }}
          aria-hidden="true"
        />

        <div className="flex items-start gap-3.5 relative z-10">
          {/* ── 36px Rounded Icon Tile ── */}
          <div
            className={`w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 transition-all duration-300 ${
              isActive
                ? 'bg-[#0047AB] text-white shadow-xs'
                : 'bg-white/10 text-white/80 group-hover:bg-white/15 group-hover:text-white'
            }`}
          >
            <Icon size={20} className="shrink-0" />
          </div>

          <div className="space-y-0.5 min-w-0 flex-1">
            <div
              className={`text-sm font-semibold transition-colors duration-300 ${
                isActive ? 'text-white' : 'text-white/90 group-hover:text-white'
              }`}
            >
              {title}
            </div>
            <div
              className={`text-xs transition-opacity duration-300 ${
                isActive ? 'text-gray-200 opacity-100' : 'text-gray-300 opacity-75 group-hover:opacity-90'
              }`}
            >
              {description}
            </div>
          </div>
        </div>

        {/* ── Thin Bottom Progress Line (tracks video currentTime / duration via scaleX) ── */}
        {isActive && (
          <span
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0047AB] origin-left pointer-events-none"
            style={{
              transform: `scaleX(${progress})`,
              transition: 'transform 80ms linear',
            }}
            aria-hidden="true"
          />
        )}
      </button>
    );
  }
);

EscrowOptionCard.displayName = 'EscrowOptionCard';
