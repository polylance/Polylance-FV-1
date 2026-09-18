import React, { useState, useId } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface AccordionItem {
  id?: string;
  title: React.ReactNode;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultExpandedIndex?: number;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultExpandedIndex,
  className = '',
}) => {
  const baseId = useId();
  const prefersReducedMotion = useReducedMotion();
  const [expandedIndices, setExpandedIndices] = useState<number[]>(() => {
    return defaultExpandedIndex !== undefined ? [defaultExpandedIndex] : [];
  });

  const toggle = (idx: number) => {
    setExpandedIndices((prev) => {
      if (prev.includes(idx)) {
        return prev.filter((i) => i !== idx);
      }
      return allowMultiple ? [...prev, idx] : [idx];
    });
  };

  return (
    <div className={`divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden bg-white ${className}`}>
      {items.map((item, idx) => {
        const isExpanded = expandedIndices.includes(idx);
        const headerId = `${baseId}-header-${idx}`;
        const contentId = `${baseId}-content-${idx}`;

        return (
          <div key={item.id || idx} className="group">
            <h3>
              <button
                type="button"
                id={headerId}
                aria-expanded={isExpanded}
                aria-controls={contentId}
                onClick={() => toggle(idx)}
                className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-left font-medium text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
              >
                <span className="flex items-center gap-3 pr-2 text-sm sm:text-base font-semibold">
                  {item.icon && <span className="shrink-0 text-blue-600">{item.icon}</span>}
                  {item.title}
                </span>
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: prefersReducedMotion ? 0.05 : 0.2 }}
                  className="shrink-0 text-slate-400 group-hover:text-slate-600"
                  aria-hidden="true"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.span>
              </button>
            </h3>

            {/* CSS Grid Animation for zero layout jank */}
            <div
              id={contentId}
              role="region"
              aria-labelledby={headerId}
              className={`grid transition-[grid-template-rows] duration-250 ease-out ${
                isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 pt-1 text-sm text-slate-600 leading-relaxed">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
