import React, { useState } from 'react';
import { Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { PublicActivityEvent } from '../../hooks/usePublicStats';
import { POLYGONSCAN_BASE_URL } from '../../seo/site.config';
import { useReducedMotion } from '../../media/useDataSaver';

import { isTestActivityEvent } from '../../config/testDataFilter';

interface ActivityTickerProps {
  events?: PublicActivityEvent[];
}

export const ActivityTicker: React.FC<ActivityTickerProps> = ({ events = [] }) => {
  const reducedMotion = useReducedMotion();
  const [isPaused, setIsPaused] = useState(false);

  // Filter out any test/mock events
  const realEvents = (events || []).filter((e) => !isTestActivityEvent(e));

  if (realEvents.length === 0) {
    return null;
  }

  // Duplicate for seamless continuous ticker loop if animated
  const displayEvents = reducedMotion ? realEvents.slice(0, 4) : [...realEvents, ...realEvents];

  return (
    <div
      className="w-full bg-[#EAF1FB]/50 border-y border-[#D0DEF2] py-2.5 overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-label="Live platform activity ticker"
    >
      <div className="w-full max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 flex items-center gap-3">
        {/* Ticker Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-white border border-[#D0DEF2] text-[11px] font-bold text-[#0047AB] uppercase tracking-wider shrink-0 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0047AB] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0047AB]" />
          </span>
          <span>Live Activity</span>
        </div>

        {/* Ticker Track */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className={`flex items-center gap-6 whitespace-nowrap ${
              reducedMotion ? 'flex-wrap' : 'animate-ticker'
            }`}
            style={{
              animationPlayState: isPaused ? 'paused' : 'running',
              animationDuration: `${Math.max(25, events.length * 6)}s`,
            }}
          >
            {displayEvents.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="inline-flex items-center gap-2 text-xs text-[#374151]"
              >
                <ShieldCheck size={13} className="text-[#0047AB] shrink-0" />
                <span className="font-semibold text-[#0B0B0F]">{item.title}</span>
                <span className="text-[#9CA3AF]">•</span>
                <span className="text-[11px] text-[#6B7280]">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {item.txHash && (
                  <a
                    href={`${POLYGONSCAN_BASE_URL}/tx/${item.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0047AB] hover:underline inline-flex items-center gap-0.5 text-[11px]"
                    aria-label={`View transaction ${item.txHash} on Polygonscan`}
                  >
                    <span>Tx</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
