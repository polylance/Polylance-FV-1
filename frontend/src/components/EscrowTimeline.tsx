import React from 'react';
import { JobEvent } from '../types';
import { CheckCircle2, Circle, Clock, ExternalLink } from 'lucide-react';
import { formatTimeAgo, getPolygonScanUrl, truncateAddress } from '../utils/formatters';

interface EscrowTimelineProps {
  events?: JobEvent[];
}

export const EscrowTimeline: React.FC<EscrowTimelineProps> = ({ events }) => {
  const safeEvents: JobEvent[] = Array.isArray(events) && events.length > 0 ? events : [
    { step: 'Posted', title: 'Job posted to PolyLance', status: 'completed', timestamp: Date.now() - 3600000, actor: 'Client' },
    { step: 'Funded', title: 'Escrow funded on-chain', status: 'current', timestamp: Date.now(), actor: 'Client' },
    { step: 'Work in progress', title: 'Work submitted for review', status: 'upcoming', timestamp: 0, actor: 'Freelancer' },
    { step: 'Completed', title: 'Payment released to freelancer', status: 'upcoming', timestamp: 0, actor: 'Client' }
  ];

  return (
    <div className="p-5 border border-[#E5E7EB] bg-white rounded-xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
        <div>
          <h3 className="text-sm font-semibold text-[#0B0B0F]">
            Escrow timeline
          </h3>
          <p className="text-xs text-[#4B5563] mt-0.5">
            On-chain milestone progress
          </p>
        </div>
        <span className="text-xs text-[#4B5563] bg-[#F6F7F9] px-2 py-0.5 rounded border border-[#E5E7EB] font-medium">
          On-chain
        </span>
      </div>

      <div className="relative pl-6 space-y-5">
        {/* Vertical Connector Line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[#E5E7EB] z-0" />

        {safeEvents.map((evt, idx) => {
          const isDone = evt.status === 'completed';
          const isCurrent = evt.status === 'current';

          return (
            <div key={idx} className="relative z-10 flex items-start gap-3">
              {/* Node Bullet */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border -ml-6 text-xs ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : isCurrent
                    ? 'bg-[#0047AB] border-[#0047AB] text-white font-semibold'
                    : 'bg-white border-[#E5E7EB] text-[#4B5563]'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 size={13} />
                ) : isCurrent ? (
                  <Clock size={13} />
                ) : (
                  <Circle size={10} />
                )}
              </div>

              {/* Event Content */}
              <div className="space-y-0.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#4B5563]">
                    Step {idx + 1}: {evt.step}
                  </span>
                  {evt.actor && (
                    <span className="text-xs text-[#4B5563] bg-[#F6F7F9] px-1.5 py-0.2 rounded border border-[#E5E7EB]">
                      {evt.actor}
                    </span>
                  )}
                </div>

                <h4 className={`text-xs ${isDone ? 'text-[#0B0B0F] font-medium' : isCurrent ? 'text-[#0047AB] font-semibold' : 'text-[#4B5563]'}`}>
                  {evt.title}
                </h4>

                {isCurrent && (
                  <p className="text-xs text-[#4B5563]">
                    Next action required by {evt.actor || 'counterpart'}
                  </p>
                )}

                {isDone && evt.timestamp > 0 && (
                  <span className="text-xs text-[#4B5563] block">
                    {formatTimeAgo(evt.timestamp)}
                  </span>
                )}

                {isDone && evt.txHash && (
                  <div className="flex items-center gap-1 font-mono text-xs pt-0.5">
                    <a
                      href={getPolygonScanUrl(evt.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0047AB] hover:underline flex items-center gap-0.5"
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
