import React, { useState } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
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

  const realEvents = (events || []).filter(
    (e) => !isTestActivityEvent(e) && Boolean(e?.title?.trim())
  );

  if (realEvents.length === 0) {
    return (
      <div
        className="w-full h-[41px] bg-white border-b border-[#E5E7EB] flex items-center"
        aria-label="Live platform activity status"
      >
        <div className="w-full max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[10.5px] font-mono font-bold text-[#0047AB] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B7A55]" />
            <span>Polygon Mainnet Synced</span>
          </div>
          <span className="font-mono text-[11px] text-[#6B7280] truncate">
            Real-time smart contract event feed active
          </span>
        </div>
      </div>
    );
  }

  const displayEvents = reducedMotion ? realEvents.slice(0, 4) : [...realEvents, ...realEvents];

  return (
    <div
      className="w-full h-[41px] bg-white border-b border-[#E5E7EB] flex items-center overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-label="Live platform activity ticker"
    >
      <div className="w-full max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#EAF1FB] border border-[#C9DAF2] text-[10.5px] font-mono font-bold text-[#0047AB] uppercase tracking-wider shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            {!reducedMotion && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0047AB] opacity-75" />
            )}
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0047AB]" />
          </span>
          <span>Mainnet Feed</span>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div
            className={`flex items-center gap-6 whitespace-nowrap ${
              reducedMotion ? 'flex-wrap' : 'animate-ticker'
            }`}
            style={{
              animationPlayState: isPaused ? 'paused' : 'running',
              animationDuration: `${Math.max(25, realEvents.length * 6)}s`,
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
                <span className="text-[11px] font-mono text-[#6B7280]">
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
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
