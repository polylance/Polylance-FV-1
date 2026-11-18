#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

/**
 * PolyLance CI Lint: No Mock Data Guard
 * Fails the build if landing page components or the production bundle contain hardcoded mock literals
 * or forbidden mock imports.
 */

const BANNED_MOCK_LITERALS = [
  '2,500 USDC',
  '#3821',
  '4.95 / 5.0',
  '28 Jobs',
  '3 of 3 consensus',
  'Objective verdict delivered',
  'Deliverables posted for Milestone 2',
];

const SOURCE_FILES_TO_CHECK = [
  path.resolve(process.cwd(), 'frontend', 'src', 'pages', 'LandingVisitor.tsx'),
  path.resolve(process.cwd(), 'frontend', 'src', 'components', 'landing', 'FeaturesSection.tsx'),
];

console.log('=== Checking Landing Components for Hardcoded Mock Literals ===');

let violationsFound = 0;

for (const filePath of SOURCE_FILES_TO_CHECK) {
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check imports
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if ((line.includes('import ') && line.includes('mock')) || line.includes('fixture')) {
      console.error(`[ERROR] Forbidden mock import in ${path.basename(filePath)}:${idx + 1}`);
      console.error(`  ${line.trim()}`);
      violationsFound++;
    }
  });

  // Check banned mock literals
  for (const literal of BANNED_MOCK_LITERALS) {
    if (content.includes(literal)) {
      console.error(`[ERROR] Found banned mock literal "${literal}" in ${path.basename(filePath)}`);
      violationsFound++;
    }
  }
}

// Check production bundle if dist exists
const distDir = path.resolve(process.cwd(), 'frontend', 'dist');
if (fs.existsSync(distDir)) {
  console.log('\n=== Checking Production Bundle for Mock Literals ===');
  const distFiles = fs.readdirSync(path.join(distDir, 'assets')).filter(f => f.endsWith('.js'));
  for (const file of distFiles) {
    const bundleContent = fs.readFileSync(path.join(distDir, 'assets', file), 'utf-8');
    for (const literal of BANNED_MOCK_LITERALS) {
      if (bundleContent.includes(literal)) {
        console.error(`[ERROR] Found banned mock literal "${literal}" in production bundle: ${file}`);
        violationsFound++;
      }
    }
  }
}

if (violationsFound > 0) {
  console.error(`\n❌ CI Failed: Found ${violationsFound} mock data violations.`);
  process.exit(1);
} else {
  console.log('✅ Clean: No mock data or banned literals found in landing components.');
}
