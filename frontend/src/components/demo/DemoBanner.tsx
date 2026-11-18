import React from 'react';
import { useDemoMode } from '../../context/DemoModeContext';
import { useNavigate } from 'react-router-dom';
import { Play, RotateCcw, X, Wallet, Sparkles, User, Briefcase } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { isDemoMode, exitDemoMode, demoRole, setDemoRole, restartTour, isTourActive } = useDemoMode();
  const navigate = useNavigate();

  if (!isDemoMode) return null;

  return (
    <div
      role="region"
      aria-label="Demo mode indicator"
      className="w-full bg-[#F6F7F9] border-b border-[#E5E7EB] px-3 sm:px-4 py-2 sm:py-2.5 text-[#0B0B0F] text-xs font-sans sticky top-0 z-[60] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
        {/* Left: Indicator & Description */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-start text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-[#0047AB] text-white font-mono text-[11px] font-semibold uppercase tracking-wider">
            <Sparkles size={11} className="text-white" />
            Sample Demo
          </span>
          <span className="text-[#0B0B0F] font-medium text-xs">
            You're viewing a demo with sample data. No wallet needed.
          </span>
        </div>

        {/* Center: Role Switcher (Hire vs Work) */}
        <div className="flex items-center gap-2 bg-[#FFFFFF] p-1 rounded-[8px] border border-[#E5E7EB] shrink-0">
          <span className="text-[11px] text-[#4B5563] px-1.5 font-medium hidden sm:inline">Viewing as:</span>
          <button
            type="button"
            onClick={() => setDemoRole('client')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
              demoRole === 'client'
                ? 'bg-[#0047AB] text-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-[#4B5563] hover:text-[#0B0B0F] hover:bg-[#F6F7F9]'
            }`}
            aria-pressed={demoRole === 'client'}
          >
            <Briefcase size={12} />
            <span>Client (Hire)</span>
          </button>
          <button
            type="button"
            onClick={() => setDemoRole('freelancer')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
              demoRole === 'freelancer'
                ? 'bg-[#0047AB] text-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-[#4B5563] hover:text-[#0B0B0F] hover:bg-[#F6F7F9]'
            }`}
            aria-pressed={demoRole === 'freelancer'}
          >
            <User size={12} />
            <span>Freelancer (Work)</span>
          </button>
        </div>

        {/* Right: Actions (Restart Tour, Connect Wallet, Exit Demo) */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-center md:justify-end">
          <button
            type="button"
            onClick={restartTour}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-white hover:bg-[#F6F7F9] text-[#0B0B0F] border border-[#E5E7EB] text-xs font-medium transition-colors cursor-pointer"
            title="Restart the step-by-step product tour"
          >
            <RotateCcw size={12} className="text-[#0047AB]" />
            <span>{isTourActive ? 'Tour active' : 'Restart tour'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              exitDemoMode();
              navigate('/login');
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#0047AB] hover:bg-[#003884] text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Wallet size={12} />
            <span>Connect wallet</span>
          </button>

          <button
            type="button"
            onClick={exitDemoMode}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[8px] hover:bg-[#E5E7EB] text-[#4B5563] hover:text-[#0B0B0F] text-xs font-medium transition-colors cursor-pointer"
            title="Exit demo and return to normal mode"
          >
            <X size={13} />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
