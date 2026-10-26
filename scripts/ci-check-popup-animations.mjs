#!/usr/bin/env node

/**
 * CI Guardrail: Ensures every popup and dialog in PolyLance uses the shared
 * animated overlay primitives rather than raw un-animated `fixed inset-0` containers.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '../frontend/src');

// Allowed files that define the actual primitives or portal containers
const ALLOWLIST = new Set([
  path.normalize('components/overlay/Modal.tsx'),
  path.normalize('components/overlay/Sheet.tsx'),
  path.normalize('components/overlay/OverlayRoot.tsx'),
  path.normalize('components/mobile/Drawer.tsx'),
  path.normalize('components/mobile/BottomSheet.tsx'),
  path.normalize('components/video/VideoModal.tsx'), // wraps Modal with specific styling
  path.normalize('components/LoadingScreen.tsx'), // system full-page loading screen
  path.normalize('components/demo/GuidedTour.tsx'), // guided tour spotlight layer
  path.normalize('pages/Manifesto.tsx'), // full-screen photo lightbox with Framer Motion variants
  path.normalize('pages/JobWorkspace.tsx'), // fixed-position job switcher dropdown with Framer Motion variants
]);

let violations = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.normalize(path.relative(SRC_DIR, fullPath));

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '__tests__') {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
      if (ALLOWLIST.has(relPath)) {
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf8');

      // Check for raw fixed inset-0 overlays that act as hand-built modal backdrops
      // e.g. <div className="fixed inset-0 ... z-50 ... bg-slate-900
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const hasFixedInset = /className=["'][^"']*fixed\s+inset-0[^"']*["']/.test(line);
        const hasRawDialog = /role=["']dialog["']/.test(line);

        if (hasFixedInset && (line.includes('bg-') || line.includes('backdrop') || line.includes('z-50') || line.includes('z-[') || hasRawDialog)) {
          // If it's not a primitive definition or test mock, flag it
          violations.push({
            file: relPath,
            line: lineNum,
            content: line.trim(),
            reason: 'Raw fixed inset-0 overlay detected. Must use shared <Modal />, <Sheet />, or <Popover />.',
          });
        }
      });
    }
  }
}

console.log('🔍 Scanning frontend/src for un-animated popup overlays...');
scanDirectory(SRC_DIR);

if (violations.length > 0) {
  console.error('\n❌ Popup Animation CI Check Failed: Found un-migrated raw popup overlays:');
  for (const v of violations) {
    console.error(`  - ${v.file}:${v.line} -> ${v.reason}`);
    console.error(`    Code: ${v.content}`);
  }
  console.error('\nPlease migrate these popups to use <Modal />, <Sheet />, or <Popover /> from frontend/src/components/overlay.\n');
  process.exit(1);
} else {
  console.log('✅ Popup Animation CI Check Passed: All popups use compliant animated primitives.\n');
  process.exit(0);
}
