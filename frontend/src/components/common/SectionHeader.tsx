import React from 'react';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Shared left-aligned section header constrained to the 720px / 62ch reading measure.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col lg:flex-row lg:items-end justify-between gap-6 ${className}`}>
      <div className="max-w-[720px] space-y-2.5 text-left">
        {eyebrow && <div className="text-eyebrow">{eyebrow}</div>}
        <h2 className="text-landing-h2 text-[#0B0B0C]">{title}</h2>
        {description && <p className="text-lead">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export default SectionHeader;
