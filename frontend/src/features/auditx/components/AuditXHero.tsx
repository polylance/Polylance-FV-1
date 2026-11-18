import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, FileSearch, Sparkles, ShieldAlert } from 'lucide-react';
import { useWeb3 } from '../../../context/Web3Context';

interface AuditXHeroProps {
  onScrollToSample?: () => void;
  isAdmin?: boolean;
}

export const AuditXHero: React.FC<AuditXHeroProps> = ({ onScrollToSample, isAdmin }) => {
  const { connectWallet } = useWeb3();

  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 text-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Category Pill / Admin Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0047AB] text-xs font-semibold mb-6">
          <ShieldCheck size={14} className="text-[#0047AB]" />
          <span>Automated Smart Contract Analysis</span>
          {isAdmin && (
            <Link
              to="/auditx/internal"
              className="ml-1.5 px-2 py-0.5 rounded-full bg-[#0047AB] text-white text-[10px] font-bold tracking-wide uppercase hover:bg-[#003580] transition-colors"
            >
              Admin Report Available
            </Link>
          )}
        </div>

        {/* Primary Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4"
        >
          AuditX: Automated Smart Contract Security Checks
        </motion.h1>

        {/* One-Paragraph Explanation */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8"
        >
          Automated vulnerability scanning and code quality checks for Solidity smart contracts. Inspect deliverables before escrow release, eliminate common reentrancy and access control flaws, and build confidence before mainnet deployment.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
        >
          <Link
            to="/auditx/scan"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0047AB] text-white font-semibold text-sm shadow-sm hover:bg-[#003580] transition-colors active:scale-[0.99]"
          >
            <span>Scan your code</span>
            <ArrowRight size={16} />
          </Link>

          <button
            type="button"
            onClick={onScrollToSample}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <FileSearch size={16} className="text-slate-500" />
            <span>See a sample report</span>
          </button>
        </motion.div>

        {/* Honest Trust Line */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 max-w-xl mx-auto">
          <ShieldAlert size={14} className="text-amber-600 shrink-0" />
          <span>
            Automated analysis is a pre-deployment hygiene tool, not a substitute for an independent professional audit.
          </span>
        </div>
      </div>
    </section>
  );
};
