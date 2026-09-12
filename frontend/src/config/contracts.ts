import localAddresses from "./localhost_addresses.json";
import amoyAddresses from "./amoy_addresses.json";
import polygonAddresses from "./polygon_addresses.json";

const network = import.meta.env.VITE_NETWORK ?? "amoy";
const manifest = 
  network === "polygon" 
    ? polygonAddresses 
    : network === "localhost" 
      ? localAddresses 
      : amoyAddresses;

export const CONTRACTS = {
  JobFactory: (import.meta.env.VITE_JOB_FACTORY_ADDRESS || manifest.JobFactory) as string,
  ReputationSBT: (import.meta.env.VITE_REPUTATION_SBT_ADDRESS || manifest.ReputationSBT) as string,
  ProfileRegistry: (import.meta.env.VITE_PROFILE_REGISTRY_ADDRESS || manifest.ProfileRegistry) as string,
  GithubReputationRegistry: (import.meta.env.VITE_GITHUB_REGISTRY_ADDRESS || manifest.GithubReputationRegistry) as string,
  JudgeDAO: (import.meta.env.VITE_JUDGE_DAO_ADDRESS || manifest.JudgeDAO) as string,
  TimelockController: (import.meta.env.VITE_TIMELOCK_ADDRESS || manifest.TimelockController) as string,
} as const;

export const CONTRACT_ADDRESSES = CONTRACTS;

export const CHAIN_ID = 
  network === "polygon" 
    ? 137 
    : network === "amoy" 
      ? 80002 
      : 31337;

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
    name: CHAIN_ID === 137 ? "POL" : "MATIC",
    symbol: CHAIN_ID === 137 ? "POL" : "MATIC",
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

