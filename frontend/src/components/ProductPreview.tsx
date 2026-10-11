import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  ArrowRight, 
  Lock, 
  Scale, 
  ExternalLink,
  DollarSign,
  UserCheck,
  Award
} from 'lucide-react';
import { DeviceFrame } from './video/DeviceFrame';
import { PolygonIcon } from './TokenIcon';

export type ProductPreviewVariant = 'hero' | 'hire' | 'work' | 'paid' | 'safe';

interface ProductPreviewProps {
  variant: ProductPreviewVariant;
  className?: string;
}

/**
 * <ProductPreview>
 * Realistic UI preview component built with real design-system components.
 * Displayed when video is missing or in progress.
 * All sample data is labeled with a clear "Sample" badge.
 * Animates once using native CSS transforms/opacity (no infinite loop).
 */
export const ProductPreview: React.FC<ProductPreviewProps> = ({ variant, className = '' }) => {
  return (
    <DeviceFrame 
      title={`PolyLance Preview — ${variant.toUpperCase()}`}
      className={className}
    >
      <div className="p-4 sm:p-5 bg-white text-left font-sans select-none min-h-[280px] sm:min-h-[320px] flex flex-col justify-between">
        
        {/* Top Sample indicator bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0047AB]" />
            <span className="text-xs font-semibold text-[#0B0B0F]">
              {variant === 'hero' && 'Milestone Escrow Vault'}
              {variant === 'hire' && 'Configure Milestone Escrow'}
              {variant === 'work' && 'Deliverable Verification'}
              {variant === 'paid' && 'Payment Release & Attestation'}
              {variant === 'safe' && 'Multi-Party Smart Contract Escrow'}
            </span>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
            Sample
          </span>
        </div>

        {/* Content Body Based on Variant */}
        <div className="py-4 my-auto">
          {variant === 'hero' && (
            <div className="space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-[#0B0B0F] tracking-tight">
                    Cross-Chain Liquidity Router UI
                  </h4>
                  <p className="text-xs text-[#4B5563] mt-0.5">
                    Client: 0x98A...4E1 • Freelancer: 0x3F2...8C9
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#E7EEF9] text-[#0047AB] text-xs font-semibold border border-[#D0DEF2] shrink-0">
                  <Lock size={12} />
                  <span>Escrow Funded</span>
                </span>
              </div>

              {/* Milestones list */}
              <div className="space-y-2 pt-1">
                <div className="p-2.5 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-[#047857]" />
                    <span className="text-xs font-medium text-[#0B0B0F]">M1: Architecture & Wireframes</span>
                  </div>
                  <span className="text-xs font-semibold text-[#0B0B0F] tabular-nums">750 POL • Released</span>
                </div>

                <div className="p-2.5 rounded-[8px] bg-white border-2 border-[#0047AB]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-[#0047AB]" />
                    <span className="text-xs font-semibold text-[#0B0B0F]">M2: Interactive Frontend & Tests</span>
                  </div>
                  <span className="text-xs font-semibold text-[#0047AB] tabular-nums">1,250 POL • In Review</span>
                </div>
              </div>

              {/* Total & Action row */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-[#4B5563]">Total Escrow: <strong className="text-[#0B0B0F] tabular-nums">2,000 POL</strong></span>
                <span className="inline-flex items-center gap-1 text-[#0047AB] font-semibold">
                  <span>Smart Contract 0x7D3...8A9</span>
                  <ExternalLink size={12} />
                </span>
              </div>
            </div>
          )}

          {variant === 'hire' && (
            <div className="space-y-3">
              <div className="p-3 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] space-y-2">
                <div className="text-xs font-semibold text-[#0B0B0F]">Step 1: Define Milestones & Budget</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-[#E5E7EB]">
                    <span className="text-[#6B7280] block text-[10px]">Milestone Amount</span>
                    <span className="font-semibold text-[#0B0B0F] tabular-nums">1,500 USDC</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-[#E5E7EB]">
                    <span className="text-[#6B7280] block text-[10px]">Platform Fee (2.5%)</span>
                    <span className="font-semibold text-[#0B0B0F] tabular-nums">37.50 USDC</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] text-xs">
                <div className="flex items-center gap-2 text-[#166534]">
                  <ShieldCheck size={16} />
                  <span>Deposit protected by Polygon smart contract</span>
                </div>
                <span className="font-semibold text-[#166534]">Ready</span>
              </div>
            </div>
          )}

          {variant === 'work' && (
            <div className="space-y-3">
              <div className="border border-[#E5E7EB] rounded-[8px] p-3 bg-[#F6F7F9] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#0B0B0F]">Deliverable Submission</span>
                  <span className="text-[#047857] font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> SHA-256 Verified
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-[#E5E7EB] font-mono text-[11px] text-[#4B5563] truncate">
                  commit: 9f8a3c2e71d4b65a0e9... (main branch)
                </div>
                <div className="text-[11px] text-[#4B5563]">
                  URL: <span className="text-[#0047AB] underline">https://staging.app-demo.dev</span>
                </div>
              </div>
              <p className="text-xs text-[#4B5563]">
                Client has 5 days to review deliverable before automatic dispute window opens.
              </p>
            </div>
          )}

          {variant === 'paid' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] text-center space-y-1.5">
                <div className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#166534] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={20} />
                </div>
                <div className="text-sm font-bold text-[#166534]">Payment Released to Wallet</div>
                <div className="text-xs text-[#166534]/90 tabular-nums">
                  1,218.75 POL transferred instantly (net of 2.5% fee)
                </div>
              </div>

              <div className="p-2.5 rounded-[8px] bg-[#FFFFFF] border border-[#E5E7EB] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Award size={15} className="text-[#0047AB]" />
                  <span className="font-medium text-[#0B0B0F]">Verified Work Certificate</span>
                </div>
                <span className="font-mono text-[#0047AB] text-[11px]">ERC-721 #4102</span>
              </div>
            </div>
          )}

          {variant === 'safe' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB]">
                  <span className="text-[10px] text-[#6B7280] block">Client</span>
                  <span className="font-semibold text-[#0B0B0F]">Funds Locked</span>
                </div>
                <div className="p-2 rounded-[8px] bg-[#E7EEF9] border border-[#D0DEF2] text-[#0047AB]">
                  <span className="text-[10px] text-[#0047AB] block">Contract Escrow</span>
                  <span className="font-bold">Autonomous</span>
                </div>
                <div className="p-2 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB]">
                  <span className="text-[10px] text-[#6B7280] block">Freelancer</span>
                  <span className="font-semibold text-[#0B0B0F]">Payment Safe</span>
                </div>
              </div>

              <div className="p-2.5 rounded-[8px] bg-white border border-[#E5E7EB] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Scale size={14} className="text-[#4B5563]" />
                  <span className="text-[#4B5563]">Dispute Arbitration Window</span>
                </div>
                <span className="font-medium text-[#0B0B0F]">Independent Review</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Ribbon */}
        <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
          <div className="flex items-center gap-1.5">
            <PolygonIcon size={13} className="text-[#0047AB]" />
            <span>Polygon Mainnet</span>
          </div>
          <span className="font-medium text-[#0047AB]">Verified On-Chain</span>
        </div>

      </div>
    </DeviceFrame>
  );
};
