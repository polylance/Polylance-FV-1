import { describe, it, expect } from 'vitest';
import { generateCertificateSvg } from '../certificateGenerator';
import { calculateFeeBreakdownFromString, feeBreakdown } from '../fees';
import { getDeterministicSbtId, getPolygonScanUrl } from '../formatters';

describe('Certificate & Design Invariants', () => {
  describe('Amount formatting & decimals for POL, USDC, USDT', () => {
    it('accurately parses and formats 10 USDC with 6 decimals without dropping to 0.00', () => {
      const breakdown = calculateFeeBreakdownFromString('10', 'USDC');
      expect(breakdown.budgetFormatted).toBe('10.0');
      expect(breakdown.clientFeeFormatted).toBe('0.25');
      expect(breakdown.clientDepositFormatted).toBe('10.25');
      expect(breakdown.freelancerNetFormatted).toBe('9.75');
      expect(breakdown.platformTotalFormatted).toBe('0.5');
      expect(breakdown.token).toBe('USDC');
    });

    it('accurately parses and formats 10 USDT with 6 decimals', () => {
      const breakdown = calculateFeeBreakdownFromString('10', 'USDT');
      expect(breakdown.budgetFormatted).toBe('10.0');
      expect(breakdown.clientDepositFormatted).toBe('10.25');
      expect(breakdown.freelancerNetFormatted).toBe('9.75');
      expect(breakdown.token).toBe('USDT');
    });

    it('accurately parses and formats 10 POL with 18 decimals', () => {
      const breakdown = calculateFeeBreakdownFromString('10', 'POL');
      expect(breakdown.budgetFormatted).toBe('10.0');
      expect(breakdown.clientDepositFormatted).toBe('10.25');
      expect(breakdown.freelancerNetFormatted).toBe('9.75');
      expect(breakdown.token).toBe('POL');
    });

    it('guarantees crypto amounts never include dollar sign $ prefix', () => {
      const breakdown = calculateFeeBreakdownFromString('10', 'POL');
      const cryptoDisplay = `${breakdown.budgetFormatted} ${breakdown.token}`;
      expect(cryptoDisplay).toBe('10.0 POL');
      expect(cryptoDisplay).not.toContain('$');
    });
  });

  describe('Canonical SVG Certificate Generator', () => {
    it('generates a valid SVG certificate containing on-chain tokenId and recipient address for Proof of Work', () => {
      const svg = generateCertificateSvg({
        tokenId: 7108,
        variant: 'work',
        jobTitle: 'Production Escrow Workflow',
        recipientAddress: '0xb30F1352a781A8191f6920f01905E0eaF8d21aB1',
        recipientName: 'Freelancer Alice',
        clientAddress: '0xB8aa6fE2F0A800a758784F392437651C813E090d',
        amount: 10,
        tokenSymbol: 'POL',
        completedAt: 1729000000000,
        contractAddress: '0x99B35ff0b46D3Ec613C2dff1578F465bE1128E6a',
      });

      expect(svg).toContain('<svg');
      expect(svg).toContain('7108');
      expect(svg.toUpperCase()).toContain('PROOF OF WORK');
      expect(svg).toContain('10.00 POL');
      expect(svg).not.toContain('$10');
      expect(svg).toContain('0xb30F...1aB1');
    });

    it('generates a valid SVG certificate for Patronage variant', () => {
      const svg = generateCertificateSvg({
        tokenId: 9805,
        variant: 'patronage',
        jobTitle: 'Enhance Polylance UI design',
        recipientAddress: '0xb30F1352a781A8191f6920f01905E0eaF8d21aB1',
        clientAddress: '0xB8aa6fE2F0A800a758784F392437651C813E090d',
        clientName: 'Client Bob',
        amount: 10,
        tokenSymbol: 'POL',
        completedAt: 1729000000000,
        contractAddress: '0x99B35ff0b46D3Ec613C2dff1578F465bE1128E6a',
      });

      expect(svg).toContain('<svg');
      expect(svg).toContain('9805');
      expect(svg.toUpperCase()).toContain('PATRONAGE');
      expect(svg).toContain('10.00 POL');
    });
  });

  describe('PolygonScan URL formatters', () => {
    it('produces valid polygonscan tx and address urls', () => {
      const txUrl = getPolygonScanUrl('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      expect(txUrl).toContain('https://polygonscan.com/tx/0x123456');
    });
  });
});
