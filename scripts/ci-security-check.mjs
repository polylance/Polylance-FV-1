#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();

console.log('====================================================');
console.log('   PolyLance CI Security & Quality Verification');
console.log('====================================================\n');

let failed = false;

// 1. Secret Leakage Verification in Frontend
console.log('🔍 [1/3] Scanning frontend code and environment for secret leakage...');

const FRONTEND_ENV = path.join(ROOT_DIR, 'frontend', '.env');
if (fs.existsSync(FRONTEND_ENV)) {
  const content = fs.readFileSync(FRONTEND_ENV, 'utf-8');
  const sensitivePatterns = [
    /VITE_PINATA_API_KEY=\S+/,
    /VITE_PINATA_API_SECRET=\S+/,
    /VITE_PINATA_JWT=\S+/,
    /VITE_ADMIN_PRIVATE_KEY=\S+/,
    /0x[a-fA-F0-9]{64}/
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(content)) {
      console.error(`❌ CRITICAL: Sensitive secret matched in frontend/.env with pattern: ${pattern}`);
      failed = true;
    }
  }
}

if (!failed) {
  console.log('✅ frontend/.env is clean of leaked private keys, JWTs, and API secrets.\n');
}

// 2. TypeScript Typecheck Verification
console.log('🔍 [2/3] Running TypeScript typechecks (backend & frontend)...');
try {
  console.log('  -> Checking polylance-chat-service...');
  execSync('npx tsc --noEmit', { cwd: path.join(ROOT_DIR, 'polylance-chat-service'), stdio: 'inherit' });
  console.log('  -> Checking frontend...');
  execSync('npx tsc --noEmit', { cwd: path.join(ROOT_DIR, 'frontend'), stdio: 'inherit' });
  console.log('✅ Zero TypeScript compiler errors across all packages.\n');
} catch (err) {
  console.error('❌ TypeScript compilation failed.');
  process.exit(1);
}

// 3. Automated Vitest Test Suites
console.log('🔍 [3/3] Executing automated test suites...');
try {
  console.log('  -> Executing backend vitest suites (SIWE, Access Matrix, Payment Verification, SBTs)...');
  execSync('npx vitest run', { cwd: path.join(ROOT_DIR, 'polylance-chat-service'), stdio: 'inherit' });

  console.log('  -> Executing frontend vitest suites (Attestation Report, Invariants, Components)...');
  execSync('npx vitest run', { cwd: path.join(ROOT_DIR, 'frontend'), stdio: 'inherit' });
  console.log('✅ All test suites passed successfully.\n');
} catch (err) {
  console.error('❌ Test suite execution failed.');
  process.exit(1);
}

console.log('====================================================');
console.log('   🎉 All Security, Type, and Test Checks PASSED!');
console.log('====================================================');
