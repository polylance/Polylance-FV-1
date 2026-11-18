import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DisclosureProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  badge?: React.ReactNode;
}

export const Disclosure: React.FC<DisclosureProps> = ({
  title,
  subtitle,
  children,
  defaultOpen = false,
  className = '',
  badge,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-[#E5E7EB] rounded-[12px] bg-white overflow-hidden transition-all duration-150 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#F6F7F9] transition-colors duration-150 min-h-[44px] cursor-pointer"
      >
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-semibold text-[#0B0B0F] tracking-tight truncate">{title}</span>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <span className="text-[11px] text-[#6B7280] truncate mt-0.5">{subtitle}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-[#6B7280] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#0047AB]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-4 py-3.5 border-t border-[#E5E7EB] bg-[#FAFAFA] text-xs text-[#4B5563] space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default Disclosure;
