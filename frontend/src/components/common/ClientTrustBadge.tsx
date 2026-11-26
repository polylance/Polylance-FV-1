import React from 'react';
import { ShieldCheck, Star, Briefcase, CheckCircle2, Clock } from 'lucide-react';
import { Job, UserProfile } from '../../types';
import { calculateClientTrustStats } from '../../utils/clientReputation';

interface ClientTrustBadgeProps {
  clientAddress?: string;
  jobs?: Job[];
  profile?: UserProfile | null;
  compact?: boolean;
  className?: string;
}

/**
 * Displays a Client's live on-chain reputation score, star rating, settled jobs, and escrow funded rate.
 */
export const ClientTrustBadge: React.FC<ClientTrustBadgeProps> = ({
  clientAddress,
  jobs = [],
  profile,
  compact = false,
  className = '',
}) => {
  const stats = calculateClientTrustStats(clientAddress, jobs, profile);

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-medium text-[#0F172A] ${className}`}
        title={`Client Score ${stats.clientScore} • ${stats.jobsSettled} settled (${stats.escrowFundedRate}% funded)`}
      >
        <ShieldCheck size={12} className="text-[#0A52B8] shrink-0" />
        <span className="font-semibold text-[#0A52B8]">{stats.tierLabel}</span>
        {stats.averageRating > 0 && (
          <>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-[#0F172A]">
              {stats.averageRating.toFixed(1)}
              <Star size={11} className="fill-[#0A52B8] text-[#0A52B8]" />
            </span>
          </>
        )}
        <span className="text-slate-300">•</span>
        <span className="font-mono text-slate-600 tabular-nums">
          {stats.jobsSettled} settled
        </span>
      </span>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-white border border-slate-200/90 p-5 space-y-4 text-left shadow-2xs ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider font-semibold text-[#0A52B8]">
            <ShieldCheck size={14} />
            <span>{stats.tierLabel}</span>
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">
            Client Trust &amp; Settlement Record
          </h3>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-right shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#0A52B8]">
            Client Score
          </div>
          <div className="text-lg font-bold font-mono text-[#0F172A] tabular-nums">
            {stats.clientScore}
            <span className="text-xs font-normal text-slate-500"> / 1000</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Star size={12} className="text-[#0A52B8]" />
            <span>Rating</span>
          </div>
          <div className="mt-1 text-sm font-bold text-[#0F172A] tabular-nums">
            {stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)} / 5.0` : 'New Client'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Briefcase size={12} className="text-[#0A52B8]" />
            <span>Posted / Settled</span>
          </div>
          <div className="mt-1 text-sm font-bold text-[#0F172A] tabular-nums">
            {stats.jobsPosted} / {stats.jobsSettled}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-[#0A52B8]" />
            <span>Escrow Funded</span>
          </div>
          <div className="mt-1 text-sm font-bold text-[#0F172A] tabular-nums">
            {stats.escrowFundedRate}%
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock size={12} className="text-[#0A52B8]" />
            <span>Release Speed</span>
          </div>
          <div className="mt-1 text-sm font-bold text-[#0F172A] tabular-nums">
            {stats.avgReleaseHours !== null ? `${stats.avgReleaseHours}h avg` : 'Pending first'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientTrustBadge;
