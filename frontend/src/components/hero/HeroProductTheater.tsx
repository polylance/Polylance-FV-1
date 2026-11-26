import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Receipt, ReceiptStamp } from '../common/Receipt';
import { useReducedMotion } from '../../media/useDataSaver';

interface HeroProductTheaterProps {
  audience: 'freelancer' | 'client';
}

interface ReceiptStep {
  stamp: ReceiptStamp;
  statusNote: string;
  totalLabel: string;
  totalValue: string;
}

const FREELANCER_STEPS: ReceiptStep[] = [
  {
    stamp: 'LOCKED',
    statusNote: 'Client funded the milestone before work started.',
    totalLabel: 'Locked in escrow',
    totalValue: '$1,230.00 USDC',
  },
  {
    stamp: 'APPROVED',
    statusNote: 'Client reviewed deliverables and signed release.',
    totalLabel: 'Scheduled payout (after 2.5% fee)',
    totalValue: '$1,170.00 USDC',
  },
  {
    stamp: 'PAID',
    statusNote: 'Milestone settled directly to your wallet.',
    totalLabel: 'Paid to your wallet',
    totalValue: '$1,170.00 USDC',
  },
];

const CLIENT_STEPS: ReceiptStep[] = [
  {
    stamp: 'LOCKED',
    statusNote: 'Funds stay in the smart contract while work proceeds.',
    totalLabel: 'Escrow deposit (includes 2.5% fee)',
    totalValue: '$1,230.00 USDC',
  },
  {
    stamp: 'APPROVED',
    statusNote: 'You signed off after inspecting the deliverable.',
    totalLabel: 'Authorized release',
    totalValue: '$1,170.00 USDC',
  },
  {
    stamp: 'PAID',
    statusNote: 'Settlement recorded on Polygon.',
    totalLabel: 'Settled to freelancer',
    totalValue: '$1,170.00 USDC',
  },
];

export const HeroProductTheater: React.FC<HeroProductTheaterProps> = ({ audience }) => {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const steps = audience === 'client' ? CLIENT_STEPS : FREELANCER_STEPS;

  const [stepIdx, setStepIdx] = useState<number>(() => (reducedMotion ? 2 : 0));
  const [hasPlayedOnce, setHasPlayedOnce] = useState<boolean>(false);
  const [playNonce, setPlayNonce] = useState<number>(0);

  // Play LOCKED -> APPROVED -> PAID once when visible, then stay static on PAID
  useEffect(() => {
    if (reducedMotion) return;

    const el = containerRef.current;
    if (!el) return;

    let t1: number | undefined;
    let t2: number | undefined;

    const triggerSequence = () => {
      setStepIdx(0);
      t1 = window.setTimeout(() => setStepIdx(1), 950);
      t2 = window.setTimeout(() => setStepIdx(2), 1900);
    };

    if (playNonce > 0) {
      triggerSequence();
      return () => {
        if (t1) window.clearTimeout(t1);
        if (t2) window.clearTimeout(t2);
      };
    }

    if (hasPlayedOnce) return;

    if (typeof IntersectionObserver === 'undefined') {
      setHasPlayedOnce(true);
      triggerSequence();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasPlayedOnce(true);
          triggerSequence();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (t1) window.clearTimeout(t1);
      if (t2) window.clearTimeout(t2);
    };
  }, [reducedMotion, hasPlayedOnce, playNonce]);

  const effectiveStepIdx = reducedMotion ? 2 : stepIdx;
  const current = steps[effectiveStepIdx] || steps[2];

  const handleReplay = () => {
    if (reducedMotion) return;
    setStepIdx(0);
    setHasPlayedOnce(true);
    setPlayNonce((n) => n + 1);
  };

  return (
    <div ref={containerRef} className="w-full max-w-[460px] mx-auto lg:ml-auto space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#4B5563]">
          Example
        </span>
        {!reducedMotion && (
          <button
            type="button"
            onClick={handleReplay}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0047AB] hover:underline cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Replay</span>
          </button>
        )}
      </div>

      <Receipt
        badgeText="Example milestone"
        title="Website landing rebuild"
        subtitle={current.statusNote}
        stamp={current.stamp}
        items={[
          { label: 'Milestone amount', value: '$1,200.00 USDC' },
          { label: 'Client escrow fee (2.5%)', value: '$30.00 USDC', muted: true },
          { label: 'Freelancer payout fee (2.5%)', value: '$30.00 USDC', muted: true },
        ]}
        totalLabel={current.totalLabel}
        totalValue={current.totalValue}
        hashLine="Example receipt · Polygon Mainnet (Chain ID 137)"
      />
    </div>
  );
};

export default HeroProductTheater;
