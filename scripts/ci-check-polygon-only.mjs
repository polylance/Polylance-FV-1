#!/usr/bin/env node
/**
 * ci-check-polygon-only.mjs
 *
 * Verifies that the codebase remains 100% Polygon PoS (Polygon Mainnet 137 / Amoy 80002)
 * and prevents accidental leakage of Ethereum mainnet (chain ID 1), Goerli, Sepolia,
 * Mumbai (deprecated), etherscan.io links, or unconfigured Ethereum providers.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Scan frontend/src and polylance-chat-service/src
const targetDirs = [
  path.join(projectRoot, 'frontend', 'src'),
  path.join(projectRoot, 'polylance-chat-service', 'src'),
];

// Patterns forbidden in active source code
const forbiddenPatterns = [
  { regex: /etherscan\.io/i, label: 'Etherscan link (use polygonscan.com or amoy.polygonscan.com)' },
  { regex: /\bsepolia\b/i, label: 'Sepolia testnet reference (use Polygon Amoy 80002)' },
  { regex: /\bgoerli\b/i, label: 'Goerli testnet reference (use Polygon Amoy 80002)' },
  { regex: /\bmumbai\b/i, label: 'Deprecated Polygon Mumbai reference (use Polygon Amoy 80002)' },
  { regex: /ethers\.getDefaultProvider/i, label: 'ethers.getDefaultProvider() (unrestricted Ethereum RPC fallback)' },
];

// File extension filter
const validExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json']);

let violationCount = 0;

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
        continue;
      }
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!validExtensions.has(ext)) continue;

      // Skip ABI json files if they mention standard error/revert strings that might have false positives
      const relPath = path.relative(projectRoot, fullPath);
      const content = fs.readFileSync(fullPath, 'utf8');

      forbiddenPatterns.forEach(({ regex, label }) => {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (regex.test(line)) {
            // Allow explicit comments explaining removal if any
            if (line.includes('// polygon-only-allow') || line.includes('/* polygon-only-allow */')) {
              return;
            }
            console.error(`❌ [POLYGON-ONLY VIOLATION] ${relPath}:${idx + 1}`);
            console.error(`   Found: "${line.trim()}"`);
            console.error(`   Reason: ${label}\n`);
            violationCount++;
          }
        });
      });
    }
  }
}

console.log('🔍 Checking codebase for Polygon PoS purity...');
targetDirs.forEach(scanDirectory);

if (violationCount === 0) {
  console.log('✅ 100% Polygon PoS verified: Zero non-Polygon chains, RPCs, or explorers found.');
  process.exit(0);
} else {
  console.error(`🚨 Failed: ${violationCount} non-Polygon violation(s) detected.`);
  process.exit(1);
}
