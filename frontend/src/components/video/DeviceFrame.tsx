import React from 'react';

export interface DeviceFrameProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

/**
 * Minimal neutral device frame.
 * 1px border (#E5E7EB), 12px radius, thin top bar with three neutral dots.
 * Strictly no gradients, shadows, or decorative styling.
 */
export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  children,
  className = '',
  title = 'PolyLance Web3 Application',
}) => {
  return (
    <div
      className={`w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] overflow-hidden ${className}`}
      aria-label={title}
    >
      {/* Top browser/device bar */}
      <div className="h-7 bg-[#F6F7F9] border-b border-[#E5E7EB] px-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D1D5DB]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#D1D5DB]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#D1D5DB]" />
        </div>
        <div className="text-[11px] font-mono text-[#6B7280] truncate max-w-[200px] sm:max-w-xs">
          polylance.codes
        </div>
        <div className="w-8" />
      </div>

      {/* Frame content */}
      <div className="w-full relative bg-[#F6F7F9]">
        {children}
      </div>
    </div>
  );
};
