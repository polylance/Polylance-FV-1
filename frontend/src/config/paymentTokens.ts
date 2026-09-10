import { ethers } from "ethers";

export const PAYMENT_TOKENS = {
  MATIC: {
    address: ethers.ZeroAddress,
    symbol: "MATIC",
    decimals: 18,
  },
  POL: {
    address: ethers.ZeroAddress,
    symbol: "POL",
    decimals: 18,
  },
  USDC: {
    address:
      (import.meta.env.VITE_NETWORK === "amoy" || import.meta.env.VITE_CHAIN_ID === "80002")
        ? "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582" // real Amoy testnet USDC
        : "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // real Polygon mainnet USDC
    symbol: "USDC",
    decimals: 6,
  },
  USDT: {
    address:
      (import.meta.env.VITE_NETWORK === "amoy" || import.meta.env.VITE_CHAIN_ID === "80002")
        ? "0x1B1b50A9f7c00e1BE6Ec554F11E1077e682A31a7" // real Amoy testnet USDT
        : "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // real Polygon mainnet Tether USD (USDT)
    symbol: "USDT",
    decimals: 6,
  },
} as const;

export type PaymentTokenSymbol = keyof typeof PAYMENT_TOKENS;

export function getTokenBySymbol(symbol: string) {
  const sym = (symbol || "").toUpperCase();
  if (sym in PAYMENT_TOKENS) {
    return PAYMENT_TOKENS[sym as PaymentTokenSymbol];
  }
  return PAYMENT_TOKENS.MATIC;
}

export function getTokenByAddress(address: string) {
  if (!address || address === ethers.ZeroAddress) {
    return PAYMENT_TOKENS.MATIC;
  }
  const match = Object.values(PAYMENT_TOKENS).find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
  return match ?? PAYMENT_TOKENS.MATIC;
}
