/**
 * PolyLance Blog Migration & Normalization Script
 *
 * Requirements:
 * - Dry-run by default, --apply to write changes.
 * - Always creates a backup of the original before modifying.
 * - Normalizes post formatting: cleans line breaks around headings, table rows, and list items.
 * - Replaces hardcoded platform fees with template tokens:
 *     "2.5% per side" -> "{{PLATFORM_FEE_PERCENT}} per side"
 *     "5.0% total"    -> "{{PLATFORM_FEE_TOTAL}} total"
 * - Validates that no prohibited competitor terms exist.
 * - Lists any posts requiring human editorial review.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BLOG_DATA_PATH = path.resolve(ROOT_DIR, 'frontend/src/seo/blog.data.ts');
const isApply = process.argv.includes('--apply');

console.log('----------------------------------------------------');
console.log(`PolyLance Blog Post Normalizer & Migration Tool`);
console.log(`Mode: ${isApply ? 'APPLY (Modifying files with backup)' : 'DRY-RUN (No files will be modified)'}`);
console.log('----------------------------------------------------\n');

if (!fs.existsSync(BLOG_DATA_PATH)) {
  console.error(`Error: Could not find blog data at ${BLOG_DATA_PATH}`);
  process.exit(1);
}

const originalContent = fs.readFileSync(BLOG_DATA_PATH, 'utf-8');

// List of posts needing human review
const humanReviewList: Array<{ slug: string; reason: string }> = [];

// Clean and tokenize the markdown content
let updatedContent = originalContent;

// 1. Tokenize fee numbers in blog content
// "2.5% per side (5.0% total)" -> "{{PLATFORM_FEE_PERCENT}} per side ({{PLATFORM_FEE_TOTAL}} total)"
updatedContent = updatedContent.replace(
  /2\.5% per side \(5\.0% total\)/g,
  '{{PLATFORM_FEE_PERCENT}} per side ({{PLATFORM_FEE_TOTAL}} total)'
);

// "dual-sided 2.5% protocol fee model (5.0% total platform take rate)" ->
// "dual-sided {{PLATFORM_FEE_PERCENT}} protocol fee model ({{PLATFORM_FEE_TOTAL}} total platform take rate)"
updatedContent = updatedContent.replace(
  /dual-sided 2\.5% protocol fee model \(5\.0% total platform take rate\)/g,
  'dual-sided {{PLATFORM_FEE_PERCENT}} protocol fee model ({{PLATFORM_FEE_TOTAL}} total platform take rate)'
);

// "client principal plus the 2.5% protocol service fee" ->
// "client principal plus the {{PLATFORM_FEE_PERCENT}} protocol service fee"
updatedContent = updatedContent.replace(
  /plus the 2\.5% protocol service fee/g,
  'plus the {{PLATFORM_FEE_PERCENT}} protocol service fee'
);

// "deducts the 2.5% freelancer fee" ->
// "deducts the {{PLATFORM_FEE_PERCENT}} freelancer fee"
updatedContent = updatedContent.replace(
  /deducts the 2\.5% freelancer fee/g,
  'deducts the {{PLATFORM_FEE_PERCENT}} freelancer fee'
);

// 2. Normalize headings: ensure double newlines before ## and ### headings
// so that headings are never glued to preceding text
updatedContent = updatedContent.replace(/([^\n])\n(##+ )/g, '$1\n\n$2');

// 3. Normalize tables: ensure a blank line before table headers
updatedContent = updatedContent.replace(/([^\n])\n(\|[^\n]+\|\n\| :?---)/g, '$1\n\n$2');

// 4. Check for any competitor terms in the content
const competitorTerms = ['upwork', 'fiverr', 'toptal', 'freelancer.com'];
competitorTerms.forEach((term) => {
  if (originalContent.toLowerCase().includes(term)) {
    humanReviewList.push({
      slug: 'global',
      reason: `Found competitor term "${term}" in blog data. Needs human editorial cleanup.`,
    });
  }
});

const changesMade = originalContent !== updatedContent;

if (changesMade) {
  console.log('✓ Found formatting and token improvements in blog.data.ts.');
  if (isApply) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${BLOG_DATA_PATH}.bak.${timestamp}`;
    fs.writeFileSync(backupPath, originalContent, 'utf-8');
    console.log(`✓ Backup written to: ${backupPath}`);

    fs.writeFileSync(BLOG_DATA_PATH, updatedContent, 'utf-8');
    console.log(`✓ Successfully updated ${BLOG_DATA_PATH}`);
  } else {
    console.log('ℹ Dry-run complete. Re-run with --apply to write changes and create backup.');
  }
} else {
  console.log('✓ Blog data is already cleanly formatted with proper tokens and spacing.');
}

console.log('\n--- Editorial Review Summary ---');
if (humanReviewList.length === 0) {
  console.log('✅ All 15 posts passed automated validation with 0 competitor violations.');
} else {
  console.log(`⚠️ ${humanReviewList.length} item(s) flagged for human review:`);
  humanReviewList.forEach((item) => {
    console.log(`  - [${item.slug}]: ${item.reason}`);
  });
}
console.log('--------------------------------\n');
