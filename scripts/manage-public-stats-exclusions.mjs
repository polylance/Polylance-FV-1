#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const isApply = process.argv.includes('--apply');
const isDryRun = !isApply || process.argv.includes('--dry-run');

const statePaths = [
  path.resolve(process.cwd(), 'polylance_shared_state.json'),
  path.resolve(process.cwd(), 'polylance-chat-service', 'polylance_shared_state.json')
];

console.log(`=== PolyLance Public Stats Test Data Exclusion Tool ===`);
console.log(`Mode: ${isApply ? 'APPLY (Write changes)' : 'DRY-RUN (Inspection only)'}\n`);

let targetPath = null;
for (const p of statePaths) {
  if (fs.existsSync(p)) {
    targetPath = p;
    break;
  }
}

if (!targetPath) {
  console.error('polylance_shared_state.json not found!');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
const jobs = raw.jobs || [];

const candidates = [];
const nonTest = [];

jobs.forEach((j) => {
  const title = (j.title || '').trim();
  const desc = (j.description || '').trim();
  const combined = (title + ' ' + desc).toLowerCase();

  const isCandidate = (
    combined.includes('test') ||
    combined.includes('testing') ||
    combined.includes('mock') ||
    combined.includes('sample') ||
    combined.includes('dummy') ||
    j.isTest === true
  );

  if (isCandidate) {
    candidates.push(j);
  } else {
    nonTest.push(j);
  }
});

console.log(`Found ${candidates.length} Candidate Test Jobs awaiting approval:\n`);
candidates.forEach((j, i) => {
  console.log(`  ${i + 1}. [${j.id}] "${j.title}"`);
  console.log(`     Status: ${j.status} | Budget: ${j.budget || j.amount || '0'} | PaymentToken: ${j.paymentToken || 'POL'}`);
  console.log(`     Current exclude_from_public_stats: ${!!j.exclude_from_public_stats}\n`);
});

console.log(`Found ${nonTest.length} Non-Test Jobs (will count towards stats):\n`);
nonTest.forEach((j, i) => {
  console.log(`  ${i + 1}. [${j.id}] "${j.title}" (Status: ${j.status}, Budget: ${j.budget || j.amount || '0'})\n`);
});

if (isApply) {
  let updatedCount = 0;
  jobs.forEach((j) => {
    const title = (j.title || '').trim();
    const desc = (j.description || '').trim();
    const combined = (title + ' ' + desc).toLowerCase();
    if (combined.includes('test') || combined.includes('testing') || combined.includes('mock') || combined.includes('sample') || combined.includes('dummy') || j.isTest === true) {
      if (!j.exclude_from_public_stats) {
        j.exclude_from_public_stats = true;
        updatedCount++;
      }
    }
  });

  statePaths.forEach((p) => {
    if (fs.existsSync(p)) {
      const stateObj = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (Array.isArray(stateObj.jobs)) {
        stateObj.jobs.forEach((job) => {
          const t = (job.title || '').toLowerCase();
          const d = (job.description || '').toLowerCase();
          if (t.includes('test') || t.includes('testing') || t.includes('mock') || d.includes('test') || job.isTest === true) {
            job.exclude_from_public_stats = true;
          }
        });
        fs.writeFileSync(p, JSON.stringify(stateObj, null, 2), 'utf-8');
        console.log(`Updated ${p}`);
      }
    }
  });

  console.log(`Successfully flagged ${updatedCount} candidate test jobs with exclude_from_public_stats = true.`);
} else {
  console.log(`Dry-run complete. Run with --apply after user approval to commit changes.`);
}
