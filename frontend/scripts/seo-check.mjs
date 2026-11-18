#!/usr/bin/env node
import { validateSeoSystem } from '../src/seo/validate';

console.log('🔍 [PolyLance SEO Check] Validating routes, keywords, FAQs, and blog posts...');

const result = validateSeoSystem();

if (result.issues.length > 0) {
  console.log('\n--- SEO Audit Report ---');
  for (const issue of result.issues) {
    const icon = issue.type === 'error' ? '❌' : '⚠️';
    console.log(`${icon} [${issue.type.toUpperCase()}] [${issue.entity}] ${issue.field}: ${issue.message}`);
  }
}

if (!result.valid) {
  console.error('\n❌ SEO Validation FAILED with blocking errors.');
  process.exit(1);
} else {
  console.log(`\n✅ PolyLance SEO Validation PASSED (0 errors, ${result.issues.length} warnings).`);
  process.exit(0);
}
