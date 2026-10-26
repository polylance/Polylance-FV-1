import React from 'react';
import { motion } from 'motion/react';
import { 
  EyeOff, Key, Database, MessageSquare, Sparkles, CheckCircle2, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';

import { PageHeader } from '../components/layout/PageHeader';

export const Privacy: React.FC = () => {
  return (
    <PageContainer size="wide" className="py-8 space-y-8 text-[#0B0B0F]">
      {/* Clean Modern Header */}
      <div className="text-left space-y-3">
        <PageHeader
          title="Privacy Policy & Data Control"
          subtitle="PolyLance is designed ground-up for zero personal data collection. Your identity is defined strictly by your public wallet address and on-chain soulbound achievements."
        />
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#6B7280]">
          <span className="bg-[#EAF1FB] text-[#0047AB] px-2.5 py-1 rounded-md border border-[#0047AB]/20 font-medium">
            Personal data collected: 0 bytes
          </span>
          <span className="bg-[#F6F7F9] text-[#374151] px-2.5 py-1 rounded-md border border-[#E5E7EB] font-medium">
            Chat transport: XMTP encrypted
          </span>
          <span className="bg-[#F6F7F9] text-[#374151] px-2.5 py-1 rounded-md border border-[#E5E7EB] font-medium">
            Artifacts: Content-addressed IPFS
          </span>
        </div>
      </div>

      {/* Main Grid: Reading Column (left) + Trust Rail (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 4 Pillars Inset Grouped Card */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs divide-y divide-[#E5E7EB] text-left overflow-hidden">
            {/* Pillar 1: Zero PII */}
            <div className="p-6 sm:p-7 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F6F7F9] border border-[#E5E7EB] text-[#0047AB] flex items-center justify-center shrink-0">
                  <EyeOff size={16} />
                </div>
                <h3 className="text-base font-semibold text-[#0B0B0F]">
                  1. Zero personal data collection
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed font-normal">
                We do not request, process, or store real names, email addresses, phone numbers, passport documents, or credit card details.
              </p>
              <ul className="space-y-1.5 text-xs text-[#6B7280] pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#0047AB]" /> No signup forms or passwords
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#0047AB]" /> No tracking cookies or invasive ad pixels
                </li>
              </ul>
            </div>

            {/* Pillar 2: On-Chain Public Keys */}
            <div className="p-6 sm:p-7 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F6F7F9] border border-[#E5E7EB] text-[#0047AB] flex items-center justify-center shrink-0">
                  <Key size={16} />
                </div>
                <h3 className="text-base font-semibold text-[#0B0B0F]">
                  2. Public key anonymity & ledger transparency
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed font-normal">
                Your transactions, job postings, and Soulbound Tokens are publicly visible on the Polygon ledger under your wallet address.
              </p>
              <ul className="space-y-1.5 text-xs text-[#6B7280] pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#0047AB]" /> Pseudonymous public key identity
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#0047AB]" /> Verifiable on Polygonscan
                </li>
              </ul>
            </div>

            {/* Pillar 3: Encrypted Communication */}
            <div id="messaging-privacy" className="p-6 sm:p-7 space-y-2.5 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F6F7F9] border border-[#E5E7EB] text-[#0047AB] flex items-center justify-center shrink-0">
                  <MessageSquare size={16} />
                </div>
                <h3 className="text-base font-semibold text-[#0B0B0F]">
                  3. End-to-end encrypted communication
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed font-normal">
                Negotiations and project chats are encrypted end-to-end via XMTP. Only the wallet private keys of the project Client and Developer can decrypt message history.
              </p>
              <ul className="space-y-1.5 text-xs text-[#6B7280] pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#0047AB]" /> Decentralized P2P message storage
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#0047AB]" /> Cannot be read by protocol relayers
                </li>
              </ul>
            </div>

            {/* Pillar 4: IPFS Hashes */}
            <div className="p-6 sm:p-7 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F6F7F9] border border-[#E5E7EB] text-[#0047AB] flex items-center justify-center shrink-0">
                  <Database size={16} />
                </div>
                <h3 className="text-base font-semibold text-[#0B0B0F]">
                  4. Content storage via decentralized IPFS
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed font-normal">
                Job descriptions, milestone deliverables, and dispute claims are stored as content-addressed hashes (CIDs) pinned to IPFS networks.
              </p>
              <ul className="space-y-1.5 text-xs text-[#6B7280] pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#0047AB]" /> Immutable CID hashes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#0047AB]" /> Decentralized IPFS storage
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Rail: Protocol Guarantees & Escrow Terms */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Dark Band (High Contrast) */}
          <div className="bg-[#0B0B0F] text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm text-left space-y-6">
            <div className="space-y-3 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Privacy health guarantee</h3>
                  <p className="text-xs text-slate-400">Self-sovereign identity standard</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                PolyLance has no central database containing sensitive customer information. All rules execute trustlessly on Polygon Mainnet.
              </p>
              <Link
                to="/terms"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7FA3DB] hover:text-white transition-colors"
              >
                <span>Read escrow terms</span>
                <span>→</span>
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                <span className="text-slate-400 text-[11px] block font-medium">Data retention</span>
                <span className="text-white font-semibold text-sm block">0 days (non-custodial)</span>
              </div>
              <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                <span className="text-slate-400 text-[11px] block font-medium">Third party sharing</span>
                <span className="text-white font-semibold text-sm block">Never (no trackers)</span>
              </div>
              <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                <span className="text-slate-400 text-[11px] block font-medium">User control</span>
                <span className="text-white font-semibold text-sm block">100% private key owned</span>
              </div>
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs text-left space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B0B0F]">Protocol Resources</h4>
            <div className="space-y-2 text-xs">
              <Link to="/auditx" className="flex items-center justify-between text-[#4B5563] hover:text-[#0047AB] p-2 rounded-lg hover:bg-[#F6F7F9] transition-colors">
                <span className="font-medium">AuditX Security Engine</span>
                <span className="text-[11px] text-[#0047AB]">View audits →</span>
              </Link>
              <Link to="/fees" className="flex items-center justify-between text-[#4B5563] hover:text-[#0047AB] p-2 rounded-lg hover:bg-[#F6F7F9] transition-colors">
                <span className="font-medium">On-Chain Fee Schedule</span>
                <span className="text-[11px] text-[#0047AB]">2.5% flat →</span>
              </Link>
              <Link to="/faq" className="flex items-center justify-between text-[#4B5563] hover:text-[#0047AB] p-2 rounded-lg hover:bg-[#F6F7F9] transition-colors">
                <span className="font-medium">Knowledge Base & FAQ</span>
                <span className="text-[11px] text-[#0047AB]">10 categories →</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
};

export default Privacy;
