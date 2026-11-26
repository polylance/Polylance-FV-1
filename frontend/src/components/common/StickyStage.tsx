import React from 'react';

export interface StickyStageProps {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
  reverseOnDesktop?: boolean;
}

/**
 * Pairs a scrolling column with a sticky preview stage so desktop detail never scrolls away.
 */
export const StickyStage: React.FC<StickyStageProps> = ({
  left,
  right,
  className = '',
  reverseOnDesktop = false,
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-start ${className}`}>
      <div className={`lg:col-span-5 min-w-0 ${reverseOnDesktop ? 'lg:order-2' : ''}`}>
        {left}
      </div>
      <div
        className={`lg:col-span-7 min-w-0 lg:sticky lg:top-24 lg:self-start ${
          reverseOnDesktop ? 'lg:order-1' : ''
        }`}
      >
        {right}
      </div>
    </div>
  );
};

export default StickyStage;
