import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Grid, MessageSquare, User } from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';

interface TabItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
}

export const BottomTabBar: React.FC = () => {
  const location = useLocation();
  const { isConnected, address } = useWeb3();

  // Show bottom tab bar on authenticated dApp routes when user is connected
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
  ];

  const isDAppRoute = dAppRoutes.some((route) => location.pathname.startsWith(route));

  // Only display if on a dApp route and on mobile/tablet (hidden on lg: 1024px+)
  if (!isDAppRoute || !isConnected) {
    return null;
  }

  const profilePath = address ? `/profile/${address}` : '/profile';

  const tabs: TabItem[] = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/workspace', label: 'Workspace', icon: Grid },
    { to: '/chat', label: 'Messages', icon: MessageSquare },
    { to: profilePath, label: 'Profile', icon: User },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe lg:hidden"
    >
      <div className="flex items-center justify-around px-2 h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.exact
            ? location.pathname === tab.to
            : location.pathname.startsWith(tab.to);

          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 transition-colors relative select-none ${
                isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600 active:text-blue-500'
              }`}
            >
              {/* Active top glow indicator */}
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
              )}
              <Icon size={20} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
              <span className={`text-[11px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
