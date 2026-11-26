import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Plus } from 'lucide-react';
import { CLIENT_FEE_PERCENT, TOTAL_PLATFORM_FEE_PERCENT } from '../../utils/fees';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'What is PolyLance?',
    a: 'PolyLance is a freelance marketplace on Polygon where milestone payments stay inside a smart contract until work is approved.',
  },
  {
    q: 'Who holds the money during a project?',
    a: 'Neither PolyLance nor any bank holds your money. Payment remains locked in the job smart contract until client sign-off or a dispute resolution.',
  },
  {
    q: 'How much does PolyLance charge?',
    a: `PolyLance uses a flat ${CLIENT_FEE_PERCENT}% client fee and ${CLIENT_FEE_PERCENT}% freelancer fee (${TOTAL_PLATFORM_FEE_PERCENT}% total), shown clearly before you sign.`,
  },
  {
    q: 'What happens if client and freelancer disagree?',
    a: 'Either side can open a dispute after submission. Independent judges inspect the submitted work and decide how locked funds split.',
  },
  {
    q: 'Why do I need a small amount of POL?',
    a: 'Polygon uses POL to cover tiny network transaction fees so your escrow approvals settle quickly while holding or earning USDC or POL.',
  },
  {
    q: 'Can I convert earnings to my local bank currency?',
    a: 'Yes. Earnings arrive directly in your wallet with no PolyLance withdrawal fee, ready for any supported exchange or cash-out ramp in your country.',
  },
  {
    q: 'Does PolyLance ever control my wallet or keys?',
    a: 'Never. Signing in verifies wallet ownership via a free cryptographic signature while your private keys stay inside your own wallet app.',
  },
  {
    q: 'Which wallets are supported?',
    a: 'MetaMask, Coinbase Wallet, and WalletConnect-compatible wallets on Polygon Mainnet (Chain ID 137).',
  },
];

export const LandingFaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [showAll, setShowAll] = useState<boolean>(false);

  const visibleFaqs = showAll ? FAQS : FAQS.slice(0, 5);

  return (
    <section
      id="faq"
      aria-label="Frequently asked questions"
      className="w-full bg-white py-16 sm:py-24 border-b border-slate-200/70"
    >
      <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-10 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* LEFT (lg:col-span-4): Heading + View Full Docs Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-4 space-y-4 lg:sticky lg:top-24"
          >
            <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[#0A52B8]">
              FAQ
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Common questions.
            </h2>
            <p className="text-[15px] text-slate-600 leading-relaxed">
              Clear answers on smart contract escrow, Polygon payouts, fees, and independent peer arbitration.
            </p>
            <div className="pt-1">
              <Link
                to="/faq"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0A52B8] hover:text-[#084298] hover:underline"
              >
                <span>Have more questions? View full docs</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>

          {/* RIGHT (lg:col-span-8): Clean Animated Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-8 space-y-5"
          >
            <div className="border-y border-slate-200 divide-y divide-slate-200">
              {visibleFaqs.map((item, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div key={item.q} className="relative">
                    {isOpen && (
                      <motion.span
                        layoutId="faqActiveBar"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-full bg-[#0A52B8]"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full min-h-[58px] py-4 pl-4 pr-1 flex items-center justify-between gap-4 text-left group cursor-pointer"
                    >
                      <span
                        className={`text-[16px] font-semibold transition-colors ${
                          isOpen ? 'text-[#0A52B8]' : 'text-[#0F172A] group-hover:text-[#0A52B8]'
                        }`}
                      >
                        {item.q}
                      </span>
                      <span
                        className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 ${
                          isOpen
                            ? 'rotate-45 border-[#0A52B8] text-[#0A52B8] bg-[#EFF6FF]'
                            : 'border-slate-200 text-slate-500'
                        }`}
                      >
                        <Plus size={14} />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="pb-4 pl-4 pr-8 text-[15px] leading-relaxed text-slate-600">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {!showAll && FAQS.length > 5 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="text-sm font-semibold text-[#0A52B8] hover:underline cursor-pointer"
                >
                  Show more questions ({FAQS.length - 5} more)
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LandingFaqSection;
