export interface FiatCurrency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateVsUsd: number; // Conversion factor: 1 USD = X Local Currency
}

export interface CryptoToken {
  id: 'USDC' | 'USDT' | 'BTC' | 'ETH' | 'POL';
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
  { id: 'USDC', name: 'USD Coin', symbol: 'USDC', priceUsd: 1.0, color: 'text-blue-600 border-blue-200 bg-blue-50/50', iconBg: 'bg-blue-500' },
  { id: 'USDT', name: 'Tether', symbol: 'USDT', priceUsd: 1.0, color: 'text-emerald-600 border-emerald-200 bg-emerald-50/50', iconBg: 'bg-emerald-500' },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH', priceUsd: 2800.0, color: 'text-indigo-600 border-indigo-200 bg-indigo-50/50', iconBg: 'bg-indigo-600' },
  { id: 'POL', name: 'Polygon', symbol: 'POL', priceUsd: 0.45, color: 'text-purple-600 border-purple-200 bg-purple-50/50', iconBg: 'bg-purple-600' },
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', priceUsd: 68000.0, color: 'text-amber-600 border-amber-200 bg-amber-50/50', iconBg: 'bg-amber-500' }
];

export interface ConversionRates {
  fiatRates: Record<string, number>;
  cryptoPrices: Record<string, number>;
  lastUpdated: number;
}

// Initial/Fallback rates
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
    ETH: 2800.0,
    POL: 0.45,
    BTC: 68000.0
  },
  lastUpdated: Date.now()
};

// Async fetch utility to fetch latest rates dynamically
export async function fetchLiveExchangeRates(): Promise<ConversionRates> {
  try {
    // 1. Fetch Fiat rates vs USD
    const fiatRes = await fetch('https://open.er-api.com/v6/latest/USD');
    if (fiatRes.ok) {
      const fiatData = await fiatRes.ok ? await fiatRes.json() : null;
      if (fiatData && fiatData.rates) {
        SUPPORTED_FIAT.forEach(f => {
          if (fiatData.rates[f.code]) {
            activeRates.fiatRates[f.code] = fiatData.rates[f.code];
            f.rateVsUsd = fiatData.rates[f.code];
          }
        });
      }
    }

    // 2. Fetch Crypto prices in USD from CoinGecko
    const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin,tether,ethereum,matic-network,bitcoin&vs_currencies=usd');
    if (cryptoRes.ok) {
      const cryptoData = await cryptoRes.json();
      const mappings: Record<string, string> = {
        'usd-coin': 'USDC',
        'tether': 'USDT',
        'ethereum': 'ETH',
        'matic-network': 'POL',
        'bitcoin': 'BTC'
      };
      Object.entries(mappings).forEach(([cgId, tokenCode]) => {
        if (cryptoData[cgId] && cryptoData[cgId].usd) {
          activeRates.cryptoPrices[tokenCode] = cryptoData[cgId].usd;
          const token = SUPPORTED_CRYPTO.find(c => c.id === tokenCode);
          if (token) token.priceUsd = cryptoData[cgId].usd;
        }
      });
    }
    
    activeRates.lastUpdated = Date.now();
  } catch (err) {
    console.warn('Failed to fetch live exchange rates, using static fallback cache:', err);
  }
  return activeRates;
}

export function getActiveRates(): ConversionRates {
  return activeRates;
}

/**
 * Calculates conversion from a Crypto amount to a specific Fiat currency.
 * @param cryptoAmount - Amount of crypto token (e.g. 2.5)
 * @param tokenCode - Code of crypto (e.g. 'ETH')
 * @param fiatCode - Code of target fiat (e.g. 'INR')
 */
export function convertCryptoToFiat(cryptoAmount: number, tokenCode: string, fiatCode: string): { amount: number; formatted: string } {
  const tokenPriceUsd = activeRates.cryptoPrices[tokenCode] || 1.0;
  const fiatRateVsUsd = activeRates.fiatRates[fiatCode] || 1.0;
  
  const totalUsd = cryptoAmount * tokenPriceUsd;
  const totalFiat = totalUsd * fiatRateVsUsd;
  
  const fiat = SUPPORTED_FIAT.find(f => f.code === fiatCode) || SUPPORTED_FIAT[0];
  
  return {
    amount: totalFiat,
    formatted: `${fiat.flag} ${fiat.symbol}${totalFiat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${fiat.code}`
  };
}

/**
 * Calculates how much crypto is needed to match a desired target USD amount.
 */
export function convertUsdToCrypto(usdAmount: number, tokenCode: string): number {
  const tokenPriceUsd = activeRates.cryptoPrices[tokenCode] || 1.0;
  return usdAmount / tokenPriceUsd;
}
