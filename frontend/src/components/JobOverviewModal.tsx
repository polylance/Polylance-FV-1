import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { Job } from '../types';
import { truncateAddress } from '../utils/formatters';
import { FormattedJobDescription } from './FormattedJobDescription';
import { scrollToSection } from '../utils/scroll';
import { TokenIcon } from './TokenIcon';
import { Modal } from './overlay';
import { Button } from './common/Button';

interface JobOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

export const JobOverviewModal: React.FC<JobOverviewModalProps> = ({
  isOpen,
  onClose,
  job,
}) => {
  const navigate = useNavigate();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B0B0F] text-white border border-slate-800 flex items-center justify-center shrink-0">
            <Briefcase size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans font-medium uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                <CheckCircle2 size={11} className="text-[#0047AB]" />
                {job.status} Escrow
              </span>
              <span className="text-xs font-mono text-slate-400">
                #{job.id.slice(0, 8)}
              </span>
            </div>
            <h3 className="font-semibold text-base text-slate-900 mt-0.5 truncate">
              {job.title}
            </h3>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              onClose();
              navigate(`/jobs/${job.id}?section=job-specs`);
              scrollToSection('job-specs');
            }}
          >
            <span>View Full Escrow Page</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs font-sans">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              Escrow Deposit
            </span>
            <div className="font-sans font-semibold text-slate-900 text-base flex items-center gap-1.5 tabular-nums">
              <TokenIcon token={job.paymentTokenSymbol || 'USDC'} size={18} />
              <span>
                {(() => {
                  const sym = (job.paymentTokenSymbol || 'USDC').toUpperCase();
                  const isCrypto = sym === 'POL' || sym === 'MATIC';
                  const tokenLabel = isCrypto ? 'POL' : sym;
                  const amt = isCrypto ? (job.amountEth || job.amountUsdc) : job.amountUsdc;
                  return isCrypto ? `${amt} ${tokenLabel}` : `$${parseFloat(amt || '0').toFixed(2)} ${tokenLabel}`;
                })()}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              SLA Timeline
            </span>
            <div className="font-sans font-semibold text-slate-900 text-base flex items-baseline gap-1 tabular-nums">
              <span>{job.reviewPeriodDays || 7}</span>
              <span className="text-xs font-normal text-slate-500">Days</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              Client Address
            </span>
            <div className="font-mono text-slate-900 text-xs truncate mt-1">
              {truncateAddress(job.client)}
            </div>
          </div>
        </div>

        {/* Full Description Section */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs uppercase tracking-wider">
            <FileText size={14} className="text-[#0047AB]" />
            <span>Job Description & Specifications</span>
          </div>
          <FormattedJobDescription description={job.description} />
        </div>

        {/* Skills Required */}
        {job.skillsRequired && job.skillsRequired.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-xs text-slate-700">
              Required Technical Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {job.skillsRequired.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
