import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Coins,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Calculator,
} from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Button } from '../common/Button';

export const NewToCryptoSection: React.FC = () => {
  const [openDisclosure, setOpenDisclosure] = useState<number | null>(null);

  const steps = [
    {
      number: '1',
      icon: Wallet,
      title: 'Connect your wallet',
      description:
        'Install a browser wallet like MetaMask or Coinbase Wallet. Your wallet address is your secure account — no passwords to remember or email verifications.',
    },
    {
      number: '2',
      icon: Coins,
      title: 'Hold POL or USDC on Polygon',
      description:
        'PolyLance uses the Polygon network for near-instant confirmations and typical sub-cent transaction gas. Hold USDC for dollar-pegged stability, or native POL.',
    },
    {
      number: '3',
      icon: ShieldCheck,
      title: 'Deliver work with escrow safety',
      description:
        'Every contract is locked in an immutable smart contract. Freelancers get guaranteed payment backing; clients approve work before money moves.',
    },
  ];

  const disclosures = [
    {
      q: 'Why do I need a tiny amount of POL?',
      a: 'Polygon requires a fraction of native POL to cover blockchain transaction fees (gas). Because Polygon is a high-speed Proof-of-Stake network, network gas is typically sub-cent per transaction. Clients fund release gas, but freelancers need a tiny fraction of POL to submit work on-chain.',
    },
    {
      q: 'Can I convert crypto earnings to my local bank currency (USD, EUR, GBP)?',
      a: 'Yes. USDC is pegged 1:1 with the US Dollar. You can send your USDC or POL to any regulated exchange (such as Coinbase, Kraken, or Binance) or off-ramp service and withdraw directly to your bank account or debit card within minutes.',
    },
    {
      q: 'Does PolyLance hold or control my private keys?',
      a: 'Never. PolyLance is strictly non-custodial. We never ask for, store, or have access to your private keys or seed phrase. All transactions must be explicitly approved and signed in your own wallet.',
    },
  ];

  const toggleDisclosure = (idx: number) => {
    setOpenDisclosure(openDisclosure === idx ? null : idx);
  };

  return (
    <section className="w-full bg-[#F6F7F9] border-b border-[#E5E7EB] py-16 sm:py-20 lg:py-24">
      <PageContainer noVerticalPadding>
        <div className="space-y-12 text-left">
          
          {/* Header */}
          <div className="max-w-2xl space-y-3">
            <div className="text-eyebrow text-[#0047AB]">New to Web3?</div>
            <h2 className="text-landing-h2 text-[#0B0B0F]">
              Never worked with crypto before? We've got you covered.
            </h2>
            <p className="text-lead text-[#4B5563]">
              You don't need to be a blockchain developer to use PolyLance. Connect your wallet in seconds with no lengthy sign-up forms.
            </p>
          </div>

          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 sm:p-7 shadow-2xs space-y-4 text-left flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-[10px] bg-[#EAF1FB] text-[#0047AB] flex items-center justify-center font-bold text-base">
                        <Icon size={20} />
                      </div>
                      <span className="text-xs font-bold text-[#6B7280] px-2.5 py-1 rounded bg-[#F3F4F6]">
                        Step {step.number}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#0B0B0F]">
                      {step.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3 Expandable Beginner Disclosures */}
          <div className="max-w-3xl mx-auto space-y-3 pt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0047AB] pb-1 text-center sm:text-left">
              Common Beginner Questions
            </div>

            {disclosures.map((d, idx) => {
              const isOpen = openDisclosure === idx;
              return (
                <div
                  key={d.q}
                  className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleDisclosure(idx)}
                    aria-expanded={isOpen}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-[#0B0B0F] hover:text-[#0047AB] transition-colors cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle size={16} className="text-[#0047AB] shrink-0" />
                      <span>{d.q}</span>
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-[#6B7280] transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-[#0047AB]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-[#4B5563] leading-relaxed border-t border-[#F3F4F6] pt-3">
                      {d.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Subtle Link Row for Deeper Protocol Exploration */}
          <div className="pt-4 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 text-xs text-[#4B5563]">
            <span>Need a deeper walkthrough or custom calculation?</span>
            <div className="flex items-center gap-4 font-semibold text-[#0047AB]">
              <Link to="/how-it-works" className="inline-flex items-center gap-1 hover:underline">
                <span>Complete 4-step walkthrough</span>
                <ArrowRight size={13} />
              </Link>
              <span className="text-gray-300">·</span>
              <Link to="/escrow-simulator" className="inline-flex items-center gap-1.5 hover:underline">
                <Calculator size={13} />
                <span>Simulate your project budget</span>
              </Link>
            </div>
          </div>

        </div>
      </PageContainer>
    </section>
  );
};
