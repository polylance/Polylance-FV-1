import React, { useState } from 'react';
import { Skeleton } from '../components/mobile/Skeleton';
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
  const [selectedState, setSelectedState] = useState<string>('skeletons');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 font-sans">
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
          { id: 'skeletons', label: 'Skeletons' },
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
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active State Container */}
      <div className="p-4 sm:p-6 bg-slate-50/60 rounded-3xl border border-slate-200/80 min-h-[400px] flex items-center justify-center">
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
              <Skeleton variant="text" lines={3} />
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
