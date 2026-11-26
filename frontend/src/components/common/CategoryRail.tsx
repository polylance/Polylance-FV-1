import React from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../../utils/taxonomy';

export interface CategoryRailProps {
  activeSlug?: string;
  className?: string;
}

/**
 * Persistent horizontal category rail below header on marketplace/category surfaces.
 */
export const CategoryRail: React.FC<CategoryRailProps> = ({
  activeSlug,
  className = '',
}) => {
  const categories = getCategories();

  return (
    <nav
      aria-label="Browse categories"
      className={`w-full bg-white border-b border-[#E2E5EA] ${className}`}
    >
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
        <Link
          to="/categories"
          className={`shrink-0 px-3 py-1.5 rounded-[8px] text-[14px] font-medium whitespace-nowrap transition-colors duration-[120ms] ${
            !activeSlug
              ? 'bg-[#EFF6FF] text-[#0A52B8] font-semibold border border-[#BFDBFE]'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          All categories
        </Link>

        {categories.map((cat) => {
          const isActive = activeSlug === cat.slug;
          return (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className={`shrink-0 px-3 py-1.5 rounded-[8px] text-[14px] font-medium whitespace-nowrap transition-colors duration-[120ms] ${
                isActive
                  ? 'bg-[#EFF6FF] text-[#0A52B8] font-semibold border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default CategoryRail;
