import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Layers, Wallet, Zap } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    icon: Wallet,
    title: 'Connect Wallet',
    description:
      'Sign in securely with MetaMask, Coinbase Wallet, or WalletConnect on Polygon—zero passwords or email forms.',
  },
  {
    num: '02',
    icon: Layers,
    title: 'Fund or Pick a Milestone',
    description:
      'Clients fund milestone budgets in POL or USDC upfront while builders begin work with clear on-chain terms.',
  },
  {
    num: '03',
    icon: Zap,
    title: 'Approve & Settle Instantly',
    description:
      'Submit deliverables in your workspace, verify quality, and release payout straight to your wallet in ~2s.',
  },
];

export const NewToCryptoSection: React.FC = () => {
  return (
    <section
      aria-label="New to Web3"
      className="w-full bg-[#F8FAFC] py-16 sm:py-20 border-b border-slate-200/70"
    >
      <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-10 text-left">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div className="space-y-1.5">
            <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[#0A52B8]">
              New to Web3?
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Start in Three Steps
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm font-semibold">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-1.5 text-[#0A52B8] hover:underline"
            >
              <span>Full walkthrough</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/escrow-simulator"
              className="inline-flex items-center gap-1.5 text-[#0F172A] hover:text-[#0A52B8]"
            >
              <span>Try escrow simulator</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>

        {/* Horizontal 3-Step Visual Strip with Subtle Connecting Line */}
        <div className="relative mt-10">
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-11 left-[16%] right-[16%] h-px bg-slate-200 z-0"
          />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.5,
                    delay: idx * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="h-full"
                >
                  <div className="h-full p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-[#0A52B8]/35 transition-colors flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between">
                      <span className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#0A52B8]">
                        <Icon size={18} />
                      </span>
                      <span className="text-sm font-mono font-bold text-[#0A52B8] tabular-nums">
                        {step.num}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-[#0F172A]">
                        {step.title}
                      </h3>
                      <p className="text-[14.5px] leading-relaxed text-slate-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewToCryptoSection;
