import React from 'react';

export type TagTone = 'neutral' | 'cobalt' | 'yellow' | 'orange' | 'red' | 'green';

export interface TagProps {
  children: React.ReactNode;
  tone?: TagTone;
  className?: string;
}

const TONE_MAP: Record<TagTone, string> = {
  neutral: 'bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0]',
  cobalt: 'bg-[#EFF6FF] text-[#0A52B8] border-[#BFDBFE]',
  yellow: 'bg-[#EFF6FF] text-[#0A52B8] border-[#93C5FD]',
  orange: 'bg-[#0A52B8] text-white border-[#0A52B8]',
  red: 'bg-[#0F172A] text-white border-[#0F172A]',
  green: 'bg-[#EFF6FF] text-[#0A52B8] border-[#BFDBFE]',
};

/**
 * Text-only Tag component (zero leading icon dots or chrome clutter).
 */
export const Tag: React.FC<TagProps> = ({
  children,
  tone = 'neutral',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-[6px] border text-[12px] font-semibold leading-normal whitespace-nowrap ${TONE_MAP[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Tag;
