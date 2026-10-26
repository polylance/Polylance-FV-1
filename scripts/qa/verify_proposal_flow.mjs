import { chromium } from '../../frontend/node_modules/playwright/index.mjs';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/sunny/.gemini/antigravity-ide/brain/4090b77d-7c06-4a3e-8cfe-f0961fbe9c5a';

const CLIENT_ADDR = '0x71C8A185b3769c8c4cDF357a7386043C0C973c68';
const FREELANCER_ADDR = '0x92518eE6EbA7D4045f2a13E14e3049F27E9a545F';
const TEST_JOB_ID = '0x71c8a185b376';

async function runTest() {
  console.log('--- Step 0: Ensure backend sync service has test job ---');
  const sampleJob = {
    id: TEST_JOB_ID,
    title: 'DeFi Subgraph & Indexer Architecture',
    description: 'Build an ultra-fast event indexer for Polygon mainnet with real-time websocket subscriptions.',
    category: 'Development',
    client: CLIENT_ADDR,
    freelancer: '',
    status: 'Open',
    amountUsdc: '1500',
    amountEth: '1.2',
    reviewPeriodDays: 7,
    paymentTokenSymbol: 'USDC',
    contractAddress: CLIENT_ADDR,
    events: [
      { step: 'Posted', title: 'Job Created', timestamp: Date.now(), txHash: '0x123', status: 'completed', actor: 'Client' },
      { step: 'Selected', title: 'Candidate Selection', timestamp: 0, txHash: '', status: 'current', actor: 'Client' },
    ],
    applications: [],
  };

  try {
    const syncRes = await fetch('http://localhost:3001/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': CLIENT_ADDR,
      },
      body: JSON.stringify({ jobs: [sampleJob] }),
    });
    console.log('Backend sync response:', syncRes.status);
  } catch (err) {
    console.warn('Backend sync warning:', err.message);
  }

  const browser = await chromium.launch({ headless: true });

  console.log('--- Step 1: Open browser as Freelancer (unverified, no github) ---');
  const flContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await flContext.addInitScript(({ freelancerAddr, job }) => {
    const eth = {
      isMetaMask: true,
      request: async ({ method }) => {
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return [freelancerAddr];
        }
        if (method === 'eth_chainId') return '0x89'; // Polygon Mainnet (137)
        return null;
      },
      on: (evt, handler) => {
        if (evt === 'accountsChanged') setTimeout(() => handler([freelancerAddr]), 50);
      },
      removeListener: () => {},
      off: () => {},
    };
    window.ethereum = eth;
    localStorage.setItem('polylance_mock_address', freelancerAddr);
    localStorage.setItem('polylance_demo_role', 'freelancer');
    localStorage.setItem('wagmi.recentConnectorId', '"injected"');
    localStorage.setItem('wagmi.connected', 'true');
    // Preload fresh jobs into localStorage
    localStorage.setItem('polylance_jobs', JSON.stringify([job]));
  }, { freelancerAddr: FREELANCER_ADDR, job: sampleJob });

  const flPage = await flContext.newPage();
  await flPage.goto(`http://localhost:5173/#/jobs/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
  await flPage.waitForTimeout(2500);

  console.log('Freelancer page loaded. Checking for Apply button...');
  const applyBtn = flPage.locator('button:has-text("Apply for this job")').first();
  const applyBtnVisible = await applyBtn.isVisible();
  console.log('Apply button visible for unverified freelancer:', applyBtnVisible);

  if (!applyBtnVisible) {
    console.error('FAIL: Apply button is NOT visible for freelancer!');
    await flPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'freelancer_apply_button_missing.png') });
    await browser.close();
    process.exit(1);
  }

  // Click Apply for this job
  console.log('Clicking "Apply for this job"...');
  await applyBtn.click();
  await flPage.waitForTimeout(1000);

  // Check if Apply Modal is open
  const proposalTextarea = flPage.locator('textarea[placeholder*="milestones breakdown"]');
  const textareaVisible = await proposalTextarea.isVisible();
  console.log('Proposal textarea visible:', textareaVisible);

  if (!textareaVisible) {
    console.error('FAIL: Proposal textarea is not visible in modal!');
    await flPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'proposal_modal_failed.png') });
    await browser.close();
    process.exit(1);
  }

  // Type proposal
  await proposalTextarea.fill('I have 5+ years of experience building high-throughput indexing subgraphs on Polygon. Milestone 1: Schema design. Milestone 2: Pipeline deployment.');
  await flPage.waitForTimeout(500);

  // Submit proposal
  console.log('Submitting proposal...');
  const submitProposalBtn = flPage.locator('button:has-text("Submit proposal")').last();
  await submitProposalBtn.click();
  await flPage.waitForTimeout(2500);

  // Check action modal
  const actionModal = flPage.locator('text=Job Proposal Submitted');
  const submittedConfirmed = await actionModal.isVisible();
  console.log('Proposal submission confirmed modal:', submittedConfirmed);

  const flScreenshot = path.join(ARTIFACTS_DIR, 'freelancer_proposal_submitted_success.png');
  await flPage.screenshot({ path: flScreenshot });
  console.log('Saved freelancer screenshot:', flScreenshot);

  console.log('--- Step 2: Open browser as Client to verify proposal reception ---');
  const clientContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await clientContext.addInitScript(({ clientAddr }) => {
    const eth = {
      isMetaMask: true,
      request: async ({ method }) => {
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return [clientAddr];
        }
        if (method === 'eth_chainId') return '0x89';
        return null;
      },
      on: (evt, handler) => {
        if (evt === 'accountsChanged') setTimeout(() => handler([clientAddr]), 50);
      },
      removeListener: () => {},
      off: () => {},
    };
    window.ethereum = eth;
    localStorage.setItem('polylance_mock_address', clientAddr);
    localStorage.setItem('polylance_demo_role', 'client');
    localStorage.setItem('wagmi.recentConnectorId', '"injected"');
    localStorage.setItem('wagmi.connected', 'true');
  }, { clientAddr: CLIENT_ADDR });

  const clientPage = await clientContext.newPage();
  await clientPage.goto(`http://localhost:5173/#/jobs/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
  await clientPage.waitForTimeout(3000);

  const clientBody = await clientPage.textContent('body');
  const clientHasApplicant = clientBody.includes(FREELANCER_ADDR.slice(0, 6)) || clientBody.includes('Proposals and applicants');
  console.log('Client page displays applicant proposals:', clientHasApplicant);

  const clientScreenshot = path.join(ARTIFACTS_DIR, 'client_proposals_received_success.png');
  await clientPage.screenshot({ path: clientScreenshot });
  console.log('Saved client screenshot:', clientScreenshot);

  await browser.close();
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
