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

  // Tally star-weighted language contributions
  const categoryScores = {};

  for (const repo of repos) {
    if (repo.fork) continue; // ignore forks
    const lang = repo.language;
    if (!lang) continue;

    const category = LANGUAGE_CATEGORY[lang] ?? "other";
    const stars = repo.stargazers_count ?? 0;
    const weight = Math.log1p(stars) + 1; // log(1+stars) + 1 base unit

    categoryScores[category] = (categoryScores[category] ?? 0) + weight;
  }

  if (Object.keys(categoryScores).length === 0) {
    // No scoreable repos — return a minimal profile
    return {
      primaryCategory: "other",
      primaryScore: 1,
      secondaryCategories: [],
      secondaryScores: [],
    };
  }

  // Sort by score descending
  const sorted = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);

  // Normalize to [1, 1000]
  const maxRaw = sorted[0][1];
  const normalize = (raw) => Math.max(1, Math.round((raw / maxRaw) * 1000));

  const [primaryCategory, primaryRaw] = sorted[0];
  const primaryScore = normalize(primaryRaw);

  const secondaryCategories = [];
  const secondaryScores = [];
  for (let i = 1; i < sorted.length; i++) {
    secondaryCategories.push(sorted[i][0]);
    secondaryScores.push(normalize(sorted[i][1]));
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
  userAddress,
  primaryCategory,
  primaryScore,
  secondaryCategories,
  secondaryScores,
  attestationUID
) {
  // Build type + value arrays for solidityPackedKeccak256
  const types = [
    "address",
    "bytes32",
    "uint256",
    "bytes32[]",
    "uint256[]",
    "bytes32",
  ];
  const values = [
    userAddress,
    categoryToBytes32(primaryCategory),
    BigInt(primaryScore),
    secondaryCategories.map(categoryToBytes32),
    secondaryScores.map(BigInt),
    attestationUID,
  ];

  const messageHash = ethers.solidityPackedKeccak256(types, values);
  const ethSignedHash = ethers.hashMessage(ethers.getBytes(messageHash));
  const signature = await oracleWallet.signMessage(ethers.getBytes(messageHash));

  return { messageHash, ethSignedHash, signature };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const [githubUsername, userWalletAddress] = process.argv.slice(2);

  if (!githubUsername || !userWalletAddress) {
    console.error("Usage: node oracle/githubScorer.js <githubUsername> <userWalletAddress>");
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

  const { signature } = await signAttestation(
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
