import { describe, it, expect } from 'vitest';
import { formatAmount, formatFiat, formatTokenAmount, toBaseUnits } from '../formatAmount';

describe('formatAmount Unit Tests', () => {
  it('formats POL balance with up to 4 decimals and thousands separators', () => {
    // 17.993800027522881126 POL
    const rawPol = 17993800027522881126n;
    const result = formatAmount(rawPol, 'POL', { isBalance: true });

    expect(result.formatted).toBe('17.9938');
    expect(result.symbol).toBe('POL');
    expect(result.displayWithSymbol).toBe('17.9938\u202FPOL');
    expect(result.fullPrecision).toBe('17.993800027522881126');
  });

  it('strictly truncates balances so displayed balance never exceeds owned funds', () => {
    // 1.999999 POL
    const rawNearTwo = 1999999000000000000n;
    const result = formatAmount(rawNearTwo, 'POL', { isBalance: true });

    // Truncates to 4 decimals, must NOT round up to 2.0000
    expect(result.formatted).toBe('1.9999');
  });

  it('formats whole numbers with at least 2 decimals', () => {
    const rawTen = 10000000000000000000n;
    const result = formatAmount(rawTen, 'POL');

    expect(result.formatted).toBe('10.00');
  });

  it('formats 1500 USDC budget and fee amounts with exact 2 decimals and thousands separator', () => {
    const budgetRaw = 1500000000n; // 1500 USDC (6 decimals)
    const clientFeeRaw = 37500000n; // 37.5 USDC
    const depositRaw = 1537500000n; // 1537.5 USDC
    const netRaw = 1462500000n; // 1462.5 USDC

    expect(formatAmount(budgetRaw, 'USDC').formatted).toBe('1,500.00');
    expect(formatAmount(clientFeeRaw, 'USDC').formatted).toBe('37.50');
    expect(formatAmount(depositRaw, 'USDC').formatted).toBe('1,537.50');
    expect(formatAmount(netRaw, 'USDC').formatted).toBe('1,462.50');
  });

  it('displays sub-cent USDC amounts up to 6 decimals when smaller than 0.01', () => {
    const microUsdc = 4213n; // 0.004213 USDC
    const result = formatAmount(microUsdc, 'USDC');

    expect(result.formatted).toBe('0.004213');
  });

  it('displays tiny dust amounts as < 0.0001', () => {
    const tinyDust = 50000000000n; // 0.00000005 POL
    const result = formatAmount(tinyDust, 'POL');

    expect(result.formatted).toBe('< 0.0001');
    expect(result.isTiny).toBe(true);
  });

  it('formats negative numbers correctly for deductions', () => {
    const deduction = -37500000n; // -37.50 USDC
    const result = formatAmount(deduction, 'USDC');

    expect(result.formatted).toBe('-37.50');
    expect(result.displayWithSymbol).toBe('-37.50\u202FUSDC');
  });

  it('normalizes MATIC symbol to POL', () => {
    const result = formatAmount(1000000000000000000n, 'MATIC');
    expect(result.symbol).toBe('POL');
  });

  it('formats fiat with currency symbol and without crypto token symbols', () => {
    const fiatUsd = formatFiat(1500, 'USD');
    expect(fiatUsd).toBe('≈ $1,500.00');
    expect(fiatUsd.includes('POL')).toBe(false);
    expect(fiatUsd.includes('USDC')).toBe(false);

    const fiatInr = formatFiat(122850, 'INR');
    expect(fiatInr).toContain('₹');
    expect(fiatInr.includes('POL')).toBe(false);
  });
});
