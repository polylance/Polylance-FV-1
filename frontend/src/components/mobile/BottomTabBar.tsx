import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Grid, MessageSquare, MoreHorizontal, User, Award, Settings, Shield, Vote, Landmark, HelpCircle, X } from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import { useDemoMode } from '../../context/DemoModeContext';
import { Sheet } from '../overlay/Sheet';

export const BottomTabBar: React.FC = () => {
  const location = useLocation();
  const { isConnected, address, currentRole } = useWeb3();
  const { isDemoMode } = useDemoMode();
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  // Show bottom tab bar on dApp routes when user is connected or in demo mode
  const dAppRoutes = [
    '/dashboard',
    '/jobs',
    '/workspace',
    '/profile',
    '/chat',
    '/reputation',
    '/dao',
    '/judge',
    '/treasury',
    '/settings',
    '/analytics',
    '/help',
    '/demo',
  ];

  const isDAppRoute = dAppRoutes.some((route) => location.pathname.startsWith(route));

  // Only display if on a dApp route and on mobile/tablet (hidden on lg: 1024px+)
  if (!isDAppRoute || (!isConnected && !isDemoMode)) {
    return null;
  }

  const primaryTabs = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/workspace', label: 'Workspace', icon: Grid },
    { to: '/chat', label: 'Messages', icon: MessageSquare },
  ];

  const profilePath = address ? `/profile/${address}` : '/profile';

  const moreLinks = [
    { to: profilePath, label: 'Profile', icon: User },
    { to: '/reputation', label: 'Reputation & Leaderboard', icon: Award },
    { to: '/settings', label: 'Settings', icon: Settings },
    ...(currentRole === 'judge' || currentRole === 'admin'
      ? [{ to: '/judge', label: 'Judge Panel', icon: Shield }]
      : []),
    { to: '/dao', label: 'Governance & DAO', icon: Vote },
    ...(currentRole === 'admin'
      ? [{ to: '/treasury', label: 'Treasury Management', icon: Landmark }]
      : []),
    { to: '/help', label: 'Help & Tutorials', icon: HelpCircle },
  ];

  const isMoreActive = moreLinks.some((l) => location.pathname.startsWith(l.to));

  return (
    <>
      <nav
        role="navigation"
        aria-label="Mobile Navigation Bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] border-t border-[#E5E7EB] pb-safe lg:hidden"
      >
        <div className="flex items-center justify-around px-2 h-14 max-w-md mx-auto">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname.startsWith(tab.to);

            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors relative select-none ${
                  isActive ? 'text-[#0047AB]' : 'text-[#6B7280] hover:text-[#0B0B0F]'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-[1px] w-6 h-[2px] bg-[#0047AB]" />
                )}
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span className={`text-[10px] leading-tight ${isActive ? 'font-semibold' : 'font-normal'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* 5th Tab: More */}
          <button
            type="button"
            onClick={() => setIsMoreSheetOpen(true)}
            aria-expanded={isMoreSheetOpen}
            className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors relative select-none cursor-pointer ${
              isMoreActive ? 'text-[#0047AB]' : 'text-[#6B7280] hover:text-[#0B0B0F]'
            }`}
          >
            {isMoreActive && (
              <span className="absolute -top-[1px] w-6 h-[2px] bg-[#0047AB]" />
            )}
            <MoreHorizontal size={18} strokeWidth={isMoreActive ? 2 : 1.5} />
            <span className={`text-[10px] leading-tight ${isMoreActive ? 'font-semibold' : 'font-normal'}`}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* More Bottom Sheet */}
      <Sheet
        isOpen={isMoreSheetOpen}
        onClose={() => setIsMoreSheetOpen(false)}
        title="Navigation & Tools"
        side="bottom"
      >
        <div data-lenis-prevent="true" className="overflow-y-auto overscroll-contain max-h-[60vh] min-h-0 px-1 py-1 divide-y divide-[#E5E7EB] custom-scrollbar">
          {moreLinks.map((item) => {
            const Icon = item.icon;
            const isSelected = location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMoreSheetOpen(false)}
                className={`flex items-center gap-3.5 py-3 px-3 text-sm transition-colors rounded-lg ${
                  isSelected
                    ? 'text-[#0047AB] font-semibold bg-[#EFF6FF]'
                    : 'text-[#0B0B0F] hover:bg-[#F6F7F9]'
                }`}
              >
                <Icon size={18} className={isSelected ? 'text-[#0047AB]' : 'text-[#6B7280]'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </Sheet>
    </>
  );
};

export default BottomTabBar;
