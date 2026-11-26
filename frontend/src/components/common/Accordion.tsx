import React, { useState, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { useReducedMotion } from '../../media/useDataSaver';

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

/**
 * Hairline Editorial Accordion (1px #E2E5EA border, CSS grid-template-rows expand, 240ms ease).
 */
export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultExpandedIndex,
  className = '',
}) => {
  const baseId = useId();
  const reducedMotion = useReducedMotion();
  const [expandedIndices, setExpandedIndices] = useState<number[]>(() =>
    defaultExpandedIndex !== undefined ? [defaultExpandedIndex] : []
  );

  const toggle = (idx: number) => {
    setExpandedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : allowMultiple ? [...prev, idx] : [idx]
    );
  };

  return (
    <div
      className={`divide-y divide-[#E2E5EA] border border-[#E2E5EA] rounded-[10px] overflow-hidden bg-white ${className}`}
    >
      {items.map((item, idx) => {
        const isExpanded = expandedIndices.includes(idx);
        const headerId = `${baseId}-header-${idx}`;
        const contentId = `${baseId}-content-${idx}`;

        return (
          <div key={item.id || idx}>
            <h3>
              <button
                type="button"
                id={headerId}
                aria-expanded={isExpanded}
                aria-controls={contentId}
                onClick={() => toggle(idx)}
                className="w-full min-h-[48px] px-4 py-3.5 flex items-center justify-between text-left font-medium text-[#0B0B0C] hover:bg-[#F5F6F8] transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:outline-none"
              >
                <span className="flex items-center gap-3 pr-3 text-[15px] font-semibold">
                  {item.icon && <span className="shrink-0 text-[#0047AB]">{item.icon}</span>}
                  <span>{item.title}</span>
                </span>
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className={`shrink-0 text-[#4B5563] ${
                    reducedMotion ? '' : 'transition-transform duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
                  } ${isExpanded ? 'rotate-180 text-[#0B0B0C]' : ''}`}
                />
              </button>
            </h3>

            <div
              id={contentId}
              role="region"
              aria-labelledby={headerId}
              className="pl-accordion-content"
              data-open={isExpanded ? 'true' : 'false'}
            >
              <div className="pl-accordion-inner">
                <div className="px-4 pb-4 pt-1 text-[14px] text-[#4B5563] leading-relaxed">
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

export default Accordion;
