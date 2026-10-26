import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Copy & CI Sanity Audit', () => {
  const frontendSrcDir = path.resolve(__dirname, '../../');

  it('ensures no occurrence of "Dollar Escrow" exists in source code', () => {
    const dashboardPath = path.join(frontendSrcDir, 'pages/Dashboard.tsx');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    expect(content.includes('Dollar Escrow')).toBe(false);
  });

  it('ensures no occurrence of static "Smart contract settled" exists in FeeBreakdown.tsx', () => {
    const feeBreakdownPath = path.join(frontendSrcDir, 'components/common/FeeBreakdown.tsx');
    const content = fs.readFileSync(feeBreakdownPath, 'utf8');

    // Must not have the hardcoded static string
    expect(content.includes('<span className="text-xs text-[#0047AB] font-medium">Smart contract settled</span>')).toBe(false);
  });

  it('ensures no occurrence of static hardcoded network gas "~0.005 – 0.015 POL" exists in FeeBreakdown.tsx or FundEscrowModal.tsx', () => {
    const feeBreakdownPath = path.join(frontendSrcDir, 'components/common/FeeBreakdown.tsx');
    const feeContent = fs.readFileSync(feeBreakdownPath, 'utf8');
    expect(feeContent.includes('~0.005 – 0.015 POL')).toBe(false);

    const fundModalPath = path.join(frontendSrcDir, 'components/FundEscrowModal.tsx');
    const modalContent = fs.readFileSync(fundModalPath, 'utf8');
    expect(modalContent.includes('~0.005 – 0.015 POL')).toBe(false);
  });

  it('ensures no banned phrases like "completely safe" or "guaranteed profit" exist in core payment components', () => {
    const feeBreakdownPath = path.join(frontendSrcDir, 'components/common/FeeBreakdown.tsx');
    const content = fs.readFileSync(feeBreakdownPath, 'utf8').toLowerCase();

    expect(content.includes('completely safe')).toBe(false);
    expect(content.includes('guaranteed')).toBe(false);
  });

  it('ensures Escrow funding account card in Dashboard.tsx does not use grid-cols-2 for balances without min-w-0', () => {
    const dashboardPath = path.join(frontendSrcDir, 'pages/Dashboard.tsx');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    // Should not contain the un-truncated overflowing layout
    expect(content.includes('grid grid-cols-2 gap-2 bg-[#F6F7F9] p-3 rounded-[8px] border border-[#E5E7EB]')).toBe(false);
  });
});
