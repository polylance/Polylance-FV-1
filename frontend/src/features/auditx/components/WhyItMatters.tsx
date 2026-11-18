import React from 'react';
import { ShieldAlert, Zap, Clock, FileCheck } from 'lucide-react';

export const WhyItMatters: React.FC = () => {
  return (
    <section className="py-12 border-b border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-xl">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
            <h2>Why Smart Contract Verification Matters Before Escrow Release</h2>
          </div>

          <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed space-y-4">
            <p>
              Smart contracts on public blockchains like Polygon are immutable once deployed. Unlike traditional web applications where a faulty database migration or API bug can be patched with a hotfix, an unhandled reentrancy loop or unprotected administrative function in an escrow or payment splitter can lead to permanent, irreversible loss of funds.
            </p>
            <p>
              In freelance development, clients frequently lack the specialized security tooling required to review raw Solidity files delivered by contractors. Conversely, freelancers often work under tight milestone deadlines without access to comprehensive audit suites. AuditX bridges this gap by providing an objective, automated hygiene pass directly in the platform workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="text-xs font-bold text-slate-900 mb-1">Zero Rollbacks</div>
              <p className="text-[11px] text-slate-500 leading-normal">
                EVM state changes cannot be undone after finality. Code hygiene before release is non-negotiable.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="text-xs font-bold text-slate-900 mb-1">Escrow Safety</div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Ensure funds locked in milestone escrows flow strictly to authorized beneficiary wallets.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="text-xs font-bold text-slate-900 mb-1">Clear Audit Trail</div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Structured reports provide mutual clarity and eliminate disputes over code deliverable standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
