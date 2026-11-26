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
    <div
      role="tablist"
      className={`border-b border-[#E2E5EA] flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar max-w-full min-w-0 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 relative whitespace-nowrap shrink-0 transition-colors duration-[120ms] text-[14px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:ring-offset-2 ${
              size === 'sm' ? 'py-2.5' : 'py-3.5'
            } ${
              isActive
                ? 'text-[#0B0B0C] font-semibold'
                : 'text-[#4B5563] hover:text-[#0B0B0C]'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[12px] px-2 py-0.5 rounded-[6px] font-semibold tabular-amount ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#0A52B8]'
                    : 'bg-[#F8FAFC] text-[#64748B]'
                }`}
              >
                {tab.badge}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A52B8]" />
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
  size = 'md',
}) => {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-1 bg-[#F5F6F8] border border-[#E2E5EA] rounded-[10px] gap-1 ${className}`}
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
            className={`inline-flex items-center justify-center gap-1.5 rounded-[8px] font-semibold transition-colors duration-[120ms] whitespace-nowrap cursor-pointer ${
              size === 'sm' ? 'px-3 py-1.5 text-[14px]' : 'px-4 py-2 text-[14px]'
            } ${
              isSelected
                ? 'bg-[#0A52B8] text-white border border-[#0A52B8]'
                : 'text-[#64748B] hover:text-[#0F172A] border border-transparent'
            }`}
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span className="text-[12px] font-semibold opacity-80 tabular-amount">
                ({option.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
