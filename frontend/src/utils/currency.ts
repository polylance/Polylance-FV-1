import { useState, useEffect } from 'react';

export interface FiatCurrency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateVsUsd: number; // Conversion factor: 1 USD = X Local Currency
}

export interface CryptoToken {
  id: 'USDC' | 'USDT' | 'POL';
  name: string;
  symbol: string;
  priceUsd: number; // 1 Token = X USD
  color: string;
  iconBg: string;
}

export const SUPPORTED_FIAT: FiatCurrency[] = [
  { code: 'USD', name: 'United States Dollar', symbol: '$', flag: '🇺🇸', rateVsUsd: 1.0 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', rateVsUsd: 83.5 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rateVsUsd: 0.92 },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', rateVsUsd: 0.78 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', rateVsUsd: 155.0 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', rateVsUsd: 1.50 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', rateVsUsd: 1.36 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', rateVsUsd: 3.67 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', rateVsUsd: 1.35 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', rateVsUsd: 0.90 }
];

export const SUPPORTED_CRYPTO: CryptoToken[] = [
  { id: 'POL', name: 'Polygon', symbol: 'POL', priceUsd: 0.089, color: 'text-[#0B0B0F] border-[#E5E7EB] bg-[#F6F7F9]', iconBg: 'bg-[#0B0B0F]' },
  { id: 'USDC', name: 'USD Coin', symbol: 'USDC', priceUsd: 1.0, color: 'text-[#0047AB] border-[#E5E7EB] bg-[#F6F7F9]', iconBg: 'bg-[#0047AB]' },
  { id: 'USDT', name: 'Tether', symbol: 'USDT', priceUsd: 1.0, color: 'text-[#1E8449] border-[#E5E7EB] bg-[#F6F7F9]', iconBg: 'bg-[#1E8449]' }
];

export interface ConversionRates {
  fiatRates: Record<string, number>;
  cryptoPrices: Record<string, number>;
  lastUpdated: number;
}

// Initial/Fallback rates (POL defaults to live market rate ~0.089)
let activeRates: ConversionRates = {
  fiatRates: {
    USD: 1.0,
    INR: 83.5,
    EUR: 0.92,
    GBP: 0.78,
    JPY: 155.0,
    AUD: 1.50,
    CAD: 1.36,
    AED: 3.67,
    SGD: 1.35,
    CHF: 0.90
  },
  cryptoPrices: {
    USDC: 1.0,
    USDT: 1.0,
    POL: 0.089
  },
  lastUpdated: Date.now()
};

const rateListeners = new Set<(rates: ConversionRates) => void>();

export function subscribeToRates(callback: (rates: ConversionRates) => void): () => void {
  rateListeners.add(callback);
  return () => {
    rateListeners.delete(callback);
  };
}

function notifyRateListeners() {
  rateListeners.forEach((cb) => {
    try {
      cb({ ...activeRates });
    } catch {}
  });
}

// Global active fiat currency preference listener (default: USD)
let globalFiatCurrency: string = typeof window !== 'undefined'
  ? localStorage.getItem('polylance_fiat_pref') || 'USD'
  : 'USD';

const fiatListeners = new Set<(fiat: string) => void>();

export function getGlobalFiat(): string {
  return globalFiatCurrency;
}

export function setGlobalFiat(fiat: string): void {
  globalFiatCurrency = fiat;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('polylance_fiat_pref', fiat);
    } catch {}
  }
  fiatListeners.forEach(cb => {
    try { cb(fiat); } catch {}
  });
}

export function useGlobalFiat(): [string, (fiat: string) => void] {
  const [fiat, setFiat] = useState<string>(globalFiatCurrency);
  useEffect(() => {
    const cb = (next: string) => setFiat(next);
    fiatListeners.add(cb);
    return () => { fiatListeners.delete(cb); };
  }, []);
  return [fiat, setGlobalFiat];
}

// In-flight request deduplication guard
let isFetchingRates = false;
const RATE_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

// Try restoring cached rates from localStorage on startup
if (typeof window !== 'undefined') {
  try {
    const rawCache = localStorage.getItem('polylance_currency_rates_cache');
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (parsed && parsed.lastUpdated && Date.now() - parsed.lastUpdated < RATE_CACHE_TTL_MS) {
        activeRates = parsed;
      }
    }
  } catch {}
}

// Async fetch utility to fetch latest rates dynamically with 3s timeout and deduplication
export async function fetchLiveExchangeRates(): Promise<ConversionRates> {
  // If recently updated or already in-flight, return current cache
  if (isFetchingRates || Date.now() - activeRates.lastUpdated < RATE_CACHE_TTL_MS) {
    return activeRates;
  }
  isFetchingRates = true;

  try {
    // 1. Fetch Fiat rates vs USD with 3s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const fiatRes = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (fiatRes.ok) {
        const fiatData = await fiatRes.json();
        if (fiatData && fiatData.rates) {
          SUPPORTED_FIAT.forEach(f => {
            if (fiatData.rates[f.code]) {
              activeRates.fiatRates[f.code] = fiatData.rates[f.code];
              f.rateVsUsd = fiatData.rates[f.code];
            }
          });
        }
      }
    } catch {}

    // 2. Fetch Crypto prices in USD (Primary: Binance public ticker, Secondary: CoinGecko)
    let cryptoSuccess = false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const binanceRes = await fetch(
        'https://api.binance.com/api/v3/ticker/price?symbols=%5B%22USDCUSDT%22,%22POLUSDT%22%5D',
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (binanceRes.ok) {
        const binanceData: Array<{ symbol: string; price: string }> = await binanceRes.json();
        activeRates.cryptoPrices.USDT = 1.0;
        binanceData.forEach((item) => {
          const p = parseFloat(item.price);
          if (!isNaN(p) && p > 0) {
            if (item.symbol === 'USDCUSDT') {
              activeRates.cryptoPrices.USDC = parseFloat(p.toFixed(4));
            } else if (item.symbol === 'POLUSDT') {
              activeRates.cryptoPrices.POL = p;
            }
          }
        });

        SUPPORTED_CRYPTO.forEach((c) => {
          if (activeRates.cryptoPrices[c.id]) {
            c.priceUsd = activeRates.cryptoPrices[c.id];
          }
        });
        cryptoSuccess = true;
      }
    } catch {}

    // Resilient fallback to CoinGecko if Binance is inaccessible (e.g. ISP blocked in India)
    if (!cryptoSuccess) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const cgRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=polygon-ecosystem-token,usd-coin,tether&vs_currencies=usd',
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (cgRes.ok) {
          const cgData = await cgRes.json();
          if (cgData['polygon-ecosystem-token']?.usd) {
            activeRates.cryptoPrices.POL = cgData['polygon-ecosystem-token'].usd;
          }
          if (cgData['usd-coin']?.usd) {
            activeRates.cryptoPrices.USDC = cgData['usd-coin'].usd;
          }
          if (cgData['tether']?.usd) {
            activeRates.cryptoPrices.USDT = cgData['tether'].usd;
          }
          SUPPORTED_CRYPTO.forEach((c) => {
            if (activeRates.cryptoPrices[c.id]) {
              c.priceUsd = activeRates.cryptoPrices[c.id];
            }
          });
          cryptoSuccess = true;
        }
      } catch {}
    }

    activeRates.lastUpdated = Date.now();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('polylance_currency_rates_cache', JSON.stringify(activeRates));
      } catch {}
    }
    notifyRateListeners();
  } catch {
    // Fail silently, preserving active default rates
  } finally {
    isFetchingRates = false;
  }
  return activeRates;
}

let pollingTimer: any = null;
export function startRatePolling(intervalMs = 300000) { // 5 minutes default
  if (pollingTimer) return;
  fetchLiveExchangeRates();
  pollingTimer = setInterval(() => {
    fetchLiveExchangeRates();
  }, intervalMs);
}

export function getActiveRates(): ConversionRates {
  return activeRates;
}

export function useLiveCurrencyRates(): ConversionRates {
  const [rates, setRates] = useState<ConversionRates>(() => ({ ...activeRates }));

  useEffect(() => {
    const unsub = subscribeToRates((newRates) => {
      setRates({ ...newRates });
    });
    if (Date.now() - activeRates.lastUpdated > RATE_CACHE_TTL_MS) {
      fetchLiveExchangeRates();
    }
    return unsub;
  }, []);

  return rates;
}

/**
 * Normalizes token symbol to standard POL / USDC / USDT (converts legacy MATIC -> POL)
 */
export function normalizeTokenSymbol(symbol: string | undefined): 'POL' | 'USDC' | 'USDT' {
  const s = (symbol || 'POL').toUpperCase().trim();
  if (s === 'MATIC') return 'POL';
  if (s === 'USDC') return 'USDC';
  if (s === 'USDT') return 'USDT';
  return 'POL';
}

/**
 * Canonical helper to format fiat value with clean symbol prefix:
 * e.g. USD -> "$1.02", INR -> "₹85.17"
 * Tiny amounts (< 0.01) format cleanly as "< $0.01" or "< ₹0.01"
 */
export function formatFiatAmount(value: number, fiatCode: string = globalFiatCurrency): string {
  const code = (fiatCode || 'USD').toUpperCase();
  const fiat = SUPPORTED_FIAT.find(f => f.code === code) || SUPPORTED_FIAT[0];
  const sym = fiat.symbol;

  if (value <= 0) {
    return `${sym}0.00`;
  }
  if (value < 0.01) {
    return `< ${sym}0.01`;
  }
  return `${sym}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Converts a crypto token amount into formatted fiat string:
 * Always prefixed with "~ " as required by design specification.
 * e.g. 10 POL -> "~ $4.50" (or "~ ₹375.75" if INR is selected)
 */
export function convertCryptoToFiat(
  cryptoAmount: number | string,
  tokenCode: string = 'POL',
  fiatCode: string = globalFiatCurrency
): { amount: number; formatted: string } {
  const num = typeof cryptoAmount === 'number' ? cryptoAmount : parseFloat(String(cryptoAmount).replace(/[^0-9.-]/g, '')) || 0;
  const sym = normalizeTokenSymbol(tokenCode);
  const tokenPriceUsd = activeRates.cryptoPrices[sym] ?? (sym === 'POL' ? 0.089 : 1.0);
  const targetFiat = (fiatCode || globalFiatCurrency).toUpperCase();
  const fiatRateVsUsd = activeRates.fiatRates[targetFiat] ?? (targetFiat === 'INR' ? 83.5 : 1.0);

  const totalUsd = num * tokenPriceUsd;
  const totalFiat = totalUsd * fiatRateVsUsd;

  return {
    amount: totalFiat,
    formatted: `~ ${formatFiatAmount(totalFiat, targetFiat)}`
  };
}

export function convertUsdToCrypto(usdAmount: number, tokenCode: string): number {
  const sym = normalizeTokenSymbol(tokenCode);
  const tokenPriceUsd = activeRates.cryptoPrices[sym] || (sym === 'POL' ? 0.089 : 1.0);
  return usdAmount / tokenPriceUsd;
}
