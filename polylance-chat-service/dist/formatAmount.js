import { ethers } from 'ethers';
/**
 * Standard token decimals configuration
 */
export const TOKEN_DECIMALS = {
    POL: 18,
    MATIC: 18,
    USDC: 6,
    USDT: 6,
    ETH: 18,
    WETH: 18,
    DAI: 18,
};
export function normalizeSymbol(token) {
    const clean = (token || 'POL').trim().toUpperCase();
    if (clean === 'MATIC')
        return 'POL';
    return clean;
}
export function getTokenDecimals(token) {
    const sym = normalizeSymbol(token);
    return TOKEN_DECIMALS[sym] ?? 18;
}
/**
 * Converts any raw input (bigint, wei string, decimal string, or number) into bigint base units.
 */
export function toBaseUnits(value, decimals) {
    if (value === undefined || value === null)
        return 0n;
    if (typeof value === 'bigint')
        return value;
    const str = String(value).trim().replace(/,/g, '');
    if (!str || str === '0')
        return 0n;
    // If input contains no decimal point and is purely digits or negative digits, treat as base units (wei / atomic)
    // EXCEPT if it looks like a small integer intended as a token count (e.g. from UI input like "1500" where parseUnits is expected).
    // To disambiguate:
    // If typeof input is number or str has a decimal point, parse with ethers.parseUnits.
    if (typeof value === 'number' || str.includes('.')) {
        try {
            // Clean string to max allowed decimal digits before parseUnits to avoid fractional underflow errors
            const [intPart, fracPart = ''] = str.split('.');
            const cleanInt = intPart || '0';
            const cleanFrac = fracPart.slice(0, decimals);
            const cleanDecStr = cleanFrac.length > 0 ? `${cleanInt}.${cleanFrac}` : cleanInt;
            return ethers.parseUnits(cleanDecStr, decimals);
        }
        catch {
            return 0n;
        }
    }
    // Pure integer string: check if it's already an atomic unit (e.g. length > 10 for 18-dec)
    // If it's a huge integer string (e.g. 17993800027522881126), it's already in base units
    try {
        const rawBn = BigInt(str);
        // If decimals is 18 and length <= 6, or decimals is 6 and length <= 4, user likely passed nominal integer e.g. "1500"
        if (decimals === 18 && str.length <= 6) {
            return ethers.parseUnits(str, decimals);
        }
        if (decimals === 6 && str.length <= 4) {
            return ethers.parseUnits(str, decimals);
        }
        return rawBn;
    }
    catch {
        return 0n;
    }
}
/**
 * Core pure function for formatting crypto token amounts:
 * - POL: up to 4 decimals, trimmed to min 2 (e.g. 17.9938 POL, 1.50 POL).
 * - USDC/USDT: 2 decimals normally (1,500.00 USDC), or up to 6 decimals if < 0.01.
 * - Tiny amounts: < 0.0001
 * - Balances: strictly truncated, never rounded up
 * - Thousands separators included
 */
export function formatAmount(raw, token = 'POL', options = {}) {
    const sym = normalizeSymbol(token);
    const decimals = options.decimals ?? getTokenDecimals(sym);
    const isBalance = options.isBalance ?? false;
    let baseUnits = 0n;
    if (typeof raw === 'bigint') {
        baseUnits = raw;
    }
    else {
        baseUnits = toBaseUnits(raw, decimals);
    }
    const isNegative = baseUnits < 0n;
    const absUnits = isNegative ? -baseUnits : baseUnits;
    // Convert to full precision string without scientific notation
    const divisor = 10n ** BigInt(decimals);
    const wholeUnits = absUnits / divisor;
    const remainder = absUnits % divisor;
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const fullPrecision = `${isNegative ? '-' : ''}${wholeUnits.toString()}.${remainderStr}`;
    // Check for tiny amount (< 0.0001)
    const tinyThreshold = 10n ** BigInt(Math.max(0, decimals - 4)); // e.g. for 18 dec: 10^14 = 0.0001
    const isTiny = absUnits > 0n && absUnits < tinyThreshold;
    // Determine target decimal precision
    let minDec = options.minDecimals;
    let maxDec = options.maxDecimals;
    if (maxDec === undefined) {
        if (sym === 'USDC' || sym === 'USDT') {
            // For dollar-pegged stablecoins, use 2 decimals normally, or up to 6 decimals if < 0.01
            if (wholeUnits === 0n && remainder < 10n ** BigInt(decimals - 2) && remainder > 0n) {
                maxDec = 6;
                minDec = minDec ?? 2;
            }
            else {
                maxDec = 2;
                minDec = minDec ?? 2;
            }
        }
        else {
            // POL / ETH / other native tokens: up to 4 decimals, min 2 decimals
            maxDec = 4;
            minDec = minDec ?? 2;
        }
    }
    if (minDec === undefined) {
        minDec = Math.min(2, maxDec);
    }
    let formattedFraction = '';
    if (isBalance) {
        // TRUNCATION (floor) for balances: take the first maxDec characters of remainderStr
        const truncatedFrac = remainderStr.slice(0, maxDec);
        // Trim trailing zeros but keep at least minDec
        let trimmed = truncatedFrac;
        while (trimmed.length > minDec && trimmed.endsWith('0')) {
            trimmed = trimmed.slice(0, -1);
        }
        // Pad to minDec if needed
        while (trimmed.length < minDec) {
            trimmed += '0';
        }
        formattedFraction = trimmed;
    }
    else {
        // Normal display rounding/truncating
        const targetDivisor = 10n ** BigInt(Math.max(0, decimals - maxDec));
        const roundedRemainder = targetDivisor > 0n ? remainder / targetDivisor : remainder;
        let roundedFracStr = roundedRemainder.toString().padStart(maxDec, '0').slice(0, maxDec);
        let trimmed = roundedFracStr;
        while (trimmed.length > minDec && trimmed.endsWith('0')) {
            trimmed = trimmed.slice(0, -1);
        }
        while (trimmed.length < minDec) {
            trimmed += '0';
        }
        formattedFraction = trimmed;
    }
    // Format whole part with thousands separators
    const wholeFormatted = wholeUnits.toLocaleString('en-US');
    let formatted = '';
    if (isTiny) {
        formatted = '< 0.0001';
    }
    else if (formattedFraction.length > 0) {
        formatted = `${wholeFormatted}.${formattedFraction}`;
    }
    else {
        formatted = wholeFormatted;
    }
    if (isNegative && !isTiny) {
        formatted = `-${formatted}`;
    }
    const thinSpace = '\u202F'; // Narrow non-breaking space
    const displayWithSymbol = options.symbolPosition === 'before'
        ? `${sym}${thinSpace}${formatted}`
        : `${formatted}${thinSpace}${sym}`;
    return {
        formatted,
        fullPrecision,
        symbol: sym,
        displayWithSymbol,
        isTiny,
        rawBigInt: baseUnits,
    };
}
/**
 * Convenience helper returning just the formatted string with symbol.
 */
export function formatTokenAmount(raw, token = 'POL', options) {
    return formatAmount(raw, token, options).displayWithSymbol;
}
/**
 * Format fiat amounts as a separate line.
 * Rule: Token amounts NEVER carry '$' and fiat NEVER carries token symbols.
 */
export function formatFiat(fiatAmount, fiatCode = 'USD') {
    if (fiatAmount === undefined || fiatAmount === null)
        return '';
    const val = typeof fiatAmount === 'number' ? fiatAmount : parseFloat(String(fiatAmount).replace(/[^0-9.-]/g, '')) || 0;
    try {
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: fiatCode.toUpperCase(),
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);
        return `≈ ${formatted}`;
    }
    catch {
        return `≈ $${val.toFixed(2)}`;
    }
}
