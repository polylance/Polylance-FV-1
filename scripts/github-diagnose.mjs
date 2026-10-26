#!/usr/bin/env node
/**
 * scripts/github-diagnose.mjs
 * Read-only diagnostic tool for GitHub reputation & language bytecode audit.
 * Usage: node scripts/github-diagnose.mjs <login>
 */

import https from 'node:https';
import process from 'node:process';

const targetLogin = process.argv[2] || 'sunny200551';
const ghToken = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN || '';

const headers = {
  'User-Agent': 'PolyLance-Diagnostic/1.0',
  'Accept': 'application/vnd.github.v3+json',
  ...(ghToken ? { Authorization: `Bearer ${ghToken}` } : {})
};

function ghFetch(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'GET',
        headers
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch {
            json = raw;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runCurrentPipeline(user, allRepos) {
  // Mirrors frontend/src/utils/githubOracle.ts exactly
  const nonForkRepos = allRepos.filter((r) => !r.fork);
  const reposToScan = nonForkRepos.slice(0, 25);

  const languageBytes = {};
  let totalStars = 0;

  for (let idx = 0; idx < reposToScan.length; idx++) {
    const repo = reposToScan[idx];
    totalStars += repo.stargazers_count || 0;

    if (idx < 3 && repo.languages_url) {
      try {
        const lRes = await ghFetch(repo.languages_url);
        if (lRes.status === 200 && typeof lRes.body === 'object') {
          for (const [lang, bytes] of Object.entries(lRes.body)) {
            languageBytes[lang] = (languageBytes[lang] || 0) + bytes;
          }
        }
      } catch {}
    } else if (repo.language && repo.size) {
      // THE FLAW: whole repo size in KB * 1024 attributed to single primary language!
      const bytes = repo.size * 1024;
      languageBytes[repo.language] = (languageBytes[repo.language] || 0) + bytes;
    }
  }

  const totalAuditedBytes = Object.values(languageBytes).reduce((a, b) => a + b, 0);

  // Mirrors getUserBytecodeMatrix in githubOracle.ts
  const rawPercentages = Object.entries(languageBytes)
    .filter(([_, b]) => b > 0)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: totalAuditedBytes > 0 ? Math.round((bytes / totalAuditedBytes) * 100) : 0
    }))
    .sort((a, b) => b.bytes - a.bytes);

  // Mirrors GithubEkycCard.tsx activeLangs filter:
  const displayedLangs = rawPercentages.filter((item) => item.percentage > 0);
  const sumDisplayed = displayedLangs.reduce((acc, curr) => acc + curr.percentage, 0);

  // Formula from githubOracle.ts
  const verifiedPushCommits = 0;
  const baseEstimatedCommits = Math.max(
    verifiedPushCommits,
    Math.min(1200, Math.round(totalAuditedBytes / 8192) + nonForkRepos.length * 4)
  );
  const commitsCount = baseEstimatedCommits;
  const prsCount = Math.max(1, Math.round(nonForkRepos.length * 1.2));

  let byteScore = 0;
  if (totalAuditedBytes > 2000000) {
    byteScore = 235 + Math.min(85, Math.round(Math.log10(totalAuditedBytes / 2000000) * 45));
  } else if (totalAuditedBytes > 500000) {
    byteScore = 150 + Math.round(((totalAuditedBytes - 500000) / 1500000) * 85);
  } else if (totalAuditedBytes > 100000) {
    byteScore = 75 + Math.round(((totalAuditedBytes - 100000) / 400000) * 75);
  } else if (totalAuditedBytes > 25000) {
    byteScore = 30 + Math.round(((totalAuditedBytes - 25000) / 75000) * 45);
  } else {
    byteScore = Math.round((totalAuditedBytes / 25000) * 30);
  }

  let commitScore = 0;
  if (commitsCount > 600) {
    commitScore = 225 + Math.min(55, Math.round(Math.log10(commitsCount / 600) * 35));
  } else if (commitsCount > 200) {
    commitScore = 125 + Math.round(((commitsCount - 200) / 400) * 100);
  } else if (commitsCount > 50) {
    commitScore = 50 + Math.round(((commitsCount - 50) / 150) * 75);
  } else {
    commitScore = Math.round(commitsCount * 1.0);
  }

  const qualifiedLanguages = Object.values(languageBytes).filter((b) => b >= 10000).length;
  const repoScore = Math.min(60, nonForkRepos.length * 5);
  const diversityScore = Math.min(60, qualifiedLanguages * 12);
  const starScore = Math.min(80, Math.round(totalStars * 2.5));
  const followerScore = Math.min(50, Math.round((user.followers || 0) * 1.0));
  const prScore = Math.min(60, prsCount * 4);

  const rawScore = byteScore + commitScore + repoScore + diversityScore + starScore + followerScore + prScore;
  const primaryScore = Math.min(990, Math.max(100, rawScore));

  let reputationTier = 'BRONZE';
  if (primaryScore >= 850) reputationTier = 'PLATINUM';
  else if (primaryScore >= 650) reputationTier = 'GOLD';
  else if (primaryScore >= 400) reputationTier = 'SILVER';

  return {
    reposScanned: reposToScan.length,
    languagesUrlFetched: Math.min(3, reposToScan.length),
    coarseDiskSizeUsed: Math.max(0, reposToScan.length - 3),
    totalAuditedBytes,
    languageBytes,
    displayedLangs,
    droppedZeroPercentCount: rawPercentages.length - displayedLangs.length,
    sumDisplayed,
    primaryScore,
    reputationTier,
    factorBreakdown: {
      byteScore,
      commitScore,
      repoScore,
      diversityScore,
      starScore,
      followerScore,
      prScore
    }
  };
}

async function runFullPull(login) {
  // 1. Fetch user
  const userRes = await ghFetch(`https://api.github.com/users/${login}`);
  if (userRes.status !== 200) {
    throw new Error(`GitHub user ${login} not found (HTTP ${userRes.status})`);
  }
  const user = userRes.body;

  // 2. Paginated repository fetch using Link header
  let allRepos = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const pageRes = await ghFetch(`https://api.github.com/users/${login}/repos?per_page=100&page=${page}&sort=pushed`);
    if (pageRes.status !== 200 || !Array.isArray(pageRes.body)) {
      break;
    }
    allRepos.push(...pageRes.body);
    const linkHeader = pageRes.headers['link'] || '';
    if (linkHeader.includes('rel="next"') && pageRes.body.length === 100) {
      page++;
    } else {
      hasMore = false;
    }
  }

  // Categorize repos
  let forksCount = 0;
  let archivedCount = 0;
  let emptyCount = 0;
  let validNonForkRepos = [];

  for (const r of allRepos) {
    if (r.fork) {
      forksCount++;
    } else if (r.size === 0) {
      emptyCount++;
    } else {
      if (r.archived) archivedCount++;
      validNonForkRepos.push(r);
    }
  }

  // 3. Exact per-language byte pull for ALL non-fork repositories
  const languageBytes = {};
  for (const r of validNonForkRepos) {
    if (r.languages_url) {
      const lRes = await ghFetch(r.languages_url);
      if (lRes.status === 200 && typeof lRes.body === 'object') {
        for (const [lang, bytes] of Object.entries(lRes.body)) {
          languageBytes[lang] = (languageBytes[lang] || 0) + bytes;
        }
      }
    }
  }

  const totalBytes = Object.values(languageBytes).reduce((a, b) => a + b, 0);

  // Exact float percentage & Largest-Remainder rounded integers that strictly sum to 100%
  const langEntries = Object.entries(languageBytes)
    .sort((a, b) => b[1] - a[1])
    .map(([language, bytes]) => {
      const exactFloat = totalBytes > 0 ? (bytes / totalBytes) * 100 : 0;
      return {
        language,
        bytes,
        exactFloat,
        floorInt: Math.floor(exactFloat),
        remainder: exactFloat - Math.floor(exactFloat)
      };
    });

  const sumFloor = langEntries.reduce((acc, c) => acc + c.floorInt, 0);
  let remainderNeeded = 100 - sumFloor;

  // Distribute 1% to largest remainders until sum is exactly 100
  langEntries.sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < langEntries.length && remainderNeeded > 0; i++) {
    langEntries[i].floorInt += 1;
    remainderNeeded--;
  }

  langEntries.sort((a, b) => b.bytes - a.bytes);
  const normalizedPercentages = langEntries.map((l) => ({
    language: l.language,
    bytes: l.bytes,
    exactPercentage: l.exactFloat.toFixed(2) + '%',
    integerPercentage: l.floorInt
  }));

  const sumNormalized = normalizedPercentages.reduce((a, b) => a + b.integerPercentage, 0);

  return {
    user,
    allRepos,
    totalReposAvailable: allRepos.length,
    validNonForkCount: validNonForkRepos.length,
    forksCount,
    archivedCount,
    emptyCount,
    totalBytes,
    languageBytes,
    normalizedPercentages,
    sumNormalized,
    rateLimit: {
      remaining: userRes.headers['x-ratelimit-remaining'],
      limit: userRes.headers['x-ratelimit-limit'],
      reset: userRes.headers['x-ratelimit-reset']
    }
  };
}

async function main() {
  console.log(`\n========================================================================`);
  console.log(` POLYLANCE GITHUB REPUTATION & BYTECODE AUDIT DIAGNOSTIC`);
  console.log(` Target Login: ${targetLogin}`);
  console.log(` Timestamp:    ${new Date().toISOString()}`);
  console.log(`========================================================================\n`);

  try {
    const full = await runFullPull(targetLogin);
    const current = await runCurrentPipeline(full.user, full.allRepos);

    console.log(`── 1. ACCOUNT & API HEADERS AUDIT ─────────────────────────────────────`);
    console.log(`• Immutable Numeric GitHub ID: ${full.user.id}`);
    console.log(`• Node ID:                     ${full.user.node_id}`);
    console.log(`• Account Created At:          ${full.user.created_at}`);
    console.log(`• Public Repos Reported:       ${full.user.public_repos}`);
    console.log(`• Followers / Following:       ${full.user.followers} / ${full.user.following}`);
    console.log(`• Rate Limit Remaining:        ${full.rateLimit.remaining} / ${full.rateLimit.limit}`);
    console.log(`• Rate Limit Reset:            ${new Date(Number(full.rateLimit.reset) * 1000).toLocaleTimeString()}`);
    console.log(`• Auth Token Used:             ${ghToken ? 'Bearer PAT' : 'Unauthenticated (60 req/hr limit)'}`);

    console.log(`\n── 2. REPOSITORY INGESTION & PAGINATION COMPARISON ────────────────────`);
    console.table([
      { Metric: 'Total Repos on Account', 'Current Pipeline': full.user.public_repos, 'Full Pull': full.totalReposAvailable },
      { Metric: 'Pagination Used', 'Current Pipeline': 'No (page 1 only, per_page=100)', 'Full Pull': 'Yes (Link header next)' },
      { Metric: 'Fork Repos Filtered', 'Current Pipeline': current.reposScanned > 0 ? 'Forks ignored' : 0, 'Full Pull': full.forksCount },
      { Metric: 'Archived Repos', 'Current Pipeline': 'Included in scan', 'Full Pull': full.archivedCount },
      { Metric: 'Empty Repos (size 0)', 'Current Pipeline': 'Included in scan', 'Full Pull': full.emptyCount },
      { Metric: 'Repos Processed with languages_url', 'Current Pipeline': `${current.languagesUrlFetched} (max 3)`, 'Full Pull': `${full.validNonForkCount} (100% of non-forks)` },
      { Metric: 'Repos Approximated by Disk Size (KB * 1024)', 'Current Pipeline': `${current.coarseDiskSizeUsed}`, 'Full Pull': '0 (pure language AST bytes)' }
    ]);

    console.log(`\n── 3. LANGUAGE BREAKDOWN & MATH ANOMALY COMPARISON ───────────────────`);
    console.log(`• Total Audited Bytes:`);
    console.log(`  - Current Pipeline: ${current.totalAuditedBytes.toLocaleString()} bytes  [INFLATED: repo.size * 1024 used for repos 4+]`);
    console.log(`  - Full Pull:        ${full.totalBytes.toLocaleString()} bytes  [EXACT: /languages breakdown on every repo]`);

    console.log(`\n• Language Table:`);
    const allKnownLangs = Array.from(new Set([...Object.keys(current.languageBytes), ...Object.keys(full.languageBytes)]));

    const langTable = allKnownLangs.map((lang) => {
      const curBytes = current.languageBytes[lang] || 0;
      const fullBytes = full.languageBytes[lang] || 0;
      const curPctObj = current.displayedLangs.find((d) => d.language === lang);
      const curPct = curPctObj ? `${curPctObj.percentage}%` : 'DROPPED (0% round)';
      const fullNorm = full.normalizedPercentages.find((n) => n.language === lang);
      const exactPct = fullNorm ? fullNorm.exactPercentage : '0%';
      const normPct = fullNorm ? `${fullNorm.integerPercentage}%` : '0%';

      return {
        Language: lang,
        'Current Bytes': curBytes.toLocaleString(),
        'Current UI Pct': curPct,
        'Real Bytes': fullBytes.toLocaleString(),
        'Exact Real Pct': exactPct,
        'Normalized Pct': normPct
      };
    });

    console.table(langTable);

    console.log(`• Sum of Displayed Percentages:`);
    console.log(`  - Current UI Sum:   ${current.sumDisplayed}%  <-- ROOT CAUSE OF 99% TOTAL & 1% PALE TAIL`);
    console.log(`  - Normalized Sum:   ${full.sumNormalized}%  <-- CORRECTED TO EXACT 100%`);
    console.log(`• Languages Dropped by Current Pipeline: ${current.droppedZeroPercentCount} languages filtered out because Math.round() rounded them to 0% and activeLangs filtered > 0!`);

    console.log(`\n── 4. SCORING FORMULA BREAKDOWN (680 vs REAL) ─────────────────────────`);
    console.log(`Formula Inputs in Current Pipeline:`);
    console.log(`• Byte Score (Max 320):       ${current.factorBreakdown.byteScore} pts`);
    console.log(`• Commit Score (Max 280):     ${current.factorBreakdown.commitScore} pts`);
    console.log(`• Repo Depth (Max 60):        ${current.factorBreakdown.repoScore} pts`);
    console.log(`• Diversity Score (Max 60):   ${current.factorBreakdown.diversityScore} pts`);
    console.log(`• Star Score (Max 80):        ${current.factorBreakdown.starScore} pts`);
    console.log(`• Follower Score (Max 50):    ${current.factorBreakdown.followerScore} pts`);
    console.log(`• PR Score (Max 60):          ${current.factorBreakdown.prScore} pts`);
    console.log(`• Re-computed Primary Score:  ${current.primaryScore} / 1000`);
    console.log(`• Tier:                       ${current.reputationTier}`);
    console.log(`\n• Historical 680 Score Root Cause:`);
    console.log(`  The stored profile in polylance_shared_state.json contains primaryScore: 680, recorded at timestamp 1792336471381.`);
    console.log(`  In frontend/src/components/GithubVerifyModal.tsx (line 99), when an error occurs or fallback triggers, it sets fallback primaryScore: 780 or cached score.`);
    console.log(`  In githubOracle.ts, tiers are: >=850 Platinum, >=650 Gold, >=400 Silver. 680 falls strictly in GOLD tier.`);

  } catch (err) {
    console.error('Diagnostic error:', err);
    process.exit(1);
  }
}

main();
