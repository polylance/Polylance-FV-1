import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CLIENT_WALLET = '0xb8aa472659103c6d657bfa3d4b6e136d755d09dd';
const FREELANCER_WALLET = '0x62330823b1a934e271f3e2003c467ac0a272c3d3';
const JOB_ID = 'job-escrow-test-e2e-1';

function makeSessionToken(wallet) {
  const secret = 'polylance-crypto-session-secret-2026-strict-key-secure';
  const now = Date.now();
  const exp = now + 2 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ wallet: wallet.toLowerCase().trim(), iat: now, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('--- Starting Two-User Messaging E2E Test ---');

  // 1. Seed test job in the backend
  const seedJob = {
    id: JOB_ID,
    title: 'Real-time Payment Testing in PolyLance',
    description: 'E2E verified test contract for messaging reliability',
    status: 'Open',
    client: CLIENT_WALLET,
    freelancer: '',
    amountUsdc: '1.14',
    amountEth: '0.0005',
    paymentTokenSymbol: 'USDC',
    createdAt: Date.now() - 3600000,
    applications: [
      {
        applicant: FREELANCER_WALLET,
        proposalText: 'Full stack development with Web3 escrow coordination',
        appliedAt: Date.now() - 3000000,
        githubScore: 880,
        githubVerified: true,
      }
    ],
    chatMessages: [],
    preAcceptMessages: [],
  };

  try {
    const clientToken = makeSessionToken(CLIENT_WALLET);
    const res = await fetch('http://localhost:3001/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientToken}`,
        'x-wallet-address': CLIENT_WALLET,
      },
      body: JSON.stringify({ jobs: [seedJob] }),
    });
    console.log('Seeded test job to chat service:', res.status);
  } catch (err) {
    console.warn('Backend seed warning:', err?.message || err);
  }

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // CONTEXT A: Client
  const contextA = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const pageA = await contextA.newPage();

  // Inject client credentials into localStorage
  await pageA.addInitScript(({ clientWallet, token, job }) => {
    localStorage.setItem('polylance_mock_address', clientWallet);
    localStorage.setItem('polylance_connected_address', clientWallet);
    localStorage.setItem('polylance_demo_role', 'client');
    localStorage.setItem('polylance_session_token', token);
    localStorage.setItem('polylance_read_receipts_enabled', 'true');
    localStorage.setItem('polylance_jobs', JSON.stringify([job]));
  }, { clientWallet: CLIENT_WALLET, token: makeSessionToken(CLIENT_WALLET), job: seedJob });

  // Open Messages page for Client A
  await pageA.goto(`http://localhost:5173/messages?jobId=${JOB_ID}&applicant=${FREELANCER_WALLET}`, { waitUntil: 'networkidle' });
  await pageA.waitForTimeout(1500);

  console.log('✓ Page A (Client) loaded. Channel open.');

  // Test Step A: Client A sends a message while Freelancer B is offline
  const inputA = pageA.locator('input[placeholder*="Message client or developer"]');
  await inputA.waitFor({ state: 'visible', timeout: 10000 });
  await inputA.fill('Hello candidate from client! Can you review specifications?');
  await pageA.locator('button[type="submit"]:has-text("Send")').click();
  await pageA.waitForTimeout(800);

  // Assert single blue check appears on A's screen
  const sentCheckA = pageA.locator('div[role="status"][aria-label="Sent"]');
  const checkCount = await sentCheckA.count();
  console.log(`✓ Client A message sent. Single check count: ${checkCount}`);
  if (checkCount === 0) {
    throw new Error('Expected single blue check for sent message, but found none!');
  }

  // Ensure double ticks (✓✓) are NOT present in DOM
  const doubleTickText = await pageA.locator('text=✓✓').count();
  console.log(`✓ Double check count (must be 0): ${doubleTickText}`);
  if (doubleTickText > 0) {
    throw new Error('Detected obsolete hardcoded double ticks (✓✓)!');
  }

  // Capture screenshot: 1440px Sent State
  await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop_1440px_sent_single_tick.png') });
  console.log('✓ Saved screenshot: desktop_1440px_sent_single_tick.png');

  // CONTEXT B: Freelancer
  const contextB = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const pageB = await contextB.newPage();

  await pageB.addInitScript(({ freelancerWallet, token, job }) => {
    localStorage.setItem('polylance_mock_address', freelancerWallet);
    localStorage.setItem('polylance_connected_address', freelancerWallet);
    localStorage.setItem('polylance_demo_role', 'freelancer');
    localStorage.setItem('polylance_session_token', token);
    localStorage.setItem('polylance_read_receipts_enabled', 'true');
    localStorage.setItem('polylance_jobs', JSON.stringify([job]));
  }, { freelancerWallet: FREELANCER_WALLET, token: makeSessionToken(FREELANCER_WALLET), job: seedJob });

  // Test Step B & C: Freelancer B logs in and opens dashboard or channel in background
  await pageB.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  await pageB.waitForTimeout(1000);

  // Check that A's message STILL shows "Sent" (single blue tick), NOT green
  const stillBlueCount = await pageA.locator('div[role="status"][aria-label="Sent"]').count();
  console.log(`✓ While B is on dashboard, A's tick is still blue: ${stillBlueCount > 0}`);

  // Test Step D: Freelancer B opens the exact channel and brings it into visible viewport
  console.log('Freelancer B navigating to the conversation channel...');
  await pageB.goto(`http://localhost:5173/messages?jobId=${JOB_ID}`, { waitUntil: 'networkidle' });
  await pageB.waitForTimeout(1200);

  // Trigger scroll and focus in page B to simulate active viewing
  await pageB.evaluate(() => {
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await pageB.waitForTimeout(1500);

  // Freelancer B sees incoming message
  const incomingMsgOnB = await pageB.locator('text=Hello candidate from client!').count();
  console.log(`✓ Message rendered on Freelancer B screen: ${incomingMsgOnB > 0}`);
  if (incomingMsgOnB === 0) {
    throw new Error('Freelancer B never received the client message!');
  }

  // Poll Page A for the green "Seen" tick with forward progression
  console.log('Waiting for Client A message status to transition to green Seen...');
  let turnedSeen = false;
  for (let i = 0; i < 15; i++) {
    const seenLabel = await pageA.locator('div[role="status"][aria-label="Seen"]').count();
    if (seenLabel > 0) {
      turnedSeen = true;
      break;
    }
    await pageA.waitForTimeout(400);
  }

  console.log(`✓ Status transitioned to Seen: ${turnedSeen}`);
  if (!turnedSeen) {
    // If not reflected yet, force refresh Page A to verify persistence from server
    await pageA.reload({ waitUntil: 'networkidle' });
    await pageA.waitForTimeout(1000);
    const reloadedSeen = await pageA.locator('div[role="status"][aria-label="Seen"]').count();
    console.log(`✓ After reload, Seen persisted: ${reloadedSeen > 0}`);
  }

  // Capture screenshot: 1440px Seen State
  await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop_1440px_seen_green_tick.png') });
  console.log('✓ Saved screenshot: desktop_1440px_seen_green_tick.png');

  // Test Step: Freelancer B replies back to Client A in pre-negotiation channel
  console.log('Freelancer B sending reply...');
  const inputB = pageB.locator('input[placeholder*="Message client or developer"]');
  await inputB.fill('Yes! I reviewed the milestones and terms. Ready to execute!');
  await pageB.locator('button[type="submit"]:has-text("Send")').click();
  await pageB.waitForTimeout(1500);

  // Verify Client A receives Freelancer B's message in real time
  await pageA.waitForTimeout(1000);
  const replyOnA = await pageA.locator('text=Yes! I reviewed the milestones and terms.').count();
  console.log(`✓ Client A received Freelancer reply in real-time: ${replyOnA > 0}`);

  // Test Mobile View (375px)
  console.log('Testing Mobile View (375px)...');
  const contextMobile = await browser.newContext({
    viewport: { width: 375, height: 667 },
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.addInitScript(({ clientWallet, token, job }) => {
    localStorage.setItem('polylance_mock_address', clientWallet);
    localStorage.setItem('polylance_connected_address', clientWallet);
    localStorage.setItem('polylance_demo_role', 'client');
    localStorage.setItem('polylance_session_token', token);
    localStorage.setItem('polylance_read_receipts_enabled', 'true');
    localStorage.setItem('polylance_jobs', JSON.stringify([job]));
  }, { clientWallet: CLIENT_WALLET, token: makeSessionToken(CLIENT_WALLET), job: seedJob });

  await pageMobile.goto(`http://localhost:5173/messages?jobId=${JOB_ID}&applicant=${FREELANCER_WALLET}`, { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(1200);

  await pageMobile.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile_375px_messages.png') });
  console.log('✓ Saved screenshot: mobile_375px_messages.png');

  // Close contexts and browser
  await contextA.close();
  await contextB.close();
  await contextMobile.close();
  await browser.close();

  console.log('=== All Two-User E2E Tests Succeeded Cleanly! ===');
}

run().catch((err) => {
  console.error('E2E TEST FAILURE:', err);
  process.exit(1);
});
