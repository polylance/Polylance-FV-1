import React from 'react';
import {
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { SecurityShowcase } from '../escrow/SecurityShowcase';
import {
  AUDIT_STATUS,
} from '../../seo/site.config';

export const SafeByDesignSection: React.FC = () => {
  return (
    <section className="w-full bg-[#0B0B0F] text-white py-16 sm:py-20 lg:py-24 border-b border-black">
      <PageContainer noVerticalPadding>
        <div className="space-y-16">
          
          {/* Main Showcase (Interactive Video Stage + 3 Option Cards) */}
          <SecurityShowcase />

          {/* On-Chain Security Standards Checklist */}
          <div className="pt-10 border-t border-white/10 space-y-8 text-left">
            <div className="max-w-2xl space-y-2">
              <div className="text-eyebrow text-blue-400">Trust & Execution</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Autonomous Escrow Architecture on Polygon PoS.
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                PolyLance eliminates intermediary custody. Milestone deposits are locked in autonomous smart contract proxies and release directly to freelancer wallets upon approved deliverables.
              </p>
            </div>

            {/* Architecture Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-[16px] bg-white/[0.04] border border-white/10 space-y-2.5 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Isolated Proxies
                  </span>
                  <span className="text-[10px] text-blue-300 bg-blue-500/10 border border-blue-400/20 px-2 py-0.5 rounded-full font-mono">
                    EIP-1167
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Every accepted project receives its own dedicated minimal proxy clone, isolating contract storage and preventing cross-project contagion.
                </p>
              </div>

              <div className="p-5 rounded-[16px] bg-white/[0.04] border border-white/10 space-y-2.5 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Non-Custodial Escrow
                  </span>
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5 rounded-full font-mono">
                    Zero Custody
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Neither PolyLance nor any admin has keys or permissions to drain escrowed funds. Release is strictly autonomous upon client sign-off.
                </p>
              </div>

              <div className="p-5 rounded-[16px] bg-white/[0.04] border border-white/10 space-y-2.5 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Soulbound SBTs
                  </span>
                  <span className="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-400/20 px-2 py-0.5 rounded-full font-mono">
                    ERC-5192
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Reputation is earned, not purchased. Finished projects mint permanently locked SBT credentials that live forever in freelancer wallets.
                </p>
              </div>
            </div>

            {/* Audit Status Disclosure Banner */}
            <div className="p-4 rounded-[10px] bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-300">
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={16} className="text-amber-400 shrink-0" />
                <span>
                  Audit Status:{' '}
                  <strong className="text-white font-semibold">{AUDIT_STATUS.label}</strong>.
                  Smart contracts have undergone internal security hardening; third-party audit is currently pending.
                </span>
              </div>

              <a
                href={AUDIT_STATUS.url}
                className="text-blue-400 hover:underline font-semibold inline-flex items-center gap-1 shrink-0"
              >
                <span>Read security policy</span>
                <ExternalLink size={12} />
              </a>
            </div>

          </div>

        </div>
      </PageContainer>
    </section>
  );
};
