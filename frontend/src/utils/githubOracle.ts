import { ethers } from 'ethers';

export interface GithubScoreResult {
  username: string;
  primaryCategory: string;
  primaryScore: number;
  secondaryCategories: string[];
  secondaryScores: number[];
  attestationUID: string;
  oracleSignature: string;
  oracleAddress: string;
  verifiedAt: number;
}

const LANGUAGE_CATEGORY: Record<string, string> = {
  Solidity: 'web3',
  Vyper: 'web3',
  Cairo: 'web3',
  TypeScript: 'frontend',
  JavaScript: 'frontend',
  CSS: 'frontend',
  HTML: 'frontend',
  Vue: 'frontend',
  Rust: 'backend',
  Go: 'backend',
  Python: 'backend',
  Java: 'backend',
  Swift: 'mobile',
  Kotlin: 'mobile',
  Dart: 'mobile',
};

export async function scoreGithubUser(username: string, userAddress: string): Promise<GithubScoreResult> {
  // Deterministic calculation based on username string seed for demo credibility
  let seed = 0;
  for (let i = 0; i < username.length; i++) {
    seed += username.charCodeAt(i) * (i + 1);
  }

  // Pre-configured mappings for known demo handles or computed breakdown
  const lower = username.toLowerCase();
  let primaryCategory = 'web3';
  let primaryScore = 850;
  let secondaryCategories = ['frontend', 'backend'];
  let secondaryScores = [320, 190];

  if (lower.includes('front') || lower.includes('react') || lower.includes('ui')) {
    primaryCategory = 'frontend';
    primaryScore = 920;
    secondaryCategories = ['web3', 'backend'];
    secondaryScores = [410, 150];
  } else if (lower.includes('rust') || lower.includes('dev') || lower.includes('back')) {
    primaryCategory = 'backend';
    primaryScore = 780;
    secondaryCategories = ['web3', 'mobile'];
    secondaryScores = [620, 110];
  } else if (lower.includes('app') || lower.includes('mobile') || lower.includes('swift')) {
    primaryCategory = 'mobile';
    primaryScore = 880;
    secondaryCategories = ['frontend', 'backend'];
    secondaryScores = [450, 210];
  } else {
    // Math-based variation derived from username
    const pScores = [620, 750, 810, 890, 940];
    primaryScore = pScores[seed % pScores.length];
    const s1 = Math.round(primaryScore * 0.45);
    const s2 = Math.round(primaryScore * 0.22);
    secondaryScores = [s1, s2];
  }

  const nonce = Date.now().toString();
  const attestationUID = ethers.keccak256(
    ethers.toUtf8Bytes(`${userAddress}:${username}:${nonce}`)
  );

  // Oracle wallet simulator signature
  const oracleWallet = ethers.Wallet.createRandom();
  const oracleAddress = oracleWallet.address;
  const oracleSignature = await oracleWallet.signMessage(
    ethers.getBytes(ethers.keccak256(ethers.toUtf8Bytes(attestationUID)))
  );

  return {
    username,
    primaryCategory,
    primaryScore,
    secondaryCategories,
    secondaryScores,
    attestationUID,
    oracleSignature,
    oracleAddress,
    verifiedAt: Date.now(),
  };
}
