#!/usr/bin/env node

/**
 * PolyLance Scrolling Lint Script
 * Detects elements with scrollable overflow classes that miss `data-lenis-prevent`
 * or don't use the `<ScrollArea />` component.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../frontend/src');

const OVERFLOW_REGEX = /className\s*=\s*[`"']([^`"']*\boverflow-(?:y-auto|x-auto|auto|y-scroll|x-scroll|scroll)\b[^`"']*)[`"']/g;

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        walkDir(fullPath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function lintFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  // Exclude ScrollArea itself
  if (filePath.endsWith('ScrollArea.tsx')) {
    return issues;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\boverflow-(?:y-auto|auto|y-scroll)\b/.test(line)) {
      // Check surrounding lines (current line +- 5 lines) for data-lenis-prevent or ScrollArea
      const start = Math.max(0, i - 4);
      const end = Math.min(lines.length - 1, i + 4);
      const windowSnippet = lines.slice(start, end + 1).join('\n');

      const hasLenisPrevent = windowSnippet.includes('data-lenis-prevent');
      const isHtmlOrBody = windowSnippet.includes('documentElement') || windowSnippet.includes('body');

      if (!hasLenisPrevent && !isHtmlOrBody) {
        issues.push({
          line: i + 1,
          snippet: line.trim(),
        });
      }
    }
  }

  return issues;
}

function main() {
  const files = walkDir(SRC_DIR);
  let totalIssues = 0;

  console.log(`🔍 Scanning ${files.length} React components for scroll safety...`);

  for (const file of files) {
    const issues = lintFile(file);
    if (issues.length > 0) {
      const relPath = path.relative(path.resolve(__dirname, '..'), file);
      console.warn(`\n⚠️  [Scroll Isolation Warning] ${relPath}:`);
      for (const issue of issues) {
        console.warn(`    Line ${issue.line}: ${issue.snippet}`);
      }
      totalIssues += issues.length;
    }
  }

  if (totalIssues === 0) {
    console.log('\n✅ All scrollable sub-containers are properly isolated with data-lenis-prevent or ScrollArea!');
  } else {
    console.warn(`\n⚠️  Found ${totalIssues} scrollable container(s) potentially missing data-lenis-prevent.`);
    console.warn('See SCROLLING.md for guidelines on wrapping sub-containers in <ScrollArea /> or data-lenis-prevent.\n');
  }
}

main();
