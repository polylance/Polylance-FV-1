import React, { useState } from 'react';
import {
  X,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
} from 'lucide-react';
import { Job, SkillCategory } from '../types';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { TokenIcon } from './TokenIcon';
import { scrollToSection } from '../utils/scroll';
import { Modal } from './overlay/Modal';
import { Button } from './common/Button';

interface ModifyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

const CATEGORIES: { value: SkillCategory; label: string; desc: string }[] = [
  { value: 'web3', label: 'Web3 & Smart Contracts', desc: 'Solidity, EVM, DeFi, Security, Audits' },
  { value: 'frontend', label: 'Frontend Development', desc: 'React, Next.js, TypeScript, Tailwind' },
  { value: 'backend', label: 'Backend & Infrastructure', desc: 'Node.js, Go, Python, Cloud, APIs' },
  { value: 'mobile', label: 'Mobile Engineering', desc: 'React Native, Flutter, iOS, Android' },
];

export const ModifyJobModal: React.FC<ModifyJobModalProps> = ({ isOpen, onClose, job }) => {
  const { updateJobDetails } = usePolyLanceData();

  const [title, setTitle] = useState(job.title || '');
  const [description, setDescription] = useState(job.description || '');
  const [category, setCategory] = useState<SkillCategory>(job.category || 'web3');
  const [amountUsdc, setAmountUsdc] = useState(job.amountUsdc || job.amountEth || '100');
  const [reviewPeriodDays, setReviewPeriodDays] = useState(job.reviewPeriodDays || 3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sym = job.paymentTokenSymbol || (job.amountEth ? 'POL' : 'USDC');
  const isCrypto = sym === 'POL';
  const tokenPriceUsd = 0.42;

  const isLockedOrFunded = ['Funded', 'Submitted', 'Disputed', 'Completed'].includes(job.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a job title');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please enter a project description');
      return;
    }

    const numericAmount = parseFloat(amountUsdc);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Please enter a valid budget amount');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const success = await updateJobDetails(job.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        amountUsdc: !isCrypto ? numericAmount.toString() : job.amountUsdc,
        amountEth: isCrypto ? numericAmount.toString() : job.amountEth,
        reviewPeriodDays,
      });

      if (success) {
        setSuccessMessage('Job specifications updated successfully on-chain.');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('polylance-job-updated', {
              detail: { jobId: job.id, title, description, category, reviewPeriodDays },
            })
          );
        }
        setTimeout(() => {
          onClose();
          scrollToSection('job-specs');
        }, 800);
      } else {
        setErrorMessage('Failed to update job details. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while updating job details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      isPending={isSubmitting}
      title="Modify Job Details"
      description="Update title, scope, budget, and review requirements for your project escrow."
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            icon={<Save size={15} />}
          >
            {isSubmitting ? 'Saving changes...' : 'Save changes'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Alert messages */}
        {errorMessage && (
          <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-[#DC2626]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-[8px] bg-[#EAF1FB] border border-[#C9DAF2] text-[#0047AB] text-xs flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {isLockedOrFunded && (
          <div className="p-3 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] text-xs text-[#4B5563]">
            Note: This escrow is currently in <strong>{job.status}</strong> state. Modifying budget or terms after funding should be coordinated with the freelancer via negotiation proposals.
          </div>
        )}

        {/* Job Title */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#4B5563]">
            Job title <span className="text-[#991B1B]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Full-Stack Web3 Marketplace Development"
            className="w-full h-11 px-3 rounded-[10px] border border-[#E5E7EB] bg-white text-sm text-[#0B0B0F] focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB]"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Category selection */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#4B5563]">
            Skill domain / category <span className="text-[#991B1B]">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CATEGORIES.map((c) => {
              const isSelected = category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`p-3 rounded-[10px] text-left border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#0047AB] bg-[#EAF1FB] text-[#0047AB]'
                      : 'border-[#E5E7EB] bg-white hover:bg-[#F6F7F9] text-[#0B0B0F]'
                  }`}
                  disabled={isSubmitting}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{c.label}</span>
                    <Tag size={13} className={isSelected ? 'text-[#0047AB]' : 'text-[#6B7280]'} />
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-1">{c.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget & Review Period Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Budget Amount */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#4B5563]">
              Target budget ({sym}) <span className="text-[#991B1B]">*</span>
            </label>
            <div className="flex items-center gap-2 h-11 px-3 rounded-[10px] border border-[#E5E7EB] bg-white focus-within:border-[#0047AB] focus-within:ring-1 focus-within:ring-[#0047AB]">
              <TokenIcon token={sym} size={18} />
              <input
                type="number"
                step="any"
                min="0.0001"
                value={amountUsdc}
                onChange={(e) => setAmountUsdc(e.target.value)}
                placeholder={isCrypto ? '10' : '250.00'}
                className="flex-1 min-w-0 bg-transparent text-sm text-[#0B0B0F] outline-none tabular-nums"
                required
                disabled={isSubmitting}
              />
              <span className="text-xs font-semibold text-[#6B7280] shrink-0">{sym}</span>
            </div>
            {isCrypto && (
              <span className="text-[11px] text-[#6B7280] tabular-nums block">
                ≈ ${(parseFloat(amountUsdc || '0') * tokenPriceUsd).toFixed(2)} USD
              </span>
            )}
          </div>

          {/* Review Period Days */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#4B5563]">
              Client review window (days) <span className="text-[#991B1B]">*</span>
            </label>
            <div className="flex items-center gap-2 h-11 px-3 rounded-[10px] border border-[#E5E7EB] bg-white focus-within:border-[#0047AB] focus-within:ring-1 focus-within:ring-[#0047AB]">
              <Calendar size={16} className="text-[#0047AB] shrink-0" />
              <input
                type="number"
                min="1"
                max="30"
                value={reviewPeriodDays}
                onChange={(e) => setReviewPeriodDays(parseInt(e.target.value) || 1)}
                className="w-full bg-transparent text-sm text-[#0B0B0F] outline-none tabular-nums"
                required
                disabled={isSubmitting}
              />
              <span className="text-xs text-[#6B7280] shrink-0">days</span>
            </div>
          </div>
        </div>

        {/* Detailed Scope Description */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#4B5563]">
            Detailed scope description <span className="text-[#991B1B]">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe deliverables, milestone specs, and acceptance criteria..."
            className="w-full p-3 rounded-[10px] border border-[#E5E7EB] bg-white text-sm text-[#0B0B0F] focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] resize-y"
            required
            disabled={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  );
};

export default ModifyJobModal;
