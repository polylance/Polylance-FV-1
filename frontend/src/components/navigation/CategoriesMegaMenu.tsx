import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { getCategories } from '../../utils/taxonomy';
import { Category } from '../../types/taxonomy';
import { useReducedMotion } from '../../media/useDataSaver';

interface CategoriesMegaMenuProps {
  onClose?: () => void;
}

/**
 * Elevated Categories MegaMenu: Cobalt/Electric Blue/Slate styling with non-clipping pinned footer.
 */
export const CategoriesMegaMenu: React.FC<CategoriesMegaMenuProps> = ({ onClose }) => {
  const categories = getCategories();
  const [activeCategory, setActiveCategory] = useState<Category>(categories[0]);
  const [isOpen, setIsOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
        onClose?.();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSelectSubcategory = (catSlug: string, subSlug: string) => {
    setIsOpen(false);
    onClose?.();
    navigate(`/categories/${catSlug}?sub=${subSlug}`);
  };

  const handleSelectCategory = (catSlug: string) => {
    setIsOpen(false);
    onClose?.();
    navigate(`/categories/${catSlug}`);
  };

  return (
    <div className="relative h-16 sm:h-[72px] flex items-center shrink-0" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        id="categories-megamenu-trigger"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-3 rounded-[10px] flex items-center gap-1.5 text-[14px] cursor-pointer transition-colors duration-[140ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A52B8] focus-visible:ring-offset-2 ${
          isOpen
            ? 'bg-[#EFF6FF] text-[#0A52B8] font-semibold'
            : 'text-[#475569] hover:text-[#0A0D14] hover:bg-[#F8FAFC] font-medium'
        }`}
      >
        <span>Categories</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-[140ms] ${isOpen ? 'rotate-180 text-[#0A52B8]' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="region"
            aria-label="Category Directory"
            initial={reducedMotion ? undefined : { opacity: 0, scale: 0.98, transform: 'translate3d(0, -6px, 0)' }}
            animate={reducedMotion ? undefined : { opacity: 1, scale: 1, transform: 'translate3d(0, 0px, 0)' }}
            exit={reducedMotion ? undefined : { opacity: 0, scale: 0.98, transform: 'translate3d(0, -6px, 0)' }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="fixed sm:absolute top-[74px] sm:top-[calc(100%+6px)] left-4 right-4 sm:left-auto sm:right-0 sm:w-[640px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-slate-200/80 shadow-[0_20px_50px_rgba(10,82,184,0.12)] z-50 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {/* Left Column: Category Names */}
              <div
                data-lenis-prevent="true"
                className="sm:col-span-5 p-2.5 bg-[#F8FAFC] max-h-[400px] overflow-y-auto space-y-0.5 custom-scrollbar"
              >
                {categories.map((cat) => {
                  const isSelected = activeCategory.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onMouseEnter={() => setActiveCategory(cat)}
                      onFocus={() => setActiveCategory(cat)}
                      onClick={() => handleSelectCategory(cat.slug)}
                      className={`w-full text-left px-3 py-2 rounded-[8px] text-[13.5px] transition-colors duration-[120ms] cursor-pointer truncate ${
                        isSelected
                          ? 'bg-[#EFF6FF] text-[#0A52B8] font-semibold'
                          : 'text-[#0F172A] hover:bg-white font-medium'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Scrollable Subcategories + Pinned Non-Clipping Footer */}
              <div className="sm:col-span-7 bg-white flex flex-col max-h-[400px]">
                <div
                  data-lenis-prevent="true"
                  className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 custom-scrollbar"
                >
                  <div className="text-[14px] font-bold text-[#0A0D14] pb-2 border-b border-slate-100">
                    {activeCategory.name}
                  </div>
                  <ul className="space-y-1">
                    {activeCategory.subcategories.map((sub) => (
                      <li key={sub.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectSubcategory(activeCategory.slug, sub.slug)}
                          className="w-full text-left px-2.5 py-2 rounded-[8px] text-[13.5px] text-[#475569] hover:text-[#0A52B8] hover:bg-[#EFF6FF]/60 font-medium flex items-center justify-between gap-2 transition-colors duration-[120ms] cursor-pointer"
                        >
                          <span className="leading-snug">{sub.name}</span>
                          <ArrowRight size={13} className="shrink-0 opacity-60" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="py-3 px-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 text-[13px] shrink-0">
                  <Link
                    to={`/categories/${activeCategory.slug}`}
                    onClick={() => {
                      setIsOpen(false);
                      onClose?.();
                    }}
                    className="font-semibold text-[#0A52B8] hover:text-[#2563EB] hover:underline truncate"
                  >
                    Open {activeCategory.name}
                  </Link>
                  <Link
                    to="/categories"
                    onClick={() => {
                      setIsOpen(false);
                      onClose?.();
                    }}
                    className="text-[#64748B] hover:text-[#0A0D14] font-medium shrink-0 whitespace-nowrap"
                  >
                    All categories
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoriesMegaMenu;
