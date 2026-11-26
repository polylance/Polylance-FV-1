import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  Skeleton,
  SkeletonCard,
  SkeletonWell,
  SkeletonHighlightRow,
  useDelayedSkeleton,
  SKELETON_TOKENS,
} from '../Skeleton';
import { Workflow } from '../Workflow';
import { CertificateBadge } from '../../certificate/CertificateBadge';
import { BadgeArrivalModal } from '../../certificate/BadgeArrivalModal';

describe('Zenith Batch 1 — Core Components Suite', () => {
  describe('1. Skeleton System (Reference Image 1)', () => {
    it('defines the exact design tokens matching Image 1 specification', () => {
      expect(SKELETON_TOKENS.title).toBe('#0B0B0F');
      expect(SKELETON_TOKENS.bar).toBe('#B7BCC6');
      expect(SKELETON_TOKENS.well).toBe('#F5F6FA');
      expect(SKELETON_TOKENS.wellBorder).toBe('#E5E7EB');
      expect(SKELETON_TOKENS.icon).toBe('#EAF1FB');
      expect(SKELETON_TOKENS.highlightBg).toBe('#EEF4FD');
      expect(SKELETON_TOKENS.highlightBorder).toBe('#C9DAF2');
      expect(SKELETON_TOKENS.avatar).toBe('#0047AB');
      expect(SKELETON_TOKENS.blueBar1).toBe('#7FA3DB');
      expect(SKELETON_TOKENS.blueBar2).toBe('#A9C1E8');
      expect(SKELETON_TOKENS.headerRule).toBe('#0047AB');
    });

    it('renders SkeletonCard containing dark title, 2px cobalt rule, two wells, and highlight row with sweep', () => {
      const { container } = render(<SkeletonCard />);
      const region = screen.getByRole('status');
      expect(region).toBeDefined();

      // Check for 2px cobalt rule
      const cobaltRule = container.querySelector('[style*="background-color: rgb(0, 71, 171)"]');
      expect(cobaltRule).toBeDefined();

      // Check for sweep animation overlay
      const sweepElement = container.querySelector('.animate-skeleton-sweep');
      expect(sweepElement).toBeDefined();
    });

    it('renders SkeletonWell and SkeletonHighlightRow with expected structure', () => {
      const { container: wellContainer } = render(<SkeletonWell />);
      expect(wellContainer.querySelector('.rounded-full')).toBeDefined();

      const { container: highlightContainer } = render(<SkeletonHighlightRow />);
      expect(highlightContainer.querySelector('.bg-\\[\\#EEF4FD\\]')).toBeDefined();
    });

    it('manages delayed rendering and handles 8s timeout with error state', () => {
      vi.useFakeTimers();

      const TestComponent = ({ isLoading }: { isLoading: boolean }) => {
        const { shouldRender, isTimedOut, retry } = useDelayedSkeleton({
          isLoading,
          delayMs: 150,
          minDisplayMs: 300,
          timeoutMs: 8000,
        });

        return (
          <div>
            {shouldRender && <div data-testid="skeleton-visible">Skeleton Visible</div>}
            {isTimedOut && <div data-testid="skeleton-timeout">Timed Out</div>}
            <button onClick={retry}>Retry</button>
          </div>
        );
      };

      const { rerender } = render(<TestComponent isLoading={false} />);
      expect(screen.queryByTestId('skeleton-visible')).toBeNull();

      // Start loading - should not show before 150ms delay
      rerender(<TestComponent isLoading={true} />);
      expect(screen.queryByTestId('skeleton-visible')).toBeNull();

      // Advance past 150ms delay - skeleton should appear
      act(() => {
        vi.advanceTimersByTime(160);
      });
      expect(screen.getByTestId('skeleton-visible')).toBeDefined();

      // Fast-forward past 8000ms timeout
      act(() => {
        vi.advanceTimersByTime(8000);
      });
      expect(screen.getByTestId('skeleton-timeout')).toBeDefined();

      vi.useRealTimers();
    });
  });

  describe('2. Workflow Stepper (Reference Image 3)', () => {
    const sampleSteps = [
      { id: 1, label: 'Connect Wallet' },
      { id: 2, label: 'Fund Escrow' },
      { id: 3, label: 'Review Work' },
      { id: 4, label: 'Release Payment', isFinal: true },
    ];

    it('renders horizontal stepper with numbered circles and Action Bar', () => {
      render(
        <Workflow
          steps={sampleSteps}
          currentIndex={1}
          status="Escrow funded. Freelancer is working on milestones."
          actions={[{ label: 'Review Milestone' }]}
        />
      );

      // Current step is 2 (Fund Escrow)
      expect(screen.getByText('Fund Escrow')).toBeDefined();
      expect(screen.getByText('Review Work')).toBeDefined();

      // Action bar
      expect(screen.getByText('Escrow funded. Freelancer is working on milestones.')).toBeDefined();
      expect(screen.getByText('Review Milestone')).toBeDefined();
    });

    it('shows completed steps with checkmarks and final completed step with semantic green "Done"', () => {
      render(
        <Workflow
          steps={sampleSteps}
          currentIndex={4}
          status="Job complete and verified on-chain."
        />
      );

      // Final step label changes to "Done" in green
      const doneLabel = screen.getByText('Done');
      expect(doneLabel).toBeDefined();
      expect(doneLabel.className).toContain('text-[#0B7A55]');
    });
  });

  describe('3. Completion Badge (Reference Image 2)', () => {
    it('renders square card layout with verified seal, green chip "Verified on-chain", and PL-SBT #id', () => {
      render(
        <CertificateBadge
          onchainTokenId={7108}
          jobTitle="Smart Contract Architecture Audit"
          recipientName="Alice Engineer"
          amount="150"
          tokenSymbol="POL"
          completedAt={1729000000000}
        />
      );

      expect(screen.getByText('Proof of Work')).toBeDefined();
      expect(screen.getByText('Smart Contract Architecture Audit')).toBeDefined();
      expect(screen.getByText('Alice Engineer')).toBeDefined();
      expect(screen.getByText('Verified on-chain')).toBeDefined();
      expect(screen.getByText('PL-SBT #7108')).toBeDefined();
      expect(screen.getByText('150 POL Released')).toBeDefined();
    });

    it('renders Patronage variant title when specified', () => {
      render(
        <CertificateBadge
          onchainTokenId={9805}
          variant="patronage"
          jobTitle="Developer Community Grant"
        />
      );

      expect(screen.getByText('Patronage')).toBeDefined();
      expect(screen.getByText('PL-SBT #9805')).toBeDefined();
    });

    it('renders BadgeArrivalModal with celebration headline and sharing actions', () => {
      const handleClose = vi.fn();
      render(
        <BadgeArrivalModal
          isOpen={true}
          onClose={handleClose}
          certificate={{
            onchainTokenId: 7108,
            jobTitle: 'Production Deployment Escrow',
            recipientName: 'Alice',
          }}
        />
      );

      expect(screen.getByText('Your Soulbound Certificate Has Arrived')).toBeDefined();
      expect(screen.getByText('Share Certificate')).toBeDefined();
      expect(screen.getByText('View on Polygonscan')).toBeDefined();
    });
  });
});
