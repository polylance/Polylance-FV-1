import React from 'react';
import { JobEvent } from '../types';
import { CheckCircle2, Circle, ExternalLink, Clock } from 'lucide-react';
import { formatTimeAgo, getPolygonScanUrl, truncateAddress } from '../utils/formatters';

interface EscrowTimelineProps {
  events?: JobEvent[];
}

export const EscrowTimeline: React.FC<EscrowTimelineProps> = ({ events }) => {
  const safeEvents: JobEvent[] = Array.isArray(events) && events.length > 0 ? events : [
    { step: 'Posted', title: 'Job Posted to PolyLance', status: 'completed', timestamp: Date.now() - 3600000, actor: 'Client' },
    { step: 'Funded', title: 'Smart Contract Escrow Funded', status: 'current', timestamp: Date.now(), actor: 'Client' },
    { step: 'Work In Progress', title: 'Development & Milestones', status: 'upcoming', timestamp: 0, actor: 'Freelancer' },
    { step: 'Completed', title: 'Work Approved & Funds Released', status: 'upcoming', timestamp: 0, actor: 'Client' }
  ];

  return (
    <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-headline">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping inline-block" />
            On-Chain Escrow Timeline
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Immutable transaction trail on Polygon
          </p>
        </div>
        <span className="text-[10px] font-mono text-purple-900 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 font-bold">
          Ledger
        </span>
      </div>

      {/* Vertical Stepper matching reference HTML */}
      <div className="relative pl-6 space-y-6">
        {/* Vertical Connector Line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200 z-0" />

        {safeEvents.map((evt, idx) => {
          const isDone = evt.status === 'completed';
          const isCurrent = evt.status === 'current';

          return (
            <div key={idx} className="relative z-10 flex items-start gap-3">
              {/* Node Bullet */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border -ml-6 ${
                  isDone
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-700 shadow-xs'
                    : isCurrent
                    ? 'bg-purple-100 border-purple-400 text-purple-700 animate-pulse font-bold'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 size={14} />
                ) : isCurrent ? (
                  <Clock size={14} />
                ) : (
                  <Circle size={12} />
                )}
              </div>

              {/* Event Content */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    Step {idx + 1}: {evt.step}
                  </span>
                  {evt.actor && (
                    <span className="text-[10px] font-mono text-purple-900 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 font-bold">
                      {evt.actor}
                    </span>
                  )}
                </div>

                <h4 className={`font-semibold ${isDone ? 'text-slate-900' : isCurrent ? 'text-purple-900 font-bold' : 'text-slate-500'}`}>
                  {evt.title}
                </h4>

                {isDone && evt.txHash && (
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-500">{formatTimeAgo(evt.timestamp)}</span>
                    <a
                      href={getPolygonScanUrl(evt.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-700 font-bold hover:underline flex items-center gap-0.5"
                    >
                      {truncateAddress(evt.txHash)} <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
