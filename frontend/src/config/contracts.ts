import localAddresses from "./localhost_addresses.json";
import amoyAddresses from "./amoy_addresses.json";
import polygonAddresses from "./polygon_addresses.json";

const network = import.meta.env.VITE_NETWORK ?? "polygon";
const manifest = 
  network === "amoy" 
    ? amoyAddresses 
    : network === "localhost" 
      ? localAddresses 
      : polygonAddresses;

export const CONTRACTS = {
  JobFactory: (import.meta.env.VITE_JOB_FACTORY_ADDRESS || manifest.JobFactory) as string,
  ReputationSBT: (import.meta.env.VITE_REPUTATION_SBT_ADDRESS || manifest.ReputationSBT) as string,
  ProfileRegistry: (import.meta.env.VITE_PROFILE_REGISTRY_ADDRESS || manifest.ProfileRegistry) as string,
  GithubReputationRegistry: (import.meta.env.VITE_GITHUB_REGISTRY_ADDRESS || manifest.GithubReputationRegistry) as string,
  JudgeDAO: (import.meta.env.VITE_JUDGE_DAO_ADDRESS || manifest.JudgeDAO) as string,
  TimelockController: (import.meta.env.VITE_TIMELOCK_ADDRESS || manifest.TimelockController) as string,
  JobEscrowImplementation: ((manifest as any).JobEscrowImplementation || "0x88dd19df1b6dBA8D2c53b3976f4ec39B75f17FbB") as string,
} as const;

export const CONTRACT_ADDRESSES = CONTRACTS;

export const CHAIN_ID = 
  network === "amoy" 
    ? 80002 
    : network === "localhost" 
      ? 31337 
      : 137;

export const AMOY_RPC_URLS = [
  "https://polygon-amoy-bor-rpc.publicnode.com",
  "https://rpc-amoy.polygon.technology"
];

export const POLYGON_MAINNET_RPC_URLS = [
  "https://polygon-bor-rpc.publicnode.com",
  "https://polygon.gateway.tenderly.co",
  "https://137.rpc.thirdweb.com"
];

export const RPC_URL =
  import.meta.env.VITE_RPC_URL ||
  (network === "polygon"
    ? "https://polygon-bor-rpc.publicnode.com"
    : network === "amoy"
      ? "https://polygon-amoy-bor-rpc.publicnode.com"
      : "http://127.0.0.1:8545");

export const NETWORK_CONFIG = {
  chainId: CHAIN_ID,
  chainHex: `0x${CHAIN_ID.toString(16)}`,
  chainName: 
    CHAIN_ID === 137
      ? "Polygon Mainnet"
      : CHAIN_ID === 31337 
        ? "Hardhat Localhost" 
        : "Polygon Amoy Testnet",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18,
  },
  rpcUrl: RPC_URL,
  blockExplorerUrl: 
    CHAIN_ID === 137
      ? "https://polygonscan.com"
      : CHAIN_ID === 31337 
        ? "" 
        : "https://amoy.polygonscan.com",
};

