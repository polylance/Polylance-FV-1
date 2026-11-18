import fs from 'fs';
import path from 'path';

const stateFile = path.resolve(process.cwd(), 'polylance_shared_state.json');
const raw = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
const jobs = raw.jobs || [];

console.log(`Total jobs in state: ${jobs.length}`);

const candidateTestJobs = [];
const nonTestJobs = [];

jobs.forEach(j => {
  const title = j.title || '';
  const desc = j.description || '';
  const lower = (title + ' ' + desc).toLowerCase();
  const isCandidate = (
    lower.includes('test') ||
    lower.includes('testing') ||
    lower.includes('mock') ||
    lower.includes('sample') ||
    lower.includes('dummy') ||
    j.isTest === true ||
    j.exclude_from_public_stats === true
  );

  const info = {
    id: j.id,
    title: j.title,
    status: j.status,
    budget: j.budget || j.amount || j.amountUsdc,
    paymentToken: j.paymentToken || j.token || 'POL',
    exclude_from_public_stats: !!j.exclude_from_public_stats
  };

  if (isCandidate) {
    candidateTestJobs.push(info);
  } else {
    nonTestJobs.push(info);
  }
});

console.log(`\nCandidate Test Jobs (${candidateTestJobs.length}):`);
candidateTestJobs.forEach((j, idx) => {
  console.log(`${idx + 1}. [${j.id}] "${j.title}" | Status: ${j.status} | Budget: ${j.budget} ${j.paymentToken} | Excluded: ${j.exclude_from_public_stats}`);
});

console.log(`\nNon-Test Jobs (${nonTestJobs.length}):`);
nonTestJobs.forEach((j, idx) => {
  console.log(`${idx + 1}. [${j.id}] "${j.title}" | Status: ${j.status} | Budget: ${j.budget} ${j.paymentToken} | Excluded: ${j.exclude_from_public_stats}`);
});
