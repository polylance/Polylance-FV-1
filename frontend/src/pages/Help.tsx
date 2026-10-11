import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { VideoGrid } from '../components/video/VideoGrid';
import { Search, ChevronDown, HelpCircle, Shield, BookOpen, Layers } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const Help: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const tutorialVideoIds = [
    'task-connect-wallet',
    'task-post-job',
    'task-apply-negotiate',
    'task-fund-release',
    'task-disputes',
    'task-reputation',
    'new-to-wallets',
    'get-paid-cash-out',
    'first-payment-proof',
    'safe-by-design'
  ];

  const faqs = [
    {
      q: 'How does smart contract escrow protect clients and freelancers?',
      a: 'Funds are locked into a secure Polygon smart contract before work begins. The client is guaranteed that funds are not released until milestone deliverables are inspected and approved. The freelancer is guaranteed that payment is fully locked and cannot be withdrawn arbitrarily.',
    },
    {
      q: 'What is the platform fee?',
      a: 'PolyLance charges a transparent 2.5% platform fee on milestone release to maintain contract security and arbitration infrastructure. The client deposit includes +2.5% and the freelancer receives 2.5% less. There are zero withdrawal fees and zero membership dues.',
    },
    {
      q: 'What are verified work certificates (Soulbound tokens)?',
      a: 'When an escrow milestone is approved, an ERC-721 Soulbound Token is minted directly to your connected wallet. Because it cannot be transferred or sold, it serves as permanent, tamper-proof proof of your work history, ratings, and skills.',
    },
    {
      q: 'How are disputes resolved?',
      a: 'If either party raises an issue that cannot be resolved mutually, the contract can be submitted to the PolyLance DAO judge panel. Verified peer judges review milestone specifications, code commits, and deliverables to issue an on-chain resolution.',
    },
    {
      q: 'Which currencies and tokens are supported?',
      a: 'PolyLance operates on Polygon with fast, sub-cent transaction fees. Milestone budgets can be funded using native POL or dollar-pegged USDC.',
    },
  ];

  return (
    <PageContainer className="space-y-12 py-8 text-[#0B0B0F]">
      
      {/* ── HEADER & SEARCH ────────────────────────────────────────────── */}
      <section className="text-left space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] bg-[#E7EEF9] text-[#0047AB] text-xs font-medium border border-[#E5E7EB]">
          <BookOpen size={13} />
          <span>Documentation & Tutorials</span>
        </div>

        <h1 className="font-sans font-semibold text-3xl sm:text-4xl text-[#0B0B0F] tracking-tight">
          Help and tutorials
        </h1>
        <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
          Learn how to set up non-custodial escrows, submit verified proposals, and build your sovereign reputation on Polygon.
        </p>

        {/* Search input (filters title, summary and transcript) */}
        <div className="pt-2 max-w-md">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search tutorials, tasks, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] pl-9 pr-4 py-2.5 text-xs sm:text-sm text-[#0B0B0F] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0047AB] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            />
          </div>
        </div>
      </section>

      {/* ── VIDEO TUTORIALS GRID ────────────────────────────────────────── */}
      <section className="space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[#0047AB]" />
            <h2 className="font-sans font-semibold text-lg text-[#0B0B0F]">
              Video Walkthroughs & Task Guides
            </h2>
          </div>
          <span className="text-xs text-[#6B7280]">
            Interactive guides
          </span>
        </div>

        <VideoGrid
          ids={tutorialVideoIds}
          filter={searchQuery ? { search: searchQuery } : undefined}
          emptyMessage="No matching video guides found for your search query."
        />
      </section>

      {/* ── FREQUENTLY ASKED QUESTIONS ──────────────────────────────────── */}
      <section className="space-y-6 text-left max-w-[720px] mx-auto pt-6">
        <div className="space-y-1 text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#E7EEF9] text-[#0047AB] mb-1">
            <HelpCircle size={16} />
          </div>
          <h2 className="font-sans font-semibold text-2xl text-[#0B0B0F] tracking-tight">
            Frequently asked questions
          </h2>
          <p className="text-sm text-[#4B5563]">
            Key facts regarding contract escrow, dispute arbitration, and fees.
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] divide-y divide-[#E5E7EB]">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full py-4 px-5 sm:px-6 flex items-center justify-between text-left cursor-pointer hover:bg-[#F6F7F9] transition-colors"
                >
                  <span className="font-semibold text-sm sm:text-base text-[#0B0B0F] pr-4">
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      className={isOpen ? 'text-[#0047AB]' : 'text-[#4B5563]'}
                    />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="faq-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="px-5 sm:px-6 pb-4 pt-1 text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

    </PageContainer>
  );
};

export default Help;
