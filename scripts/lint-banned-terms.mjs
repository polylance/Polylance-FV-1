/**
 * PolyLance Banned Competitor Terms Linter (CI Guardrail)
 * Scans repository source files, public assets, docs, and built output
 * to ensure zero competitor mentions or comparative assertions exist.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BANNED_TERMS = [
  'upwork',
  'fiverr',
  'fivrr',
  'freelancer.com',
  'toptal',
  'all rights reserved'
];

// Directories and files to scan
const SCAN_TARGETS = [
  'frontend/src',
  'frontend/public',
  'frontend/scripts',
  'frontend/dist',
  'polylance-chat-service/src',
  'contracts',
  'README.md'
];

// Explicit exceptions (e.g. legacy 301 route redirects in App.tsx and compiled bundle)
const WHITELISTED_PATTERNS = [
  {
    file: 'frontend/src/App.tsx',
    allowedLines: [
      'path="/upwork-alternative"',
      'path="/fiverr-alternative"'
    ]
  },
  {
    fileMatches: (rel) => rel.startsWith('frontend/dist/assets/') && rel.endsWith('.js'),
    allowedTerms: ['upwork', 'fiverr'],
    allowedContext: (line) => line.includes('/upwork-alternative') || line.includes('/fiverr-alternative')
  }
];

const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
  '.woff', '.woff2', '.ttf', '.eot', '.pdf',
  '.map'
]);

let violations = [];
let scannedFileCount = 0;

function shouldIgnoreFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (IGNORED_EXTENSIONS.has(ext)) return true;
  if (filePath.includes('node_modules')) return true;
  if (filePath.includes('.git')) return true;
  if (filePath.endsWith('lint-banned-terms.mjs')) return true;
  return false;
}

function checkFile(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineLower = line.toLowerCase();
    
    for (const term of BANNED_TERMS) {
      if (lineLower.includes(term)) {
        // Check whitelist
        const isWhitelisted = WHITELISTED_PATTERNS.some(w => {
          if (w.file === relativePath && w.allowedLines) {
            return w.allowedLines.some(allowed => line.includes(allowed));
          }
          if (w.fileMatches && w.fileMatches(relativePath)) {
            if (w.allowedTerms.includes(term) && w.allowedContext(line)) {
              return true;
            }
          }
          return false;
        });

        if (!isWhitelisted) {
          violations.push({
            file: relativePath,
            line: index + 1,
            term,
            snippet: line.trim()
          });
        }
      }
    }
  });

  scannedFileCount++;
}

function scanDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        scanDir(fullPath);
      }
    } else if (entry.isFile()) {
      if (!shouldIgnoreFile(fullPath)) {
        checkFile(fullPath);
      }
    }
  }
}

console.log('🔍 [PolyLance Banned Terms Linter] Scanning codebase for competitor terms...');

for (const target of SCAN_TARGETS) {
  const fullTarget = path.join(ROOT_DIR, target);
  if (fs.existsSync(fullTarget)) {
    const stat = fs.statSync(fullTarget);
    if (stat.isDirectory()) {
      scanDir(fullTarget);
    } else if (stat.isFile()) {
      if (!shouldIgnoreFile(fullTarget)) {
        checkFile(fullTarget);
      }
    }
  }
}

console.log(`✓ Scanned ${scannedFileCount} files.`);

if (violations.length > 0) {
  console.error(`\n❌ Found ${violations.length} prohibited competitor term violation(s):`);
  violations.slice(0, 10).forEach(v => {
    console.error(`  - [${v.term.toUpperCase()}] ${v.file}:${v.line} -> "${v.snippet.slice(0, 100)}"`);
  });
  console.error('\nPolyLance policy prohibits any competitor comparisons anywhere in code, SEO, docs, or UI.');
  process.exit(1);
} else {
  console.log('✅ Zero prohibited competitor terms found. Clean repository.');
  process.exit(0);
}
