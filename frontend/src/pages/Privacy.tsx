import React from 'react';
import { motion } from 'motion/react';
import { 
  EyeOff, Key, Database, MessageSquare, Sparkles, CheckCircle2, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';

export const Privacy: React.FC = () => {
  return (
    <PageContainer className="py-8 space-y-10 text-[#0B0B0F]">
      {/* Clean Modern Header with 720px column */}
      <div className="max-w-[720px] mx-auto text-left space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F6F7F9] border border-[#E5E7EB] text-[#374151] rounded-full text-xs font-medium">
          <Sparkles size={13} className="text-[#0047AB]" />
          <span>Decentralized data sovereignty</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B0B0F] tracking-tight leading-tight">
          Privacy Policy & <span className="text-[#0047AB]">Data Control</span>
        </h1>

        <p className="text-sm text-[#4B5563] leading-relaxed font-normal">
          PolyLance is designed ground-up for zero personal data collection. Your identity is defined strictly by your public wallet address and on-chain soulbound achievements.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#6B7280]">
          <span className="bg-[#EAF1FB] text-[#0047AB] px-3 py-1 rounded-lg border border-[#0047AB]/20 font-medium">
            Personal data collected: 0 bytes
          </span>
          <span className="bg-[#F6F7F9] text-[#374151] px-3 py-1 rounded-lg border border-[#E5E7EB] font-medium">
            Chat transport: XMTP encrypted
          </span>
        </div>
      </div>

      {/* 4 Pillars Grid (720px reading column) */}
      <div className="max-w-[720px] mx-auto space-y-4 text-left">
        {/* Pillar 1: Zero PII */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-3 transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] text-[#0047AB] flex items-center justify-center shrink-0">
            <EyeOff size={20} />
          </div>
          <h3 className="text-lg font-bold text-[#0B0B0F]">
            1. Zero personal data collection
          </h3>
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
        </motion.div>

        {/* Pillar 2: On-Chain Public Keys */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-3 transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] text-[#0047AB] flex items-center justify-center shrink-0">
            <Key size={20} />
          </div>
          <h3 className="text-lg font-bold text-[#0B0B0F]">
            2. Public key anonymity & ledger transparency
          </h3>
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
        </motion.div>

        {/* Pillar 3: XMTP Messaging */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-3 transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] text-[#0047AB] flex items-center justify-center shrink-0">
            <MessageSquare size={20} />
          </div>
          <h3 className="text-lg font-bold text-[#0B0B0F]">
            3. End-to-end encrypted communication
          </h3>
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
        </motion.div>

        {/* Pillar 4: IPFS Hashes */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-3 transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] text-[#0047AB] flex items-center justify-center shrink-0">
            <Database size={20} />
          </div>
          <h3 className="text-lg font-bold text-[#0B0B0F]">
            4. Content storage via decentralized IPFS
          </h3>
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
        </motion.div>
      </div>

      {/* Dark Band (Single, Readable, High Contrast) */}
      <div className="max-w-[720px] mx-auto bg-[#0B0B0F] text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm text-left space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Privacy health guarantee</h3>
              <p className="text-xs text-slate-400">Self-sovereign cryptographic identity standard</p>
            </div>
          </div>
          <Link to="/terms" className="px-3.5 py-2 bg-[#0047AB] hover:bg-[#003B8E] text-white rounded-xl text-xs font-semibold transition-colors self-start sm:self-auto">
            Read escrow terms →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
    </PageContainer>
  );
};

export default Privacy;
