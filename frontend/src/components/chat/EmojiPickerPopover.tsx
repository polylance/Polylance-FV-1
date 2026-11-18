import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { popoverVariants, reducedMotionVariants } from '../../styles/popupMotion';
import {
  CHAT_EMOJI_CATEGORIES,
  QUICK_REACTIONS,
  ALL_CHAT_EMOJIS,
} from '../../config/emojis';

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  align?: 'left' | 'right';
}

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
  align = 'right',
}) => {
  const [activeCategoryId, setActiveCategoryId] = useState<string>('reactions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const emojiGridRef = useRef<HTMLDivElement>(null);
  const categoryTabsRef = useRef<HTMLDivElement>(null);
  const quickBarRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset scroll position when category changes
  useEffect(() => {
    if (emojiGridRef.current) {
      emojiGridRef.current.scrollTop = 0;
    }
  }, [activeCategoryId]);

  // Horizontal wheel scroll helper for horizontal containers (Quick Bar & Category Tabs)
  const handleHorizontalWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.stopPropagation();
      e.currentTarget.scrollLeft += e.deltaY;
    }
  }, []);

  // Category scroll arrow helpers
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryTabsRef.current) {
      const scrollAmount = direction === 'left' ? -120 : 120;
      categoryTabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const prefersReducedMotion = useReducedMotion();

  const currentCategory = CHAT_EMOJI_CATEGORIES.find((c) => c.id === activeCategoryId) || CHAT_EMOJI_CATEGORIES[0];

  // Filtered emojis if searching
  const isSearching = searchQuery.trim().length > 0;
  const cleanQuery = searchQuery.trim().toLowerCase();
  const displayedEmojis = isSearching
    ? ALL_CHAT_EMOJIS.filter((e) => e.includes(cleanQuery))
    : currentCategory.emojis;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          data-lenis-prevent="true"
          variants={prefersReducedMotion ? reducedMotionVariants : popoverVariants}
          initial="closed"
          animate="open"
          exit="closed"
          className={`absolute bottom-full ${
            align === 'right' ? 'right-0' : 'left-0'
          } mb-2.5 z-50 w-76 sm:w-84 bg-white/98 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl flex flex-col font-sans select-none overflow-hidden`}
          style={{
            height: '400px',
            maxHeight: 'calc(100vh - 140px)',
            transformOrigin: align === 'right' ? 'bottom right' : 'bottom left',
          }}
        >
      {/* 1. Header & Title */}
      <div className="px-3 py-2 bg-slate-50/95 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Sparkles size={13} className="text-[#0047AB]" />
          <span>Chat Emojis</span>
          <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded-full">
            {ALL_CHAT_EMOJIS.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-5 h-5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          title="Close (Esc)"
        >
          <X size={13} />
        </button>
      </div>

      {/* 2. Quick Reactions Bar (ABOVE) with horizontal scroll and mouse wheel conversion */}
      <div className="px-2.5 py-1.5 bg-slate-50/70 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider px-0.5 mb-1">
          <span>Quick Reactions</span>
          <span className="text-[9px] text-slate-400 lowercase">scroll ↔</span>
        </div>
        <div
          ref={quickBarRef}
          onWheel={handleHorizontalWheel}
          className="flex items-center gap-1 overflow-x-auto py-0.5 px-0.5 no-scrollbar overscroll-contain scroll-smooth"
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelectEmoji(emoji);
                onClose();
              }}
              className="text-lg p-1 hover:bg-blue-50 hover:scale-125 rounded-lg transition-transform cursor-pointer shrink-0"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Category Tabs (ABOVE) with horizontal wheel scroll & optional arrows */}
      <div className="relative flex items-center bg-slate-100/80 border-b border-slate-200/60 px-1 py-1 shrink-0">
        <button
          type="button"
          onClick={() => scrollCategories('left')}
          className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
          title="Scroll categories left"
          aria-label="Scroll categories left"
        >
          <ChevronLeft size={13} />
        </button>

        <div
          ref={categoryTabsRef}
          onWheel={handleHorizontalWheel}
          className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar overscroll-contain scroll-smooth py-0.5 px-1"
        >
          {CHAT_EMOJI_CATEGORIES.map((cat) => {
            const isActive = cat.id === activeCategoryId && !isSearching;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategoryId(cat.id);
                  setSearchQuery('');
                }}
                title={cat.name}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  isActive
                    ? 'bg-white text-[#0047AB] shadow-xs border border-slate-200/90 font-bold scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="hidden sm:inline text-[11px] whitespace-nowrap">{cat.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollCategories('right')}
          className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
          title="Scroll categories right"
          aria-label="Scroll categories right"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* 4. Search Filter Input */}
      <div className="px-2.5 py-1.5 bg-white border-b border-slate-100 flex items-center gap-1.5 shrink-0">
        <Search size={13} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search 350+ emojis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="p-0.5 text-slate-400 hover:text-slate-600 rounded-sm cursor-pointer"
            title="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* 5. Emoji Scrollable Options Grid with Sleek Custom Scrollbar */}
      <div
        ref={emojiGridRef}
        data-lenis-prevent="true"
        className="p-2.5 overflow-y-auto overscroll-contain flex-1 min-h-0 custom-scrollbar scroll-smooth"
      >
        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1 pb-1.5 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <span>{isSearching ? `Search Results (${displayedEmojis.length})` : currentCategory.name}</span>
          <span>{displayedEmojis.length} emojis</span>
        </div>

        {displayedEmojis.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            No matching emojis found
          </div>
        ) : (
          <div className="grid grid-cols-7 sm:grid-cols-8 gap-1 pt-0.5">
            {displayedEmojis.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                type="button"
                onClick={() => {
                  onSelectEmoji(emoji);
                  onClose();
                }}
                className="text-xl p-1.5 rounded-lg hover:bg-blue-50 hover:scale-125 active:scale-95 transition-all text-center cursor-pointer flex items-center justify-center"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6. Bottom Helper Status Bar */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[9.5px] font-mono text-slate-400 shrink-0">
        <span>Click to insert into chat</span>
        <span>Scroll for 350+ emojis</span>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
