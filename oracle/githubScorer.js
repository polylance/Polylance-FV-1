#!/usr/bin/env node
/**
 * oracle/githubScorer.js
 *
 * GitHub Reputation Oracle — scores a user's GitHub profile and produces a
 * signed attestation that GithubReputationRegistry.submitSkillVerification()
 * will accept on-chain.
 *
 * Signing matches the exact on-chain message:
 *   keccak256(abi.encodePacked(
 *     user,              // address
 *     primaryCategory,   // bytes32
 *     primaryScore,      // uint256
 *     secondaryCategories, // bytes32[]
 *     secondaryScores,   // uint256[]
 *     attestationUID     // bytes32
 *   ))
 *
 * Usage:
 *   node oracle/githubScorer.js <githubUsername> <userWalletAddress>
 *
 * Env vars required:
 *   ORACLE_PRIVATE_KEY  — hex private key of the oracle signing wallet
 *   GITHUB_TOKEN        — personal access token (optional, raises rate limit)
 */

"use strict";

const { ethers } = require("ethers");
const https = require("https");
const crypto = require("crypto");

// ── Config ──────────────────────────────────────────────────────────────────

const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

if (!ORACLE_PRIVATE_KEY) {
  console.error("ERROR: ORACLE_PRIVATE_KEY env var is required");
  process.exit(1);
}

const oracleWallet = new ethers.Wallet(ORACLE_PRIVATE_KEY);

// ── GitHub API helper ────────────────────────────────────────────────────────

/**
 * Minimal HTTPS GET wrapper — returns parsed JSON.
 */
function githubGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path,
      method: "GET",
      headers: {
        "User-Agent": "polylance-oracle/1.0",
        Accept: "application/vnd.github+json",
        ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse GitHub response: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

// ── Scoring logic ────────────────────────────────────────────────────────────

/**
 * Language → skill category mapping. Extend as needed.
 */
const LANGUAGE_CATEGORY = {
  JavaScript: "web",
  TypeScript: "web",
  Python: "ml_data",
  Jupyter: "ml_data",
  Solidity: "blockchain",
  Rust: "systems",
  Go: "systems",
  C: "systems",
  "C++": "systems",
  Java: "backend",
  Kotlin: "backend",
  "C#": "backend",
  Ruby: "backend",
  PHP: "backend",
  Swift: "mobile",
  Dart: "mobile",
  CSS: "frontend",
  HTML: "frontend",
  Shell: "devops",
  Dockerfile: "devops",
};

/**
 * Convert a category string to a left-aligned bytes32 hex string.
 */
function categoryToBytes32(category) {
  return ethers.encodeBytes32String(category.slice(0, 31));
}

/**
 * Score a user's GitHub profile.
 * Returns { primaryCategory, primaryScore, secondaryCategories, secondaryScores }
 * Scores are normalised to [0, 1000].
 */
async function scoreGithubProfile(username) {
  console.log(`Fetching repos for ${username}...`);
  const repos = await githubGet(`/users/${username}/repos?per_page=100&sort=pushed`);

  if (!Array.isArray(repos)) {
    throw new Error(`Unexpected GitHub response: ${JSON.stringify(repos)}`);
  }

  // Tally star-weighted language contributions, code sizes, and non-fork repositories
  const categoryScores = {};
  let totalStars = 0;
  let totalSizeBytes = 0;
  let nonForkCount = 0;

  for (const repo of repos) {
    if (repo.fork) continue; // ignore forks
    nonForkCount++;
    const stars = repo.stargazers_count ?? 0;
    totalStars += stars;
    const sizeBytes = (repo.size ?? 0) * 1024;
    totalSizeBytes += sizeBytes;

    const lang = repo.language;
    if (!lang) continue;

    const category = LANGUAGE_CATEGORY[lang] ?? "other";
    const weight = Math.log1p(stars) + Math.min(10, sizeBytes / 100000) + 1;

    categoryScores[category] = (categoryScores[category] ?? 0) + weight;
  }

  if (Object.keys(categoryScores).length === 0 || nonForkCount === 0) {
    return {
      primaryCategory: "other",
      primaryScore: 0,
      secondaryCategories: [],
      secondaryScores: [],
    };
  }

  // Hardened Points Assignment (Max 1000 pts total)
  // Factor 1: Verified Code Volume (Max 350 pts)
  let byteScore = 0;
  if (totalSizeBytes > 2000000) {
    byteScore = 240 + Math.min(110, Math.round(Math.log10(totalSizeBytes / 2000000) * 55));
  } else if (totalSizeBytes > 500000) {
    byteScore = 150 + Math.round(((totalSizeBytes - 500000) / 1500000) * 90);
  } else if (totalSizeBytes > 100000) {
    byteScore = 75 + Math.round(((totalSizeBytes - 100000) / 400000) * 75);
  } else if (totalSizeBytes > 25000) {
    byteScore = 30 + Math.round(((totalSizeBytes - 25000) / 75000) * 45);
  } else {
    byteScore = Math.round((totalSizeBytes / 25000) * 30);
  }

  // Factor 2: Non-Fork Repo Depth (Max 150 pts)
  const repoScore = Math.min(150, nonForkCount * 12);

  // Factor 3: Stars & Community Validation (Max 200 pts)
  const starScore = Math.min(200, Math.round(totalStars * 3));

  // Factor 4: Category Diversity (Max 150 pts)
  const categoryCount = Object.keys(categoryScores).length;
  const diversityScore = Math.min(150, categoryCount * 30);

  // Raw combined score out of 1000
  const rawScore = byteScore + repoScore + starScore + diversityScore;
  const primaryScore = Math.min(990, Math.max(100, rawScore));

  // Sort by category weight descending
  const sorted = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);
  const [primaryCategory] = sorted[0];

  const secondaryCategories = [];
  const secondaryScores = [];
  for (let i = 1; i < sorted.length; i++) {
    secondaryCategories.push(sorted[i][0]);
    secondaryScores.push(Math.round(primaryScore * (0.35 / i)));
  }

  return { primaryCategory, primaryScore, secondaryCategories, secondaryScores };
}

// ── Signing ──────────────────────────────────────────────────────────────────

/**
 * Replicates the on-chain keccak256(abi.encodePacked(...)) and signs it.
 *
 * NOTE: abi.encodePacked packs dynamic arrays tightly (no length prefix for
 *   elements when inside encodePacked).  ethers.solidityPackedKeccak256 does
 *   the same thing.
 */
async function signAttestation(
  chainId,
  registryAddress,
  userAddress,
  primaryCategory,
  primaryScore,
  secondaryCategories,
  secondaryScores,
  attestationUID
) {
  // Build type + value arrays for solidityPackedKeccak256 matching on-chain digest
  const types = [
    "uint256",
    "address",
    "address",
    "bytes32",
    "uint256",
    "bytes32[]",
    "uint256[]",
    "bytes32",
  ];
  const values = [
    BigInt(chainId || process.env.CHAIN_ID || 80002),
    registryAddress || process.env.REGISTRY_ADDRESS || "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    userAddress,
    categoryToBytes32(primaryCategory),
    BigInt(primaryScore),
    secondaryCategories.map(categoryToBytes32),
    secondaryScores.map(BigInt),
    attestationUID,
  ];

  const messageHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(types, values)
  );
  const ethSignedHash = ethers.hashMessage(ethers.getBytes(messageHash));
  const signature = await oracleWallet.signMessage(ethers.getBytes(messageHash));

  return { messageHash, ethSignedHash, signature };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const [githubUsername, userWalletAddress, customRegistryAddr, customChainId] = process.argv.slice(2);

  if (!githubUsername || !userWalletAddress) {
    console.error("Usage: node oracle/githubScorer.js <githubUsername> <userWalletAddress> [registryAddress] [chainId]");
    process.exit(1);
  }

  if (!ethers.isAddress(userWalletAddress)) {
    console.error(`Invalid wallet address: ${userWalletAddress}`);
    process.exit(1);
  }

  const profile = await scoreGithubProfile(githubUsername);
  console.log("Score profile:", profile);

  // Generate a unique attestation UID from user + nonce (timestamp)
  const nonce = Date.now().toString();
  const attestationUID = ethers.keccak256(
    ethers.toUtf8Bytes(`${userWalletAddress}:${githubUsername}:${nonce}`)
  );

  const registryAddress = customRegistryAddr || process.env.REGISTRY_ADDRESS || "0x0165878A594ca255338adfa4d48449f69242Eb8F";
  const chainId = customChainId || process.env.CHAIN_ID || 80002;

  const { signature } = await signAttestation(
    chainId,
    registryAddress,
    userWalletAddress,
    profile.primaryCategory,
    profile.primaryScore,
    profile.secondaryCategories,
    profile.secondaryScores,
    attestationUID
  );

  const result = {
    user: userWalletAddress,
    github: githubUsername,
    primaryCategory: profile.primaryCategory,
    primaryCategoryBytes32: categoryToBytes32(profile.primaryCategory),
    primaryScore: profile.primaryScore,
    secondaryCategories: profile.secondaryCategories,
    secondaryCategoriesBytes32: profile.secondaryCategories.map(categoryToBytes32),
    secondaryScores: profile.secondaryScores,
    attestationUID,
    oracleSignature: signature,
    oracleAddress: oracleWallet.address,
    scoredAt: new Date().toISOString(),
  };

  console.log("\n── Oracle Attestation ──────────────────────────────────");
  console.log(JSON.stringify(result, null, 2));

  return result;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

module.exports = { scoreGithubProfile, signAttestation, categoryToBytes32 };
