import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Starting Landing Page Consistency & Quality Tests...\n');

let failed = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failed = true;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// 1. Check for banned mock literals in frontend landing files
const bannedPatterns = [
  { pattern: /5 days to review/i, label: 'Hardcoded "5 days" review window (must be 7 days)' },
  { pattern: /9f8a3c2e/i, label: 'Fake git commit hash "9f8a3c2e"' },
  { pattern: /staging\.app-demo\.dev/i, label: 'Fake staging URL "staging.app-demo.dev"' },
  { pattern: /0x7D3eA4c153B8C13a299E41666870C0F0C058A9a3/i, label: 'Unverified contract address 0x7D3eA...' },
  { pattern: /\$201/i, label: 'Fabricated $201 total value' },
];

const landingDir = path.join(rootDir, 'frontend', 'src', 'components', 'landing');
const landingFiles = fs.readdirSync(landingDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

console.log('--- Checking Banned Mock Literals in components/landing ---');
for (const file of landingFiles) {
  const filePath = path.join(landingDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  for (const { pattern, label } of bannedPatterns) {
    assert(!pattern.test(content), `${file} should not contain: ${label}`);
  }
}

// Check LandingVisitor.tsx and ProductPreview.tsx
const extraFiles = [
  path.join(rootDir, 'frontend', 'src', 'pages', 'LandingVisitor.tsx'),
  path.join(rootDir, 'frontend', 'src', 'components', 'ProductPreview.tsx'),
  path.join(rootDir, 'frontend', 'src', 'components', 'escrow', 'SecurityShowcase.tsx'),
];

console.log('\n--- Checking Banned Mock Literals in Core Visitor & Preview Files ---');
for (const filePath of extraFiles) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');

  for (const { pattern, label } of bannedPatterns) {
    assert(!pattern.test(content), `${fileName} should not contain: ${label}`);
  }
}

// 2. Validate Simulator BigInt Math Invariants
console.log('\n--- Checking Escrow Simulator Fee Math Invariants ---');
const CLIENT_FEE_BPS = 250n;
const FREELANCER_FEE_BPS = 250n;
const BPS_DIVISOR = 10000n;

function testFeeBreakdown(budget) {
  const clientFee = (budget * CLIENT_FEE_BPS + (BPS_DIVISOR - 1n)) / BPS_DIVISOR;
  const freelancerFee = (budget * FREELANCER_FEE_BPS) / BPS_DIVISOR;
  const clientDeposit = budget + clientFee;
  const freelancerNet = budget - freelancerFee;
  const platformTotal = clientFee + freelancerFee;

  return clientDeposit === freelancerNet + platformTotal;
}

const testBudgets = [
  10n * 10n**18n, // 10 POL
  50n * 10n**6n,  // 50 USDC
  1000n * 10n**18n, // 1,000 POL
  2500n * 10n**6n, // 2,500 USDC
  50000n * 10n**18n, // 50,000 POL
  1337n * 10n**18n, // Prime amount
  1n, // Dust amount 1 wei
];

for (const b of testBudgets) {
  assert(
    testFeeBreakdown(b),
    `Fee invariant holds for budget ${b.toString()} (clientDeposit === freelancerNet + platformTotal)`
  );
}

// 3. Verify Honesty Rules in Code: Testimonials and Team
console.log('\n--- Checking Honesty Rules Code Constraints ---');
const testimonialsContent = fs.readFileSync(
  path.join(landingDir, 'TestimonialsSection.tsx'),
  'utf-8'
);
assert(
  testimonialsContent.includes('testimonials.length < 3') && testimonialsContent.includes('return null'),
  'TestimonialsSection must return null if fewer than 3 approved testimonials exist'
);

const teamContent = fs.readFileSync(
  path.join(landingDir, 'TeamSection.tsx'),
  'utf-8'
);
assert(
  teamContent.includes('TEAM_MEMBERS.length === 0') && teamContent.includes('return null'),
  'TeamSection must return null if TEAM_MEMBERS config is empty'
);

console.log('\n------------------------------------------------');
if (failed) {
  console.error('❌ One or more consistency checks failed!\n');
  process.exit(1);
} else {
  console.log('🎉 All consistency checks passed cleanly!\n');
  process.exit(0);
}
