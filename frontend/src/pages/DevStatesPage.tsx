import React, { useState } from 'react';
import { Skeleton, SkeletonCard, SkeletonWell, SkeletonHighlightRow } from '../components/common/Skeleton';
import { Workflow } from '../components/common/Workflow';
import { CertificateBadge } from '../components/certificate/CertificateBadge';
import { BadgeArrivalModal } from '../components/certificate/BadgeArrivalModal';
import {
  EmptyState,
  LoadingState,
  ErrorState,
  NoSearchResultState,
  PermissionDeniedState,
  NoInternetState,
  SlowNetworkState,
} from '../components/UIStates';

export const DevStatesPage: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string>('zenith-batch1');
  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false);

  return (
    <div className="w-full py-4 space-y-8 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 font-headline">
          UI States & Skeletons Showcase
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review mobile layout, empty states, zero-CLS skeleton placeholders, and error fallbacks.
        </p>
      </div>

      {/* State Switcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'zenith-batch1', label: '⭐ Zenith Batch 1 (Images 1, 2, 3)' },
          { id: 'skeletons', label: 'Legacy Skeletons' },
          { id: 'empty', label: 'Empty State' },
          { id: 'loading', label: 'Loading State' },
          { id: 'error', label: 'Error State' },
          { id: 'no-results', label: 'No Search Results' },
          { id: 'forbidden', label: 'Permission Denied' },
          { id: 'slow-network', label: 'Slow Network' },
          { id: 'offline', label: 'No Internet' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedState(tab.id)}
            className={`px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedState === tab.id
                ? 'bg-[#0B0B0C] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active State Container */}
      <div className="p-4 sm:p-6 bg-slate-50/60 rounded-3xl border border-slate-200/80 min-h-[400px]">
        {selectedState === 'zenith-batch1' && (
          <div className="w-full space-y-12">
            {/* 1. Skeleton System (Image 1 reference) */}
            <section className="space-y-4">
              <div className="border-b border-[#E5E7EB] pb-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#0047AB]/10 text-[#0047AB]">
                  Reference Image 1
                </span>
                <h2 className="text-lg font-bold text-[#0B0B0F] mt-1">Skeleton System (Zero-CLS & Exact Tokens)</h2>
                <p className="text-xs text-[#6B7280]">
                  Dark title bar (#0B0B0F), 2px cobalt rule (#0047AB), two soft gray wells (#F5F6FA), and cobalt highlight row (#EEF4FD) with 1.6s white sweep.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-[#4B5563] mb-2">Skeleton Card (Image 1 Target)</h3>
                  <SkeletonCard />
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-[#4B5563] mb-2">Individual Wells & Highlight Row</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SkeletonWell />
                    <SkeletonWell delayIndex={1} />
                  </div>
                  <SkeletonHighlightRow />
                  <SkeletonHighlightRow delayIndex={1} />
                </div>
              </div>
            </section>

            {/* 2. Workflow Stepper (Image 3 reference) */}
            <section className="space-y-4">
              <div className="border-b border-[#E5E7EB] pb-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#0047AB]/10 text-[#0047AB]">
                  Reference Image 3
                </span>
                <h2 className="text-lg font-bold text-[#0B0B0F] mt-1">Workflow Stepper & Action Bar</h2>
                <p className="text-xs text-[#6B7280]">
                  48px numbered circles, 4px cobalt line (#0047AB), semantic green check "Done" on completion, rounded 12px Action Bar with status & action pill.
                </p>
              </div>

              <div className="p-6 bg-white rounded-[20px] border border-[#E5E7EB] shadow-xs space-y-8">
                {/* Mid-progress Stepper */}
                <div>
                  <h3 className="text-xs font-semibold text-[#4B5563] mb-4">In-Progress Lifecycle (Step 2 of 4)</h3>
                  <Workflow
                    steps={[
                      { id: 1, label: 'Connect Wallet', caption: 'MetaMask / Coinbase' },
                      { id: 2, label: 'Deposit Escrow', caption: 'Polygon POL / USDC' },
                      { id: 3, label: 'Review Milestones', caption: 'Preview deliverables' },
                      { id: 4, label: 'Release Payment', caption: 'Soulbound SBT minted', isFinal: true },
                    ]}
                    currentIndex={1}
                    status="Escrow funded with 250 POL. Freelancer currently working on Milestone 1."
                    actions={[
                      { label: 'Submit Milestone', onClick: () => alert('Milestone action triggered') },
                    ]}
                  />
                </div>

                {/* Completed Stepper */}
                <div className="pt-6 border-t border-[#F3F4F6]">
                  <h3 className="text-xs font-semibold text-[#4B5563] mb-4">Completed Lifecycle (Done)</h3>
                  <Workflow
                    steps={[
                      { id: 1, label: 'Connect Wallet' },
                      { id: 2, label: 'Deposit Escrow' },
                      { id: 3, label: 'Review Milestones' },
                      { id: 4, label: 'Release Payment', isFinal: true },
                    ]}
                    currentIndex={4}
                    status="Job completed and verified on Polygon. SBT certificate minted."
                    actions={[
                      { label: 'View Certificate', onClick: () => setIsArrivalModalOpen(true) },
                    ]}
                  />
                </div>
              </div>
            </section>

            {/* 3. Completion Badge (Image 2 reference) */}
            <section className="space-y-4">
              <div className="border-b border-[#E5E7EB] pb-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#0047AB]/10 text-[#0047AB]">
                    Reference Image 2
                  </span>
                  <h2 className="text-lg font-bold text-[#0B0B0F] mt-1">Soulbound Certificate Badge (SBT)</h2>
                  <p className="text-xs text-[#6B7280]">
                    1000x1000 square card, circular badge with verified seal, title bar, semantic green chip "Verified on-chain", PL-SBT #id, max 6deg hover tilt.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsArrivalModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-[#0047AB] text-white text-xs font-semibold hover:bg-[#00388A] transition-colors"
                >
                  Simulate Badge Arrival Modal
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center">
                <CertificateBadge
                  onchainTokenId={7108}
                  variant="work"
                  jobTitle="Zero-Knowledge Escrow Architecture"
                  recipientName="Alice Engineer"
                  amount="250"
                  tokenSymbol="POL"
                  completedAt={1729000000000}
                />
                <CertificateBadge
                  onchainTokenId={9805}
                  variant="patronage"
                  jobTitle="PolyLance Open Source Developer Grant"
                  recipientName="Bob Creator"
                  amount="1000"
                  tokenSymbol="USDC"
                  completedAt={1729000000000}
                />
              </div>
            </section>

            {/* Arrival Modal */}
            <BadgeArrivalModal
              isOpen={isArrivalModalOpen}
              onClose={() => setIsArrivalModalOpen(false)}
              certificate={{
                onchainTokenId: 7108,
                variant: 'work',
                jobTitle: 'Zero-Knowledge Escrow Architecture',
                recipientName: 'Alice Engineer',
                amount: '250',
                tokenSymbol: 'POL',
              }}
            />
          </div>
        )}

        {selectedState === 'skeletons' && (
          <div className="w-full max-w-md space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400">Zero-CLS Skeleton Variants</h3>
            
            {/* Card Skeleton */}
            <Skeleton variant="card" />

            {/* Stat Skeletons */}
            <div className="grid grid-cols-2 gap-3">
              <Skeleton variant="stat" />
              <Skeleton variant="stat" />
            </div>

            {/* Text and Avatar Skeletons */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton variant="avatar" className="w-10 h-10" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton variant="text" className="w-1/3 h-4" />
                  <Skeleton variant="text" className="w-2/3 h-3" />
                </div>
              </div>
              <Skeleton.Bar width="100%" height={12} />
              <Skeleton.Bar width="90%" height={12} delayIndex={1} />
              <Skeleton.Bar width="65%" height={12} delayIndex={2} />
              <div className="pt-2 flex justify-end">
                <Skeleton variant="button" className="w-24 h-10" />
              </div>
            </div>
          </div>
        )}

        {selectedState === 'empty' && (
          <EmptyState
            title="No Active Smart Contracts"
            description="You don't have any ongoing freelancer contracts yet. Browse open jobs to submit a proposal."
            actionText="Find Jobs Marketplace"
            onAction={() => alert('Navigating to marketplace...')}
          />
        )}

        {selectedState === 'loading' && (
          <LoadingState
            title="Querying Polygon Mainnet"
            description="Reading smart escrow state and Soulbound SBT credentials from RPC node..."
          />
        )}

        {selectedState === 'error' && (
          <ErrorState
            title="RPC Node Synchronization Error"
            description="The Polygon RPC endpoint returned a 504 Gateway Timeout. Your transaction is unaffected."
            onRetry={() => alert('Retrying RPC connection...')}
            onDashboard={() => alert('Returning to dashboard...')}
          />
        )}

        {selectedState === 'no-results' && (
          <NoSearchResultState
            title="No Matching Jobs Found"
            description="No smart contract escrows match your current search query or filter tags."
            onClear={() => alert('Filters cleared')}
          />
        )}

        {selectedState === 'forbidden' && (
          <PermissionDeniedState
            title="Arbitrator Authorization Required"
            description="Only accredited DAO Judges with signed ECDSA arbitrator credentials can access this panel."
            onBack={() => alert('Going back...')}
          />
        )}

        {selectedState === 'slow-network' && (
          <SlowNetworkState
            title="Polygon RPC Congestion Detected"
            description="Blocks are currently processing slowly on Polygon Mainnet. Transaction propagation may take an extra moment."
            onContinue={() => alert('Continuing anyway...')}
          />
        )}

        {selectedState === 'offline' && (
          <NoInternetState
            title="Internet Connection Offline"
            description="Your device is currently disconnected. Web3 operations require an active network connection."
            onRetry={() => alert('Checking connection...')}
          />
        )}
      </div>
    </div>
  );
};
