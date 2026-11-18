import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  size = 'md',
}) => {
  return (
    <div className={`border-b border-[#E5E7EB] flex items-center gap-6 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 relative whitespace-nowrap transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:ring-offset-2 ${
              size === 'sm' ? 'py-2.5' : 'py-3.5'
            } ${
              isActive
                ? 'text-[#0047AB] font-semibold'
                : 'text-[#4B5563] hover:text-[#0B0B0F]'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-[8px] font-medium ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#0047AB]'
                    : 'bg-[#F6F7F9] text-[#4B5563]'
                }`}
              >
                {tab.badge}
              </span>
            )}
            {/* Flat 2px cobalt active underline */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0047AB]" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export interface SegmentedControlOption {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className = '',
  size = 'md'
}) => {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-1 bg-[#F6F7F9] border border-[#E5E7EB] rounded-xl gap-1 ${className}`}
    >
      {options.map((option) => {
        const isSelected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.id)}
            className={`flex items-center gap-1.5 font-medium transition-all duration-150 cursor-pointer select-none ${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
            } rounded-lg ${
              isSelected
                ? 'bg-white text-[#0B0B0F] border border-[#D1D5DB] shadow-2xs font-semibold'
                : 'text-[#4B5563] hover:text-[#0B0B0F]'
            }`}
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-[#F6F7F9] text-[#0B0B0F]' : 'bg-[#E5E7EB] text-[#6B7280]'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
