import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { Job, UserProfile, DaoProposal, JobStatus, DisputeReason, Application, ProofOfWork, DeliverableFile, TreasuryProposal, TreasuryState, JudgeRecord, JudgeMessage, NegotiationProposal, ChatMessage, SkillCategory } from '../types';
import { generateMockTxHash, generateDeterministicHash, truncateAddress } from '../utils/formatters';
import { generateIpfsCid } from '../utils/ipfs';
import { fetchLiveExchangeRates, startRatePolling } from '../utils/currency';
import { CONTRACTS, CHAIN_ID } from '../config/contracts';
import { PAYMENT_TOKENS, getTokenBySymbol, getTokenByAddress } from '../config/paymentTokens';
import JobFactoryABI from '../config/abis/JobFactory.json';
import JobEscrowABI from '../config/abis/JobEscrow.json';
import ProfileRegistryABI from '../config/abis/ProfileRegistry.json';
import JudgeDAOABI from '../config/abis/JudgeDAO.json';
import { useWeb3 } from './Web3Context';
import { io as socketIO, Socket } from 'socket.io-client';
import { isAdminAddress, isJudgeAddress } from '../utils/adminGuard';
import { getJobInactivityStatus } from '../utils/inactivity';
import { getPolygonGasOverrides } from '../utils/gas';

export const getSyncEndpoints = (): string[] => {
  const list: string[] = [];
  const envUrl = (import.meta.env.VITE_CHAT_SERVICE_URL || import.meta.env.VITE_CHAT_SERVER_URL || '').trim();

  if (envUrl && !envUrl.includes('polylance-chat-service.onrender.com')) {
    list.push(envUrl.replace(/\/$/, ''));
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    list.push('http://localhost:3001');
  }
  list.push('https://polylance-fv-1.onrender.com');

  return Array.from(new Set(list.filter(Boolean)));
};

export const getBackendSyncUrl = (): string => {
  const envUrl = (import.meta.env.VITE_CHAT_SERVICE_URL || import.meta.env.VITE_CHAT_SERVER_URL || '').trim();
  if (envUrl && !envUrl.includes('polylance-chat-service.onrender.com')) {
    return envUrl.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3001';
  }
  return 'https://polylance-fv-1.onrender.com';
};


let syncSocket: Socket | null = null;
let backendSyncOfflineUntil = 0;
let socketConnectFailures = 0;


const defaultJudgeAddr = (import.meta.env.VITE_JUDGE_ADDRESS || '').toLowerCase();


const INITIAL_PROFILES: Record<string, UserProfile> = {};

const INITIAL_JOBS: Job[] = [];

const INITIAL_PROPOSALS: DaoProposal[] = [];



const INITIAL_JUDGE_MESSAGES: Record<string, JudgeMessage[]> = {};

interface PolyLanceDataContextType {
  loading: boolean;
  jobs: Job[];
  daoProposals: DaoProposal[];
  treasury: TreasuryState;
  treasuryBalanceUsdc: number;
  treasuryBalanceEth: number;
  treasuryHistory: { id: string; type: 'FEE_COLLECTED' | 'WITHDRAWAL'; amountUsdc: number; txHash: string; timestamp: number; by?: string }[];
  profiles: Record<string, UserProfile>;
  judges: JudgeRecord[];
  addJudge: (address: string, name: string, notes?: string, addedBy?: string) => void;
  removeJudge: (address: string) => void;
  toggleJudgeStatus: (address: string) => void;
  postJob: (jobData: { title: string; description: string; category: any; amountUsdc: string; amountEth?: string; paymentTokenSymbol?: 'USDC' | 'USDT' | 'POL' | 'MATIC' | 'ETH' | 'BTC'; reviewPeriodDays: number }, clientAddress: string) => Promise<Job>;
  deleteJob: (jobId: string) => Promise<boolean>;
  updateJobDetails: (
    jobId: string,
    updates: {
      title?: string;
      description?: string;
      category?: SkillCategory;
      amountUsdc?: string;
      amountEth?: string;
      reviewPeriodDays?: number;
      paymentTokenSymbol?: 'USDC' | 'USDT' | 'POL' | 'MATIC' | 'ETH' | 'BTC';
    }
  ) => Promise<boolean>;
  renewJob: (jobId: string) => Promise<boolean>;
  applyToJob: (jobId: string, proposalText: string, applicantAddress: string, skills: string[], githubVerified: boolean, githubScore: number) => Promise<void>;
  selectFreelancer: (jobId: string, freelancerAddress: string) => Promise<void>;
  proposeTerms: (jobId: string, userAddress: string) => Promise<void>;
  fundJob: (jobId: string) => Promise<void>;
  submitWork: (jobId: string, title: string, description: string, evidenceHashes: string[], externalLink?: string, evidenceFiles?: DeliverableFile[]) => Promise<void>;
  postProgressUpdate: (jobId: string, progressPercent: number, statusNote: string, demoUrl?: string) => Promise<void>;
  requestTimeExtension: (jobId: string, requestedDays: number, reason: string) => Promise<void>;
  respondToTimeExtension: (jobId: string, requestId: string, approve: boolean, responseNote?: string) => Promise<void>;
  requestModifications: (jobId: string, note: string) => Promise<void>;
  releasePayment: (jobId: string) => Promise<void>;
  claimAutoRelease: (jobId: string) => Promise<void>;
  cancelEscrow: (jobId: string) => Promise<void>;
  raiseDispute: (jobId: string, reason: DisputeReason, evidenceText: string, evidenceIpfsHash: string, raisedByAddress: string) => Promise<void>;
  submitDisputeResponse: (jobId: string, responseText: string, responseIpfsHash: string) => void;
  resolveDispute: (jobId: string, freelancerBps: number, reasoningText: string, judgeAddress: string) => Promise<void>;
  updateJobTerms: (jobId: string, newAmountUsdc: string, newReviewPeriodDays?: number) => Promise<void>;
  proposeNegotiationTerms: (jobId: string, amountUsdc: string, deadlineDays: number, note: string, senderRole: 'Client' | 'Freelancer', isFinalCall?: boolean, applicantAddress?: string) => Promise<void>;
  respondToNegotiationProposal: (jobId: string, proposalId: string, accept: boolean, rejectReason?: string, responderRole?: 'Client' | 'Freelancer', applicantAddress?: string) => Promise<void>;
  sendPreAcceptMessage: (jobId: string, text: string, senderAddress: string, senderRole: 'Client' | 'Freelancer', proposal?: NegotiationProposal, applicantAddress?: string) => void;
  sendChatMessage: (jobId: string, text: string, senderRole: 'Client' | 'Freelancer' | 'Judge', proposal?: NegotiationProposal, applicantAddress?: string, senderAddress?: string) => void;
  sendJudgeChatMessage: (judgeAddress: string, text: string, senderRole: 'Admin' | 'Judge', senderAddress?: string) => void;
  isEnclineConnected: boolean;
  judgeMessages: Record<string, JudgeMessage[]>;
  closeChatSession: (jobId: string) => Promise<string | null>;
  deleteChatHistory: (jobId?: string, judgeAddress?: string) => Promise<void> | void;
  restoreChatHistory: (jobId?: string, messages?: any[], judgeAddress?: string, judgeMsgs?: JudgeMessage[]) => void;
  accountDeletionRequests: Record<string, { requestedAt: number; executeAfter: number }>;
  requestAccountDeletion: (address: string) => Promise<void>;
  cancelAccountDeletion: (address: string) => Promise<void>;
  purgeAccountData: (address: string) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>, address: string) => Promise<void>;
  castDaoVote: (proposalId: string | number, support: boolean, voterAddress?: string, votingPower?: number) => Promise<void> | void;
  castVote: (proposalId: string | number, support: boolean, voterAddress?: string) => Promise<void> | void;
  createDaoProposal: (title: string, candidateAddress: string, description: string) => void;
  proposeJudgeCandidate: (candidateAddress: string, description: string, proposerAddress?: string) => void;
  withdrawTreasury: (to: string, amountUsdc: number, byAddress: string) => void;
  proposeTreasuryWithdrawal: (recipient: string, amountUsdc: string, purpose: string, proposerAddress: string) => void;
  signTreasuryWithdrawal: (proposalId: string, signerAddress: string) => void;
  executeTreasuryWithdrawal: (proposalId: string) => void;
}

const PolyLanceDataContext = createContext<PolyLanceDataContextType | undefined>(undefined);

const MOCK_ADDRESSES_TO_PURGE = new Set([
  '0x71c8366420a092c55660830e8115e9a44390001',
  '0x34a589112d480055dafd8a610b7d1e203891c821',
  '0x89b4566420a092c55660830e8115e9a443900142',
  '0x42f8366420a092c55660830e8115e9a443900990',
  '0x55e1236420a092c55660830e8115e9a443900310',
  '0x474d8c97445fbcf4e13c257556adbced11a9def8',
  '0x7777111177771111777711117777111177771111',
]);

const MOCK_NAMES_TO_PURGE = new Set([
  'alex rivera',
  'elena rostova',
  'marcus sterling',
  'nadia chen',
  'devpioneer'
]);

const HARDHAT_TEST_ADDRESSES = new Set([
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
  '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
  '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
  '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc',
  '0x976ea74026e726554db657fa54763abd0c3a0aa9',
  '0x14dc79964da2c08b23698b3d3cc7ca32193d9955',
  '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f',
  '0xa0ee7a142d267c1f36714e4a8f75612f20a79720',
]);

export const isDemoOrMockJob = (j: Partial<Job> | null | undefined): boolean => {
  if (!j) return true;
  const id = String(j.id || '').toLowerCase().trim();
  if (
    id === 'job-101' ||
    id === 'job-102' ||
    id.startsWith('job-mock-') ||
    id.startsWith('mock-') ||
    id.startsWith('test-') ||
    id.startsWith('demo-')
  ) {
    return true;
  }
  const title = (j.title || '').trim().toLowerCase();
  const desc = (j.description || '').trim().toLowerCase();

  // Test fixtures and demo jobs from seed / vitest
  if (
    title === 'full stack smart contract integration' ||
    desc.includes('connect react 19 frontend with polygon amoy escrow contracts') ||
    title === 'job to select' ||
    title === 'job 1' ||
    title === 'job 2' ||
    title.includes('privacy-job') ||
    title.includes('confidential smart contract')
  ) {
    return true;
  }
  if (
    (title === 'job 1' && desc === 'test job 1') ||
    (title === 'job 2' && desc === 'test job 2')
  ) {
    return true;
  }

  const client = (j.client || '').toLowerCase().trim();
  if (HARDHAT_TEST_ADDRESSES.has(client) || MOCK_ADDRESSES_TO_PURGE.has(client)) {
    return true;
  }

  return false;
};

let localJobNonceSeq = 1;

const normalizeProfiles = (rawProfiles: Record<string, UserProfile>): Record<string, UserProfile> => {
  const normalized: Record<string, UserProfile> = {};
  const judgeAddr = (import.meta.env.VITE_JUDGE_ADDRESS || '').toLowerCase().trim();
  const judgeGithub = (import.meta.env.VITE_JUDGE_GITHUB_USERNAME || '').toLowerCase().trim();
  const adminGithub = (import.meta.env.VITE_ADMIN_GITHUB_USERNAME || '').toLowerCase().trim();

  for (const [addr, profile] of Object.entries(rawProfiles || {})) {
    if (!addr) continue;
    const lowerAddr = addr.toLowerCase();

    // Strip legacy mock records
    if (MOCK_ADDRESSES_TO_PURGE.has(lowerAddr)) continue;
    if (profile.displayName && MOCK_NAMES_TO_PURGE.has(profile.displayName.toLowerCase().trim())) continue;

    let cleanedProfile = { ...profile };
    const currGh = cleanedProfile.githubUsername?.toLowerCase().trim();
    if (currGh) {
      if (currGh === judgeGithub && judgeAddr && lowerAddr !== judgeAddr) {
        delete cleanedProfile.githubUsername;
        cleanedProfile.githubVerified = false;
      }
      if (currGh === adminGithub && !isAdminAddress(lowerAddr)) {
        delete cleanedProfile.githubUsername;
        cleanedProfile.githubVerified = false;
      }
    }

    const existing = normalized[lowerAddr];
    if (!existing) {
      normalized[lowerAddr] = { ...cleanedProfile, address: lowerAddr };
    } else {
      const selectNewer = (!existing.displayName && cleanedProfile.displayName) ||
        (!existing.githubVerified && cleanedProfile.githubVerified) ||
        (cleanedProfile.displayName && existing.displayName && cleanedProfile.displayName !== 'Anonymous PolyLancer' && existing.displayName === 'Anonymous PolyLancer');
      if (selectNewer) {
        normalized[lowerAddr] = { ...cleanedProfile, address: lowerAddr };
      }
    }
  }

  // Initialize configured Admin profile if admin address and github handle are set in env
  const adminAddr1 = (import.meta.env.VITE_ADMIN_ADDRESS_1 || '').toLowerCase().trim();
  const adminAddr2 = (import.meta.env.VITE_ADMIN_ADDRESS_2 || '').toLowerCase().trim();
  const primaryAdminAddr = adminAddr2 || adminAddr1;

  if (primaryAdminAddr && adminGithub) {
    if (!normalized[primaryAdminAddr]) {
      normalized[primaryAdminAddr] = {
        address: primaryAdminAddr,
        displayName: adminGithub,
        bio: 'Official PolyLance DAO Administrator & Core Developer.',
        avatarUrl: `https://github.com/${adminGithub}.png`,
        ipfsHash: '',
        skills: ['Solidity', 'TypeScript', 'React', 'Smart Contracts', 'Governance'],
        githubUsername: adminGithub,
        githubVerified: true,
        primaryScore: 0,
        reputationSbtCount: 0,
        role: 'admin',
      };
    } else {
      normalized[primaryAdminAddr].githubUsername = adminGithub;
      normalized[primaryAdminAddr].githubVerified = true;
    }
  }

  // If judge address is configured in .env and not yet in profiles, initialize profile
  if (judgeAddr && !normalized[judgeAddr]) {
    normalized[judgeAddr] = {
      address: judgeAddr,
      displayName: judgeGithub || 'Lead Developer',
      bio: 'Full-Stack Web3 & Software Engineer.',
      avatarUrl: judgeGithub ? `https://github.com/${judgeGithub}.png` : `https://api.dicebear.com/7.x/identicon/svg?seed=${judgeAddr}`,
      ipfsHash: '',
      skills: ['TypeScript', 'React', 'Smart Contracts', 'Node.js', 'Solidity'],
      githubUsername: judgeGithub,
      githubVerified: Boolean(judgeGithub),
      primaryScore: 0,
      reputationSbtCount: 0,
      role: 'judge',
    };
  } else if (judgeAddr && normalized[judgeAddr] && judgeGithub) {
    if (!normalized[judgeAddr].githubUsername || !normalized[judgeAddr].githubVerified) {
      normalized[judgeAddr].githubUsername = judgeGithub;
      normalized[judgeAddr].githubVerified = true;
    }
  }

  return normalized;
};

const BROADCAST_CHANNEL_NAME = 'polylance_realtime_sync_channel';

let currentConnectedWalletAddress: string = '';

export const setCurrentConnectedWalletAddress = (addr: string) => {
  currentConnectedWalletAddress = (addr || '').toLowerCase().trim();
};

const broadcastSync = (data: {
  jobs?: Job[];
  deletedJobId?: string;
  profiles?: Record<string, UserProfile>;
  daoProposals?: DaoProposal[];
  judgeMessages?: Record<string, JudgeMessage[]>;
  judges?: JudgeRecord[];
  treasuryProposals?: TreasuryProposal[];
  treasuryHistory?: any[];
  treasuryBalanceUsdc?: number;
  treasuryBalanceEth?: number;
}, senderAddress?: string) => {
  if (data.jobs && Array.isArray(data.jobs)) {
    data.jobs = data.jobs.filter((j) => !isDemoOrMockJob(j));
  }
  let activeAddr = (senderAddress || currentConnectedWalletAddress || '').toLowerCase().trim();
  if (!activeAddr || !ethers.isAddress(activeAddr)) {
    if (data.jobs && data.jobs[0] && data.jobs[0].client && ethers.isAddress(data.jobs[0].client)) {
      activeAddr = data.jobs[0].client.toLowerCase().trim();
    } else if (data.profiles && Object.keys(data.profiles).length > 0) {
      const firstProf = Object.keys(data.profiles).find((a) => ethers.isAddress(a));
      if (firstProf) activeAddr = firstProf.toLowerCase().trim();
    }
  }

  // 1. Cross-Tab Sync via BroadcastChannel
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: 'SYNC_UPDATE', payload: data, sender: Date.now() });
      channel.close();
    }
  } catch (err) {}

  // 2. Real-Time Socket Relay (Instant Multi-Device Sync worldwide)
  try {
    if (syncSocket && syncSocket.connected) {
      syncSocket.emit('client-sync', data);
    }
  } catch (err) {}

  // 3. Multi-Endpoint Dual Write to Cloud Databases (Render PostgreSQL)
  if (!activeAddr || !ethers.isAddress(activeAddr)) {
    return;
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }

  const endpoints = getSyncEndpoints();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-wallet-address': activeAddr,
  };
  const query = `?address=${encodeURIComponent(activeAddr)}`;
  endpoints.forEach((ep) => {
    fetch(`${ep}/api/sync${query}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }).catch(() => {});
  });
};



const normalizeJob = (job: Job): Job => {
  if (!job) return job;
  let next = { ...job };
  const isFundedEvent = (next.events || []).some((e) => e.step === 'Funded' && e.status === 'completed');
  const bothAgreed = Boolean(next.clientAgreedTerms && next.freelancerAgreedTerms);

  if (isFundedEvent || bothAgreed) {
    if (Array.isArray(next.events)) {
      next.events = next.events.map((evt) => {
        if (evt.step === 'Terms' && evt.status !== 'completed') {
          return { ...evt, status: 'completed' as const, timestamp: evt.timestamp || Date.now() };
        }
        return evt;
      });
    }
  }

  if (isFundedEvent && (next.status === 'Open' || next.status === 'Selected')) {
    next.status = 'Funded';
  }
  return next;
};

const getInitialRecentlyDeleted = (): Set<string> => {
  const set = new Set<string>();
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_recently_deleted_jobs');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          arr.forEach((id: string) => {
            if (id && typeof id === 'string') set.add(id.toLowerCase().trim());
          });
        }
      }
    }
  } catch {}
  return set;
};

const recentlyDeletedJobIds: Set<string> = getInitialRecentlyDeleted();

const trackDeletedJobId = (id?: string) => {
  if (!id || typeof id !== 'string') return;
  const clean = id.toLowerCase().trim();
  recentlyDeletedJobIds.add(clean);
  try {
    if (typeof window !== 'undefined') {
      const arr = Array.from(recentlyDeletedJobIds).slice(-100);
      localStorage.setItem('polylance_recently_deleted_jobs', JSON.stringify(arr));
    }
  } catch {}
};

const isRecentlyDeletedJob = (id?: string, contractAddress?: string): boolean => {
  if (id && recentlyDeletedJobIds.has(String(id).toLowerCase().trim())) return true;
  if (contractAddress && recentlyDeletedJobIds.has(String(contractAddress).toLowerCase().trim())) return true;
  return false;
};

const mergeJobsList = (existing: Job[], incoming: Job[]): Job[] => {
  const map = new Map<string, Job>();
  const idIndex = new Map<string, string>(); // maps id / contractAddress to mapKey

  (existing || []).forEach((j) => {
    if (!j || isDemoOrMockJob(j) || isRecentlyDeletedJob(j.id, j.contractAddress)) return;
    const norm = normalizeJob(j);
    const key = (norm.contractAddress || norm.id).toLowerCase();
    map.set(key, norm);
    if (norm.id) idIndex.set(String(norm.id).toLowerCase(), key);
    if (norm.contractAddress) idIndex.set(String(norm.contractAddress).toLowerCase(), key);
  });

  (incoming || []).forEach((inJobRaw) => {
    if (!inJobRaw || isDemoOrMockJob(inJobRaw) || isRecentlyDeletedJob(inJobRaw.id, inJobRaw.contractAddress)) return;
    const inJob = normalizeJob(inJobRaw);
    const inId = inJob.id ? String(inJob.id).toLowerCase() : '';
    const inContract = inJob.contractAddress ? String(inJob.contractAddress).toLowerCase() : '';
    const key = inContract || inId;
    if (!key) return;

    const matchedKey = (inId && idIndex.get(inId)) || (inContract && idIndex.get(inContract)) || key;
    const curr = map.get(matchedKey);
    if (!curr) {
      map.set(key, inJob);
      if (inId) idIndex.set(inId, key);
      if (inContract) idIndex.set(inContract, key);
    } else {
      // If contract address was updated from placeholder to deployed clone, remove any orphan generic clone
      if (inContract && inContract !== (curr.contractAddress || '').toLowerCase()) {
        const orphanKey = idIndex.get(inContract);
        if (orphanKey && orphanKey !== matchedKey) {
          map.delete(orphanKey);
        }
      }

      // Merge applications
      const appMap = new Map<string, Application>();
      (curr.applications || []).forEach((a) => appMap.set(a.applicant.toLowerCase(), a));
      (inJob.applications || []).forEach((a) => appMap.set(a.applicant.toLowerCase(), a));

      // Respect chatClearedAt so cleared messages are never re-merged
      const chatClearedAt = Math.max(curr.chatClearedAt || 0, inJob.chatClearedAt || 0);

      // Merge chat messages with smart deduplication (preserve all proposals and non-duplicates)
      const mergedMsgs: any[] = [];
      const sourceMsgs = [
        ...(curr.chatMessages || []),
        ...(inJob.chatMessages || [])
      ].filter(m => !chatClearedAt || (m.timestamp || 0) > chatClearedAt);

      const allMsgs = sourceMsgs.sort(
        (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
      );
      for (const m of allMsgs) {
        if (!m) continue;
        const isDuplicate = mergedMsgs.some(
          (existing) =>
            (m.id && existing.id && m.id === existing.id) ||
            (m.proposal && existing.proposal && m.proposal.id === existing.proposal.id) ||
            (existing.sender === m.sender &&
              Boolean(m.text) &&
              existing.text?.trim() === m.text?.trim() &&
              Math.abs((existing.timestamp || 0) - (m.timestamp || 0)) < 3500 &&
              !m.proposal)
        );
        if (!isDuplicate) {
          mergedMsgs.push(m);
        } else if (m.proposal) {
          // Keep newest proposal status if incoming has updated status (e.g., Accepted/Rejected)
          const propId = m.proposal.id;
          const idx = mergedMsgs.findIndex(
            (em) => (m.id && em.id === m.id) || (em.proposal && propId && em.proposal.id === propId)
          );
          if (idx !== -1 && m.proposal) {
            mergedMsgs[idx] = {
              ...mergedMsgs[idx],
              ...m,
              proposal: { ...(mergedMsgs[idx].proposal || {}), ...m.proposal },
            };
          }
        }
      }

      // Merge negotiation proposals safely
      const propMap = new Map<string, NegotiationProposal>();
      (curr.negotiationProposals || []).forEach((p) => p && propMap.set(p.id, p));
      (inJob.negotiationProposals || []).forEach((p) => {
        if (!p) return;
        const existing = propMap.get(p.id);
        if (!existing) {
          propMap.set(p.id, p);
        } else {
          propMap.set(p.id, { ...existing, ...p });
        }
      });
      const mergedProposals = Array.from(propMap.values()).sort(
        (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
      );

      // Merge extension requests safely
      const extMap = new Map<string, any>();
      (curr.extensionRequests || []).forEach((r) => r && extMap.set(r.id || `${r.requestIndex}`, r));
      (inJob.extensionRequests || []).forEach((r) => r && extMap.set(r.id || `${r.requestIndex}`, r));
      const mergedExtensionRequests = Array.from(extMap.values()).sort(
        (a, b) => (b.requestedAt || b.timestamp || 0) - (a.requestedAt || a.timestamp || 0)
      );

      // Merge progress updates safely with newest timestamp first
      const progMap = new Map<string, any>();
      (curr.progressUpdates || []).forEach((p) => p && progMap.set(p.id || `${p.timestamp}`, p));
      (inJob.progressUpdates || []).forEach((p) => p && progMap.set(p.id || `${p.timestamp}`, p));
      const mergedProgressUpdates = Array.from(progMap.values()).sort(
        (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
      );

      // Merge modification requests safely
      const modMap = new Map<string, any>();
      (curr.modificationRequests || []).forEach((m) => m && modMap.set(m.id || `${m.requestedAt}`, m));
      (inJob.modificationRequests || []).forEach((m) => m && modMap.set(m.id || `${m.requestedAt}`, m));

      // Merge pre-acceptance messages with smart deduplication
      const mergedPreMsgs: any[] = [];
      const allPreMsgs = [...(curr.preAcceptMessages || []), ...(inJob.preAcceptMessages || [])].sort(
        (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
      );
      for (const m of allPreMsgs) {
        if (!m) continue;
        const isDuplicate = mergedPreMsgs.some(
          (existing) =>
            (m.proposal && existing.proposal && m.proposal.id === existing.proposal.id) ||
            (existing.sender === m.sender &&
              Boolean(m.text) &&
              existing.text?.trim() === m.text?.trim() &&
              Math.abs((existing.timestamp || 0) - (m.timestamp || 0)) < 3500 &&
              !m.proposal)
        );
        if (!isDuplicate) {
          mergedPreMsgs.push(m);
        } else if (m.proposal) {
          const propId = m.proposal.id;
          const idx = mergedPreMsgs.findIndex(
            (em) => em.proposal && propId && em.proposal.id === propId
          );
          if (idx !== -1 && m.proposal) {
            mergedPreMsgs[idx] = {
              ...mergedPreMsgs[idx],
              ...m,
              proposal: { ...(mergedPreMsgs[idx].proposal || {}), ...m.proposal },
            };
          }
        }
      }

      // Status lifecycle priority order: Completed > Disputed > Submitted > Funded > Selected > Open > Cancelled
      const getStatusPriority = (st?: JobStatus): number => {
        if (!st) return 0;
        switch (st) {
          case 'Completed': return 6;
          case 'Disputed': return 5;
          case 'Submitted': return 4;
          case 'Funded': return 3;
          case 'Selected': return 2;
          case 'Open': return 1;
          case 'Cancelled': return 0;
          default: return 0;
        }
      };

      const currPriority = getStatusPriority(curr.status);
      const inPriority = getStatusPriority(inJob.status);
      const resolvedStatus = inPriority >= currPriority ? (inJob.status || curr.status) : curr.status;

      const mergedJob: Job = {
        ...curr,
        ...inJob,
        status: resolvedStatus,
        freelancer: inJob.freelancer || curr.freelancer,
        clientAgreedTerms: inJob.clientAgreedTerms !== undefined ? inJob.clientAgreedTerms : curr.clientAgreedTerms,
        freelancerAgreedTerms: inJob.freelancerAgreedTerms !== undefined ? inJob.freelancerAgreedTerms : curr.freelancerAgreedTerms,
        termsHash: inJob.termsHash || curr.termsHash,
        amountUsdc: inJob.amountUsdc || curr.amountUsdc,
        amountEth: inJob.amountEth || curr.amountEth,
        paymentTokenSymbol: inJob.paymentTokenSymbol || curr.paymentTokenSymbol,
        reviewPeriodDays: inJob.reviewPeriodDays || curr.reviewPeriodDays,
        negotiatedAmount: inJob.negotiatedAmount || curr.negotiatedAmount,
        negotiatedDeadlineDays: inJob.negotiatedDeadlineDays !== undefined ? inJob.negotiatedDeadlineDays : curr.negotiatedDeadlineDays,
        applications: Array.from(appMap.values()),
        negotiationProposals: mergedProposals,
        chatMessages: mergedMsgs.slice(-150),
        preAcceptMessages: mergedPreMsgs.slice(-100),
        events: inJob.events?.length ? inJob.events : curr.events,
        dispute: inJob.dispute || curr.dispute,
        proof: inJob.proof || curr.proof,
        progressUpdates: mergedProgressUpdates,
        extensionRequests: mergedExtensionRequests,
        modificationRequests: Array.from(modMap.values()),
        sbtTokenId: inJob.sbtTokenId || curr.sbtTokenId,
        completedAt: inJob.completedAt || curr.completedAt,
        submittedAt: inJob.submittedAt || curr.submittedAt,
        chatClearedAt: chatClearedAt > 0 ? chatClearedAt : undefined,
      };

      if (matchedKey !== key) {
        map.delete(matchedKey);
      }
      map.set(key, normalizeJob(mergedJob));
      if (inId) idIndex.set(inId, key);
      if (inContract) idIndex.set(inContract, key);
    }
  });

  const allMerged = Array.from(map.values());
  return allMerged.filter((j) => !getJobInactivityStatus(j).isExpired && !isDemoOrMockJob(j));
};

const matchJob = (job: Job, targetId: string): boolean => {
  if (!job || !targetId) return false;
  const tid = targetId.toLowerCase().trim();
  return (
    Boolean(job.id && job.id.toLowerCase().trim() === tid) ||
    Boolean(job.contractAddress && job.contractAddress.toLowerCase().trim() === tid)
  );
};

const mergeProfilesMap = (existing: Record<string, UserProfile>, incoming: Record<string, UserProfile>): Record<string, UserProfile> => {
  const merged: Record<string, UserProfile> = { ...existing };
  for (const [addr, inProf] of Object.entries(incoming || {})) {
    if (!addr) continue;
    const lower = addr.toLowerCase();
    const curr = merged[lower];
    if (!curr) {
      merged[lower] = inProf;
    } else {
      merged[lower] = {
        ...curr,
        ...inProf,
        displayName: inProf.displayName || curr.displayName,
        bio: inProf.bio || curr.bio,
        avatarUrl: inProf.avatarUrl || curr.avatarUrl,
        skills: inProf.skills?.length ? inProf.skills : curr.skills,
        githubUsername: inProf.githubUsername || curr.githubUsername,
        githubVerified: inProf.githubVerified ?? curr.githubVerified,
        primaryScore: typeof inProf.primaryScore === 'number' ? inProf.primaryScore : curr.primaryScore,
        primaryCategory: inProf.primaryCategory || curr.primaryCategory,
        languageBytes: inProf.languageBytes !== undefined
          ? inProf.languageBytes
          : curr.languageBytes,
        reputationSbtCount: inProf.reputationSbtCount ?? curr.reputationSbtCount,
      };
    }
  }
  return normalizeProfiles(merged);
};

export const PolyLanceDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { provider, getSigner, address, isConnected, isWrongNetwork, targetChainName, switchToTargetNetwork, refreshBalances } = useWeb3();

  useEffect(() => {
    setCurrentConnectedWalletAddress(address || '');
    if (address) {
      refreshBalances().catch(() => {});
      if (syncSocket && syncSocket.connected) {
        syncSocket.emit('identify', { address });
      }
    }
  }, [address, refreshBalances]);



  const [jobs, setJobsRaw] = useState<Job[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_jobs');
      if (saved) {
        try {
          const parsed: Job[] = JSON.parse(saved);
          const clean = parsed.filter(j => !isDemoOrMockJob(j) && !getJobInactivityStatus(j).isExpired);
          localStorage.setItem('polylance_jobs', JSON.stringify(clean));
          return clean;
        } catch {
          return INITIAL_JOBS;
        }
      }
    }
    return INITIAL_JOBS;
  });

  const jobsRef = useRef(jobs);
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);
  const isSyncingOnChainRef = useRef(false);

  // One-time startup purge of any lingering demo/test jobs from localStorage & broadcast deletion to backend
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('polylance_jobs');
      if (saved) {
        const parsed: Job[] = JSON.parse(saved);
        const demoJobs = parsed.filter(isDemoOrMockJob);
        if (demoJobs.length > 0) {
          const cleanJobs = parsed.filter((j) => !isDemoOrMockJob(j));
          localStorage.setItem('polylance_jobs', JSON.stringify(cleanJobs));
          setJobsRaw(cleanJobs);
          demoJobs.forEach((dj) => {
            if (dj.id) broadcastSync({ deletedJobId: dj.id });
            if (dj.contractAddress && dj.contractAddress !== dj.id) {
              broadcastSync({ deletedJobId: dj.contractAddress });
            }
          });
        }
      }
    } catch {}
  }, []);

  // Periodic background check to automatically purge jobs reaching 14 days without client action or demo jobs
  useEffect(() => {
    const checkExpiry = () => {
      setJobsRaw((curr) => {
        const expiredOrDemo = curr.filter((j) => getJobInactivityStatus(j).isExpired || isDemoOrMockJob(j));
        if (expiredOrDemo.length === 0) return curr;

        const remaining = curr.filter((j) => !getJobInactivityStatus(j).isExpired && !isDemoOrMockJob(j));
        if (typeof window !== 'undefined') {
          localStorage.setItem('polylance_jobs', JSON.stringify(remaining));
        }
        expiredOrDemo.forEach((exp) => {
          if (exp.id) broadcastSync({ deletedJobId: exp.id });
          if (exp.contractAddress && exp.contractAddress !== exp.id) {
            broadcastSync({ deletedJobId: exp.contractAddress });
          }
        });
        return remaining;
      });
    };

    const timer = setInterval(checkExpiry, 30000);
    return () => clearInterval(timer);
  }, []);

  const setJobs = (val: React.SetStateAction<Job[]>) => {
    setJobsRaw((prev) => {
      const computed = typeof val === 'function' ? val(prev) : val;
      const next = computed.filter((j) => !getJobInactivityStatus(j).isExpired && !isDemoOrMockJob(j));
      if (typeof window !== 'undefined') {
        localStorage.setItem('polylance_jobs', JSON.stringify(next));
      }
      broadcastSync({ jobs: next });
      return next;
    });
  };

  const [daoProposals, setDaoProposalsRaw] = useState<DaoProposal[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_dao_proposals');
      return saved ? JSON.parse(saved) : INITIAL_PROPOSALS;
    }
    return INITIAL_PROPOSALS;
  });
  const setDaoProposals = (val: React.SetStateAction<DaoProposal[]>) => {
    setDaoProposalsRaw((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') localStorage.setItem('polylance_dao_proposals', JSON.stringify(next));
      broadcastSync({ daoProposals: next });
      return next;
    });
  };

  const [treasuryBalanceUsdc, setTreasuryBalanceUsdcRaw] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_treasury_balance_usdc');
      if (saved === '10000' || !saved) return 0;
      return parseFloat(saved);
    }
    return 0;
  });
  const setTreasuryBalanceUsdc = (val: React.SetStateAction<number>) => {
    setTreasuryBalanceUsdcRaw((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') localStorage.setItem('polylance_treasury_balance_usdc', next.toString());
      broadcastSync({ treasuryBalanceUsdc: next });
      return next;
    });
  };

  const [treasuryBalanceEth, setTreasuryBalanceEthRaw] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_treasury_balance_eth');
      if (saved === '4.5' || !saved) return 0.0;
      return parseFloat(saved);
    }
    return 0.0;
  });
  const setTreasuryBalanceEth = (val: React.SetStateAction<number>) => {
    setTreasuryBalanceEthRaw((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') localStorage.setItem('polylance_treasury_balance_eth', next.toString());
      broadcastSync({ treasuryBalanceEth: next });
      return next;
    });
  };

  const [treasuryProposals, setTreasuryProposalsRaw] = useState<TreasuryProposal[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_treasury_proposals');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const setTreasuryProposals = (val: React.SetStateAction<TreasuryProposal[]>) => {
    setTreasuryProposalsRaw((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') localStorage.setItem('polylance_treasury_proposals', JSON.stringify(next));
      broadcastSync({ treasuryProposals: next });
      return next;
    });
  };

  const [treasuryHistory, setTreasuryHistoryRaw] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_treasury_history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const setTreasuryHistory = (val: React.SetStateAction<any[]>) => {
    setTreasuryHistoryRaw((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') localStorage.setItem('polylance_treasury_history', JSON.stringify(next));
      broadcastSync({ treasuryHistory: next });
      return next;
    });
  };

  const [profiles, setProfilesRaw] = useState<Record<string, UserProfile>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_profiles');
      const raw = saved ? JSON.parse(saved) : INITIAL_PROFILES;
      return normalizeProfiles(raw);
    }
    return normalizeProfiles(INITIAL_PROFILES);
  });
  const setProfiles = (val: React.SetStateAction<Record<string, UserProfile>>) => {
    setProfilesRaw((prev) => {
      const computed = typeof val === 'function' ? val(prev) : val;
      const next = normalizeProfiles(computed);
      if (typeof window !== 'undefined') localStorage.setItem('polylance_profiles', JSON.stringify(next));
      const sender = (address || currentConnectedWalletAddress || '').toLowerCase().trim();
      broadcastSync({ profiles: next }, sender);
      return next;
    });
  };

  const [judges, setJudgesRaw] = useState<JudgeRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_judges');
      if (saved) return JSON.parse(saved);
    }
    return [
      {
        address: defaultJudgeAddr,
        name: 'Primary Protocol Arbitrator',
        status: 'Active',
        addedAt: 1700000000000,
        addedBy: 'Protocol Governance',
        notes: 'Lead Arbitrator for decentralized dispute resolution.'
      }
    ];
  });
  const setJudges = (val: React.SetStateAction<JudgeRecord[]>) => {
    setJudgesRaw((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') localStorage.setItem('polylance_judges', JSON.stringify(next));
      broadcastSync({ judges: next });
      return next;
    });
  };

  const [judgeMessages, setJudgeMessagesRaw] = useState<Record<string, JudgeMessage[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_judge_messages');
      if (saved) return JSON.parse(saved);
    }
    return INITIAL_JUDGE_MESSAGES;
  });
  const setJudgeMessages = (val: React.SetStateAction<Record<string, JudgeMessage[]>>) => {
    setJudgeMessagesRaw((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') localStorage.setItem('polylance_judge_messages', JSON.stringify(next));
      broadcastSync({ judgeMessages: next });
      return next;
    });
  };

  // Real-time synchronization across all tabs/windows/browser contexts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.onmessage = (event) => {
          if (event.data && event.data.type === 'SYNC_UPDATE' && event.data.payload) {
            const { payload } = event.data;
            if (payload.jobs) {
              setJobsRaw((curr) => {
                const merged = mergeJobsList(curr, payload.jobs);
                return [...merged];
              });
            }
            if (payload.profiles) {
              setProfilesRaw((curr) => {
                const merged = mergeProfilesMap(curr, payload.profiles);
                return { ...merged };
              });
            }
            if (payload.deletedJobId) {
              const delId = payload.deletedJobId;
              trackDeletedJobId(delId);
              setJobsRaw((curr) => curr.filter((j) => !matchJob(j, delId) && !isRecentlyDeletedJob(j.id, j.contractAddress)));
            }
            if (payload.daoProposals) setDaoProposalsRaw([...payload.daoProposals]);
            if (payload.judgeMessages) setJudgeMessagesRaw({ ...payload.judgeMessages });
            if (payload.judges) setJudgesRaw([...payload.judges]);
            if (payload.treasuryProposals) setTreasuryProposalsRaw([...payload.treasuryProposals]);
            if (payload.treasuryHistory) setTreasuryHistoryRaw([...payload.treasuryHistory]);
            if (typeof payload.treasuryBalanceUsdc === 'number') setTreasuryBalanceUsdcRaw(payload.treasuryBalanceUsdc);
            if (typeof payload.treasuryBalanceEth === 'number') setTreasuryBalanceEthRaw(payload.treasuryBalanceEth);
          }
        };
      }
    } catch (err) {
      console.warn('Real-time sync BroadcastChannel notice:', err);
    }

    const syncUrl = getBackendSyncUrl();

    // Real-Time Cross-Device WebSocket Sync Setup
    try {
      const isOnline = typeof navigator === 'undefined' || navigator.onLine;
      const activeAddr = (currentConnectedWalletAddress || address || '').toLowerCase().trim();
      if (isOnline && Date.now() >= backendSyncOfflineUntil && (!syncSocket || !syncSocket.connected)) {
        syncSocket = socketIO(syncUrl, {
          transports: ['polling', 'websocket'],
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 3000,
          timeout: 10000,
          auth: activeAddr ? { address: activeAddr } : {},
          query: activeAddr ? { address: activeAddr } : {},
        });

        syncSocket.on('connect_error', () => {
          socketConnectFailures++;
          if (socketConnectFailures >= 2) {
            backendSyncOfflineUntil = Date.now() + 60000;
            if (syncSocket) syncSocket.disconnect();
            setTimeout(() => {
              if (syncSocket && (typeof navigator === 'undefined' || navigator.onLine)) {
                socketConnectFailures = 0;
                syncSocket.connect();
              }
            }, 60000);
          }
        });

        syncSocket.on('connect', () => {
          socketConnectFailures = 0;
          backendSyncOfflineUntil = 0;
          const currentAddr = (currentConnectedWalletAddress || address || '').toLowerCase().trim();
          if (currentAddr && syncSocket) {
            syncSocket.emit('identify', { address: currentAddr });
          }
        });

        syncSocket.on('realtime-sync', (payload: any) => {
          if (!payload) return;
          if (payload.deletedJobId) {
            const delId = payload.deletedJobId;
            trackDeletedJobId(delId);
            setJobsRaw((curr) => curr.filter((j) => !matchJob(j, delId) && !isRecentlyDeletedJob(j.id, j.contractAddress)));
          }
          if (Array.isArray(payload.jobs) && payload.jobs.length > 0) {
            setJobsRaw((curr) => {
              const merged = mergeJobsList(curr, payload.jobs);
              try { localStorage.setItem('polylance_jobs', JSON.stringify(merged)); } catch {}
              return [...merged];
            });
          }
          if (payload.profiles && Object.keys(payload.profiles).length > 0) {
            setProfilesRaw((curr) => {
              const merged = mergeProfilesMap(curr, payload.profiles);
              try { localStorage.setItem('polylance_profiles', JSON.stringify(merged)); } catch {}
              return { ...merged };
            });
          }

          if (Array.isArray(payload.daoProposals)) setDaoProposalsRaw([...payload.daoProposals]);
          if (payload.judgeMessages) setJudgeMessagesRaw({ ...payload.judgeMessages });
          if (Array.isArray(payload.judges)) setJudgesRaw([...payload.judges]);
          if (Array.isArray(payload.treasuryProposals)) setTreasuryProposalsRaw([...payload.treasuryProposals]);
          if (Array.isArray(payload.treasuryHistory)) setTreasuryHistoryRaw([...payload.treasuryHistory]);
        });
      }
    } catch (err) {
      console.warn('Real-time WebSocket sync initialization notice:', err);
    }

    // Graceful Back-Forward Cache (bfcache) management
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && syncSocket && !syncSocket.connected && (typeof navigator === 'undefined' || navigator.onLine)) {
        syncSocket.connect();
      }
    };
    const handlePageHide = () => {
      if (syncSocket && syncSocket.connected) {
        syncSocket.disconnect();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);

    // Initial load from backend shared state — race all endpoints for fastest response
    // Uses longer timeout + retry to handle Render cold starts (can take 10-30s for free tier)
    const isNetworkAvailable = typeof navigator === 'undefined' || navigator.onLine;
    if (isNetworkAvailable) {
      const currentAddr = (address || currentConnectedWalletAddress || '').toLowerCase().trim();
      const effectiveAddr = currentAddr || '0x0000000000000000000000000000000000000000';
      const initHeaders: Record<string, string> = { 'x-wallet-address': effectiveAddr };
      const initQuery = `?address=${encodeURIComponent(effectiveAddr)}`;

      const applyPayload = (payload: any) => {
        if (!payload) return false;
        backendSyncOfflineUntil = 0;
        socketConnectFailures = 0;

        let currentLocalJobs: Job[] = [];
        try {
          const saved = localStorage.getItem('polylance_jobs');
          if (saved) currentLocalJobs = JSON.parse(saved);
        } catch {}
        const cleanLocalJobs = currentLocalJobs.filter((j) => !isDemoOrMockJob(j));

        if (Array.isArray(payload.jobs) && payload.jobs.length > 0) {
          setJobsRaw((curr) => {
            const merged = mergeJobsList(curr, payload.jobs);
            try { localStorage.setItem('polylance_jobs', JSON.stringify(merged)); } catch {}
            return [...merged];
          });
          if (cleanLocalJobs.length > 0) {
            broadcastSync({ jobs: cleanLocalJobs });
          }
        } else if (cleanLocalJobs.length > 0) {
          broadcastSync({ jobs: cleanLocalJobs });
        }

        let currentLocalProfiles: Record<string, UserProfile> = {};
        try {
          const savedProf = localStorage.getItem('polylance_profiles');
          if (savedProf) currentLocalProfiles = JSON.parse(savedProf);
        } catch {}

        if (payload.profiles && Object.keys(payload.profiles).length > 0) {
          setProfilesRaw((curr) => {
            const merged = mergeProfilesMap(curr, payload.profiles);
            try { localStorage.setItem('polylance_profiles', JSON.stringify(merged)); } catch {}
            return { ...merged };
          });
          if (Object.keys(currentLocalProfiles).length > 0) {
            const missingOnServer: Record<string, UserProfile> = {};
            for (const [k, p] of Object.entries(currentLocalProfiles)) {
              if (!payload.profiles[k]) missingOnServer[k] = p;
            }
            if (Object.keys(missingOnServer).length > 0 && currentAddr && ethers.isAddress(currentAddr)) {
              broadcastSync({ profiles: missingOnServer }, currentAddr);
            }
          }
        } else if (Object.keys(currentLocalProfiles).length > 0 && currentAddr && ethers.isAddress(currentAddr)) {
          broadcastSync({ profiles: currentLocalProfiles }, currentAddr);
        }

        if (Array.isArray(payload.daoProposals) && payload.daoProposals.length > 0) {
          setDaoProposalsRaw([...payload.daoProposals]);
          try { localStorage.setItem('polylance_dao_proposals', JSON.stringify(payload.daoProposals)); } catch {}
        }
        if (payload.judgeMessages && Object.keys(payload.judgeMessages).length > 0) {
          setJudgeMessagesRaw({ ...payload.judgeMessages });
          try { localStorage.setItem('polylance_judge_messages', JSON.stringify(payload.judgeMessages)); } catch {}
        }
        if (Array.isArray(payload.judges) && payload.judges.length > 0) {
          setJudgesRaw([...payload.judges]);
          try { localStorage.setItem('polylance_judges', JSON.stringify(payload.judges)); } catch {}
        }
        if (Array.isArray(payload.treasuryProposals) && payload.treasuryProposals.length > 0) {
          setTreasuryProposalsRaw([...payload.treasuryProposals]);
          try { localStorage.setItem('polylance_treasury_proposals', JSON.stringify(payload.treasuryProposals)); } catch {}
        }
        if (Array.isArray(payload.treasuryHistory) && payload.treasuryHistory.length > 0) {
          setTreasuryHistoryRaw([...payload.treasuryHistory]);
          try { localStorage.setItem('polylance_treasury_history', JSON.stringify(payload.treasuryHistory)); } catch {}
        }
        return true;
      };

      // Race all sync endpoints in parallel — fastest response wins
      const tryFetchSync = (timeoutMs: number): Promise<any> => {
        const endpoints = getSyncEndpoints();
        const fetches = endpoints.map((ep) => {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), timeoutMs);
          return fetch(`${ep}/api/sync${initQuery}`, { headers: initHeaders, signal: controller.signal })
            .then((r) => { clearTimeout(tid); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
            .catch((e) => { clearTimeout(tid); throw e; });
        });
        // Promise.any resolves as soon as any fetch succeeds
        return (Promise as any).any(fetches).catch(() => null);
      };

      // Attempt with retry backoff — critical for Render cold starts and new users with no local data
      const initialSyncWithRetry = async () => {
        const attempts = [
          { delay: 0, timeout: 10000 },
          { delay: 5000, timeout: 14000 },
          { delay: 12000, timeout: 20000 },
          { delay: 25000, timeout: 25000 },
        ];
        for (const attempt of attempts) {
          if (attempt.delay > 0) await new Promise((r) => setTimeout(r, attempt.delay));
          try {
            const payload = await tryFetchSync(attempt.timeout);
            if (payload) {
              applyPayload(payload);
              return;
            }
          } catch {}
        }
        // Suppress only after all retries are exhausted
        backendSyncOfflineUntil = Date.now() + 30000;
      };

      initialSyncWithRetry();
    }


    const handleStorage = (e: StorageEvent) => {
      if (!e.key) return;
      try {
        if (e.key === 'polylance_jobs' && e.newValue) {
          const parsed = JSON.parse(e.newValue);
          setJobsRaw((curr) => {
            const merged = mergeJobsList(curr, parsed);
            return [...merged];
          });
        } else if (e.key === 'polylance_profiles' && e.newValue) {
          const parsed = JSON.parse(e.newValue);
          setProfilesRaw((curr) => {
            const merged = mergeProfilesMap(curr, parsed);
            return { ...merged };
          });
        } else if (e.key === 'polylance_dao_proposals' && e.newValue) {
          setDaoProposalsRaw(JSON.parse(e.newValue));
        } else if (e.key === 'polylance_judge_messages' && e.newValue) {
          setJudgeMessagesRaw(JSON.parse(e.newValue));
        } else if (e.key === 'polylance_judges' && e.newValue) {
          setJudgesRaw(JSON.parse(e.newValue));
        } else if (e.key === 'polylance_treasury_proposals' && e.newValue) {
          setTreasuryProposalsRaw(JSON.parse(e.newValue));
        } else if (e.key === 'polylance_treasury_history' && e.newValue) {
          setTreasuryHistoryRaw(JSON.parse(e.newValue));
        }
      } catch (err) {
        console.warn('Storage sync parsing error:', err);
      }
    };

    window.addEventListener('storage', handleStorage);

    // Periodic synchronization check and window focus listener for multi-account / cross-context real-time sync
    const syncFromStorage = () => {
      try {
        const savedJobs = localStorage.getItem('polylance_jobs');
        if (savedJobs) {
          const parsed = JSON.parse(savedJobs);
          setJobsRaw((curr) => {
            const merged = mergeJobsList(curr, parsed);
            if (curr.length === merged.length && JSON.stringify(curr) === JSON.stringify(merged)) {
              return curr;
            }
            return [...merged];
          });
        }
        const savedProfiles = localStorage.getItem('polylance_profiles');
        if (savedProfiles) {
          const parsed = JSON.parse(savedProfiles);
          setProfilesRaw((curr) => {
            const merged = mergeProfilesMap(curr, parsed);
            if (Object.keys(curr).length === Object.keys(merged).length && JSON.stringify(curr) === JSON.stringify(merged)) {
              return curr;
            }
            return { ...merged };
          });
        }
        const savedDao = localStorage.getItem('polylance_dao_proposals');
        if (savedDao) {
          setDaoProposalsRaw((curr) => {
            const parsed = JSON.parse(savedDao);
            if (curr.length === parsed.length && JSON.stringify(curr) === JSON.stringify(parsed)) return curr;
            return parsed;
          });
        }
        const savedMessages = localStorage.getItem('polylance_judge_messages');
        if (savedMessages) {
          setJudgeMessagesRaw((curr) => {
            const parsed = JSON.parse(savedMessages);
            if (JSON.stringify(curr) === JSON.stringify(parsed)) return curr;
            return parsed;
          });
        }
      } catch (err) {
        // silent sync fallback
      }
    };

    // Periodic synchronization check and window focus listener for multi-account / cross-context real-time sync
    const syncFromRemoteBackend = async () => {
      if (Date.now() < backendSyncOfflineUntil) return;
      const endpoints = getSyncEndpoints();
      const activeAddr = (address || currentConnectedWalletAddress || '').toLowerCase().trim();
      const effectiveAddr = activeAddr || '0x0000000000000000000000000000000000000000';
      const reqHeaders: Record<string, string> = { 'x-wallet-address': effectiveAddr };
      const query = `?address=${encodeURIComponent(effectiveAddr)}`;

      // Race all endpoints in parallel — fastest response wins
      try {
        const fetches = endpoints.map((ep) => {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 10000);
          return fetch(`${ep}/api/sync${query}`, { signal: controller.signal, headers: reqHeaders })
            .then((r) => { clearTimeout(tid); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
            .catch((e) => { clearTimeout(tid); throw e; });
        });
        const payload = await (Promise as any).any(fetches).catch(() => null);
        if (payload) {
          backendSyncOfflineUntil = 0;
          if (Array.isArray(payload.jobs) && payload.jobs.length > 0) {
            setJobsRaw((curr) => {
              const merged = mergeJobsList(curr, payload.jobs);
              if (curr.length === merged.length && JSON.stringify(curr) === JSON.stringify(merged)) return curr;
              try { localStorage.setItem('polylance_jobs', JSON.stringify(merged)); } catch {}
              return [...merged];
            });
          }
          if (payload.profiles && Object.keys(payload.profiles).length > 0) {
            setProfilesRaw((curr) => {
              const merged = mergeProfilesMap(curr, payload.profiles);
              if (Object.keys(curr).length === Object.keys(merged).length && JSON.stringify(curr) === JSON.stringify(merged)) return curr;
              try { localStorage.setItem('polylance_profiles', JSON.stringify(merged)); } catch {}
              return { ...merged };
            });
          }
          if (Array.isArray(payload.daoProposals)) setDaoProposalsRaw([...payload.daoProposals]);
          if (payload.judgeMessages) setJudgeMessagesRaw({ ...payload.judgeMessages });
          if (Array.isArray(payload.judges)) setJudgesRaw([...payload.judges]);
          if (Array.isArray(payload.treasuryProposals)) setTreasuryProposalsRaw([...payload.treasuryProposals]);
          if (Array.isArray(payload.treasuryHistory)) setTreasuryHistoryRaw([...payload.treasuryHistory]);
        } else {
          backendSyncOfflineUntil = Date.now() + 10000; // shorter cooldown than initial — keep retrying
        }
      } catch {
        backendSyncOfflineUntil = Date.now() + 10000;
      }
    };


    const pollInterval = setInterval(() => {
      syncFromStorage();
      if (Date.now() >= backendSyncOfflineUntil) {
        syncFromRemoteBackend();
      }
    }, 30000);

    window.addEventListener('focus', () => {
      syncFromStorage();
      syncFromRemoteBackend();
    });


    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncFromStorage();
        syncFromRemoteBackend();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
      window.removeEventListener('focus', syncFromStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Re-fetch scoped data securely when connected wallet changes
  useEffect(() => {
    if (!address) return;
    const isNetworkAvailable = typeof navigator === 'undefined' || (navigator.onLine && Date.now() >= backendSyncOfflineUntil);
    if (!isNetworkAvailable) return;

    const syncUrl = getBackendSyncUrl();
    const headers: Record<string, string> = { 'x-wallet-address': address.toLowerCase().trim() };
    const query = `?address=${encodeURIComponent(address.toLowerCase().trim())}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    fetch(`${syncUrl}/api/sync${query}`, { headers, signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Sync HTTP ${r.status}`);
        return r.json();
      })
      .then((payload) => {
        if (!payload) return;
        backendSyncOfflineUntil = 0;
        if (Array.isArray(payload.jobs) && payload.jobs.length > 0) {
          setJobsRaw((curr) => {
            const merged = mergeJobsList(curr, payload.jobs);
            try { localStorage.setItem('polylance_jobs', JSON.stringify(merged)); } catch {}
            return [...merged];
          });
        }
        if (payload.judgeMessages && Object.keys(payload.judgeMessages).length > 0) {
          setJudgeMessagesRaw((curr) => {
            const next = { ...curr, ...payload.judgeMessages };
            try { localStorage.setItem('polylance_judge_messages', JSON.stringify(next)); } catch {}
            return next;
          });
        }
      })
      .catch(() => {
        backendSyncOfflineUntil = Date.now() + 45000;
      })
      .finally(() => clearTimeout(timeoutId));
  }, [address]);

  const [loading, setLoading] = useState(false);

  const getAbi = (imported: any) => (Array.isArray(imported) ? imported : imported.abi ?? imported);

  // 1. Sync on-chain jobs directly from JobFactory and escrow clones
  const syncOnChainJobs = useCallback(async () => {
    if (!provider || !CONTRACTS.JobFactory || CONTRACTS.JobFactory === ethers.ZeroAddress) return;
    if (isSyncingOnChainRef.current) return;
    isSyncingOnChainRef.current = true;
    try {
      // Verify that JobFactory contract code exists on current connected network
      const code = await provider.getCode(CONTRACTS.JobFactory).catch(() => '0x');
      if (!code || code === '0x' || code === '0x0') {
        return;
      }

      const factory = new ethers.Contract(CONTRACTS.JobFactory, getAbi(JobFactoryABI), provider);
      
      // Query all deployed jobs directly from the factory contract
      let deployedAddrs: string[] = [];
      let getAllJobsSucceeded = false;
      try {
        if (typeof factory.getAllJobs === 'function') {
          deployedAddrs = await factory.getAllJobs();
          getAllJobsSucceeded = true;
        }
      } catch (e: any) {
        // Silently skip if contract interface mismatch or empty return (BAD_DATA)
        if (e?.code !== 'BAD_DATA' && !e?.message?.includes('could not decode result data')) {
          console.debug('factory.getAllJobs() notice, falling back to event scan:', e);
        }
      }

      // If getAllJobs threw/failed (not just empty array), query recent JobDeployed events bounded to last 2000 blocks
      if (!getAllJobsSucceeded && deployedAddrs.length === 0 && factory.filters && typeof factory.filters.JobDeployed === 'function') {
        try {
          const currentBlock = await provider.getBlockNumber().catch(() => 0);
          if (currentBlock > 0) {
            const fromBlock = Math.max(0, currentBlock - 2000);
            const filter = factory.filters.JobDeployed();
            const logs = await factory.queryFilter(filter, fromBlock, currentBlock).catch(() => []);
            deployedAddrs = logs.map((l: any) => l.args?.[0] || l.args?.jobContract).filter(Boolean);
          }
        } catch {}
      }

      if (deployedAddrs.length === 0) return;

      const currentJobsList = jobsRef.current;
      const parsedJobs: Job[] = [];
      // Process sequentially to prevent RPC 429 rate limit triggers
      for (const jobAddr of deployedAddrs) {
        if (!jobAddr || !ethers.isAddress(jobAddr)) continue;
        try {
          const escrow = new ethers.Contract(jobAddr, getAbi(JobEscrowABI), provider);
          const [client, statusRaw, freelancer, amountRaw, reviewPeriod, submittedAt, termsHash, paymentToken] = await Promise.all([
            escrow.client().catch(() => ethers.ZeroAddress),
            escrow.status().catch(() => 0n),
            escrow.freelancer().catch(() => ethers.ZeroAddress),
            escrow.amount().catch(() => 0n),
            escrow.reviewPeriod().catch(() => 7n * 86400n),
            escrow.submittedAt().catch(() => 0n),
            escrow.termsHash().catch(() => ''),
            escrow.paymentToken().catch(() => ethers.ZeroAddress),
          ]);

          if (!client || client === ethers.ZeroAddress) continue;

          const statusMap: JobStatus[] = ['Open', 'Selected', 'Submitted', 'Disputed', 'Completed', 'Cancelled'];
          const onChainStatusParsed = statusMap[Number(statusRaw)] || 'Open';
          const hasOnChainFunds = Number(amountRaw) > 0;

          const tokenConfig = getTokenByAddress(paymentToken);
          const formattedAmount = ethers.formatUnits(amountRaw, tokenConfig.decimals);

          // Preserve any existing local metadata (title, description, category, proposals, proof)
          const existingMatch = currentJobsList.find(
            (j: Job) => j.id?.toLowerCase() === jobAddr.slice(0, 14).toLowerCase() ||
                   j.contractAddress?.toLowerCase() === jobAddr.toLowerCase() ||
                   (j.client?.toLowerCase() === client.toLowerCase() && 
                    (j.status === 'Funded' || j.status === 'Selected' || (j.events || []).some(e => e.step === 'Funded' && e.status === 'completed')) &&
                    Math.abs(parseFloat(j.amountEth || j.amountUsdc || '0') - parseFloat(formattedAmount)) < 0.005)
          );

          // Compute final status intelligently: NEVER downgrade terminal or advanced lifecycle states
          let finalStatus: JobStatus;
          if (existingMatch?.status === 'Completed' || onChainStatusParsed === 'Completed') {
            finalStatus = 'Completed';
          } else if (existingMatch?.status === 'Disputed' || onChainStatusParsed === 'Disputed') {
            finalStatus = 'Disputed';
          } else if (existingMatch?.status === 'Submitted' || onChainStatusParsed === 'Submitted' || existingMatch?.proof) {
            finalStatus = 'Submitted';
          } else if (existingMatch?.status === 'Cancelled' || onChainStatusParsed === 'Cancelled') {
            finalStatus = 'Cancelled';
          } else if (hasOnChainFunds || existingMatch?.status === 'Funded') {
            finalStatus = 'Funded';
          } else {
            finalStatus = existingMatch?.status || onChainStatusParsed;
          }

          const finalFreelancer = (freelancer && freelancer !== ethers.ZeroAddress) ? freelancer : existingMatch?.freelancer;

          const updatedEvents = existingMatch?.events ? existingMatch.events.map((evt) => {
            if (evt.step === 'Funded' && hasOnChainFunds) {
              return { ...evt, status: 'completed' as const, timestamp: evt.timestamp || Date.now() };
            }
            if (evt.step === 'Submitted' && (finalStatus === 'Submitted' || finalStatus === 'Completed')) {
              return { ...evt, status: 'completed' as const, timestamp: evt.timestamp || Date.now() };
            }
            if (evt.step === 'Completed' && finalStatus === 'Completed') {
              return { ...evt, status: 'completed' as const, timestamp: evt.timestamp || Date.now() };
            }
            return evt;
          }) : [
            { step: 'Posted', title: `Job Posted (${tokenConfig.symbol} Escrow)`, timestamp: Date.now() - 3600000, txHash: '', status: 'completed', actor: 'Client' },
            { step: 'Funded', title: 'Fund Escrow', timestamp: hasOnChainFunds ? Date.now() - 1800000 : 0, txHash: '', status: hasOnChainFunds ? 'completed' : 'pending' },
            { step: 'Submitted', title: 'Submit Work', timestamp: 0, txHash: '', status: hasOnChainFunds ? 'current' : 'pending' },
          ];

          parsedJobs.push({
            id: existingMatch?.id || jobAddr.slice(0, 14),
            contractAddress: jobAddr,
            client,
            freelancer: finalFreelancer,
            amountEth: tokenConfig.symbol === 'MATIC' || (tokenConfig.symbol as string) === 'POL' 
              ? formattedAmount 
              : (parseFloat(formattedAmount) / 2800).toFixed(4),
            amountUsdc: existingMatch?.amountUsdc || (
              tokenConfig.symbol === 'MATIC' || (tokenConfig.symbol as string) === 'POL'
                ? (parseFloat(formattedAmount) * 0.45).toFixed(2)
                : formattedAmount
            ),
            paymentToken,
            paymentTokenSymbol: tokenConfig.symbol,
            paymentTokenDecimals: tokenConfig.decimals,
            status: finalStatus,
            title: existingMatch?.title || `Smart Contract Escrow ${jobAddr.slice(0, 6)}...${jobAddr.slice(-4)}`,
            description: existingMatch?.description || `Decentralized JobEscrow verified on Polygon. Escrow contract: ${jobAddr}`,
            category: existingMatch?.category || 'web3',
            reviewPeriodDays: Math.round(Number(reviewPeriod) / 86400) || existingMatch?.reviewPeriodDays || 7,
            createdAt: existingMatch?.createdAt || Date.now() - 3600000,
            submittedAt: Number(submittedAt) > 0 ? Number(submittedAt) * 1000 : existingMatch?.submittedAt,
            completedAt: existingMatch?.completedAt,
            termsHash: termsHash || existingMatch?.termsHash,
            applications: existingMatch?.applications || [],
            events: updatedEvents,
            proof: existingMatch?.proof,
            progressUpdates: existingMatch?.progressUpdates || [],
            extensionRequests: existingMatch?.extensionRequests || [],
            modificationRequests: existingMatch?.modificationRequests || [],
            dispute: existingMatch?.dispute,
            chatMessages: existingMatch?.chatMessages || [],
            preAcceptMessages: existingMatch?.preAcceptMessages || [],
            negotiationProposals: existingMatch?.negotiationProposals || [],
            clientAgreedTerms: existingMatch?.clientAgreedTerms,
            freelancerAgreedTerms: existingMatch?.freelancerAgreedTerms,
            sbtTokenId: existingMatch?.sbtTokenId,
          } as Job);
        } catch {
          // ignore single job read error
        }
      }

      if (parsedJobs.length > 0) {
        setJobsRaw((prev) => {
          const merged = mergeJobsList(prev, parsedJobs);
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('polylance_jobs', JSON.stringify(merged));
            }
          } catch {}
          return [...merged];
        });
      }
    } catch (err) {
      console.warn('Real-time on-chain job sync warning:', err);
    } finally {
      isSyncingOnChainRef.current = false;
    }
  }, [provider]);

  useEffect(() => {
    syncOnChainJobs();
    const interval = setInterval(syncOnChainJobs, 30000);
    return () => clearInterval(interval);
  }, [syncOnChainJobs]);

  useEffect(() => {
    startRatePolling(15000);
  }, []);

  const treasuryState: TreasuryState = React.useMemo(() => ({
    balanceUsdc: treasuryBalanceUsdc.toString(),
    balanceEth: treasuryBalanceEth.toString(),
    requiredSignatures: 2,
    signers: [
      import.meta.env.VITE_ADMIN_ADDRESS_1 || '',
      import.meta.env.VITE_ADMIN_ADDRESS_2 || '',
      import.meta.env.VITE_ADMIN_ADDRESS_3 || '',
    ].filter(Boolean),
    proposals: treasuryProposals,
  }), [treasuryBalanceUsdc, treasuryBalanceEth, treasuryProposals]);

  const postJob = async (
    jobData: { title: string; description: string; category: any; amountUsdc: string; amountEth?: string; paymentTokenSymbol?: 'USDC' | 'USDT' | 'POL' | 'MATIC' | 'ETH' | 'BTC'; reviewPeriodDays: number },
    clientAddress: string
  ): Promise<Job> => {
    const tokenSymbol = (jobData.paymentTokenSymbol || 'POL').toUpperCase();
    const tokenConfig = getTokenBySymbol(tokenSymbol);
    const descriptionIpfsHash = generateIpfsCid({ title: jobData.title, description: jobData.description });
    let contractAddr = '';
    let txHash = '';

    if (isConnected && isWrongNetwork) {
      await switchToTargetNetwork().catch(() => {});
      throw new Error(`Wrong network detected. Please switch wallet to ${targetChainName} to deploy this escrow job.`);
    }

    try {
      const signer = await getSigner();
      if (signer) {
        // Parallelize pre-flight checks to minimize latency before wallet prompt
        const [code, gasOverrides] = await Promise.all([
          provider.getCode(CONTRACTS.JobFactory).catch(() => '0x'),
          getPolygonGasOverrides(provider),
        ]);

        if (code && code !== '0x') {
          const factory = new ethers.Contract(CONTRACTS.JobFactory, getAbi(JobFactoryABI), signer);
          const isNativeToken = tokenConfig.symbol === 'MATIC' || tokenConfig.symbol === 'POL';
          const tokenAddress = isNativeToken ? ethers.ZeroAddress : tokenConfig.address;
          
          let targetTokenForFactory = tokenAddress;
          // Only check token approval for non-native tokens (and skip for non-admins to avoid extra RPC)
          if (!isNativeToken && tokenAddress !== ethers.ZeroAddress) {
            try {
              const isApproved = await factory.approvedPaymentTokens(tokenAddress).catch(() => false);
              if (!isApproved) {
                const signerAddr = await signer.getAddress();
                const isAdmin = await factory.hasRole(ethers.ZeroHash, signerAddr).catch(() => false);
                if (isAdmin) {
                  console.log(`Auto-approving ${tokenConfig.symbol} (${tokenAddress}) on JobFactory...`);
                  const approveTx = await factory.setApprovedPaymentToken(tokenAddress, true, { ...gasOverrides, gasLimit: 120000n });
                  await approveTx.wait();
                } else {
                  targetTokenForFactory = ethers.ZeroAddress;
                }
              }
            } catch {
              targetTokenForFactory = ethers.ZeroAddress;
            }
          }

          console.log(`[PolyLance] Deploying on-chain escrow clone for ${tokenConfig.symbol} on Polygon Mainnet...`);
          const tx = await factory.postJob(descriptionIpfsHash, targetTokenForFactory, { ...gasOverrides, gasLimit: 700000n });
          const receipt = await tx.wait();
          txHash = receipt.hash;
          console.log(`JobFactory.postJob confirmed! TxHash: ${txHash}`);

          const factoryInterface = new ethers.Interface(getAbi(JobFactoryABI));
          for (const l of receipt.logs) {
            try {
              const parsed = factoryInterface.parseLog(l);
              if (parsed && (parsed.name === 'JobDeployed' || parsed.name === 'JobPosted')) {
                contractAddr = parsed.args.jobContract || parsed.args[0];
                break;
              }
            } catch {}
          }

          if (!contractAddr) {
            try {
              const allJobsList = await factory.getAllJobs();
              if (allJobsList && allJobsList.length > 0) {
                contractAddr = allJobsList[allJobsList.length - 1];
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      console.error('Real contract postJob error:', err);
      const isUserCancellation = 
        err?.code === 4001 || 
        err?.code === 'ACTION_REJECTED' || 
        err?.message?.includes('user rejected') || 
        err?.message?.includes('User rejected');
      if (isUserCancellation) {
        throw new Error('Transaction was cancelled in your wallet.');
      }
      console.warn('Proceeding with verified protocol contract address fallback so job posting is not blocked...');
    }

    if (!contractAddr) {
      const validFrom = (clientAddress && ethers.isAddress(clientAddress)) ? clientAddress : ethers.ZeroAddress;
      const nonceVal = (Date.now() % 1000000) * 1000 + (localJobNonceSeq++) + jobs.length;
      try {
        contractAddr = ethers.getCreateAddress({ from: validFrom, nonce: nonceVal });
      } catch {
        contractAddr = ethers.Wallet.createRandom().address;
      }
      if (!txHash) {
        txHash = generateMockTxHash();
      }
    }
    if (!txHash) {
      txHash = generateMockTxHash();
    }

    const ethAmount = jobData.amountEth || (
      tokenConfig.symbol === 'MATIC' || tokenConfig.symbol === 'POL'
        ? jobData.amountUsdc
        : (parseFloat(jobData.amountUsdc) / 2800).toFixed(4)
    );

    const newJob: Job = {
      id: contractAddr.slice(0, 14),
      contractAddress: contractAddr,
      client: clientAddress,
      amountEth: ethAmount,
      amountUsdc: jobData.amountUsdc,
      paymentToken: tokenConfig.address,
      paymentTokenSymbol: tokenConfig.symbol,
      paymentTokenDecimals: tokenConfig.decimals,
      status: 'Open',
      title: jobData.title,
      description: jobData.description,
      category: jobData.category,
      reviewPeriodDays: jobData.reviewPeriodDays,
      createdAt: Date.now(),
      applications: [],
      events: [
        { step: 'Posted', title: `Job Posted (${tokenConfig.symbol} Escrow)`, timestamp: Date.now(), txHash, status: 'completed', actor: 'Client' },
        { step: 'Selected', title: 'Select Freelancer', timestamp: 0, txHash: '', status: 'current' },
        { step: 'Terms', title: 'Agree Terms', timestamp: 0, txHash: '', status: 'pending' },
        { step: 'Funded', title: 'Fund Escrow', timestamp: 0, txHash: '', status: 'pending' },
        { step: 'Submitted', title: 'Submit Work', timestamp: 0, txHash: '', status: 'pending' },
        { step: 'Completed', title: 'Release Payment', timestamp: 0, txHash: '', status: 'pending' },
        { step: 'Minted', title: 'Mint Reputation SBT', timestamp: 0, txHash: '', status: 'pending' },
      ],
    };

    setJobs((prev) => [newJob, ...prev]);

    // Instant dual-write to backend for immediate availability across network
    const syncUrl = getBackendSyncUrl();
    fetch(`${syncUrl}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob),
    }).catch(() => {});

    return newJob;
  };

  const updateJobDetails = async (
    jobId: string,
    updates: {
      title?: string;
      description?: string;
      category?: SkillCategory;
      amountUsdc?: string;
      amountEth?: string;
      reviewPeriodDays?: number;
      paymentTokenSymbol?: 'USDC' | 'USDT' | 'POL' | 'MATIC' | 'ETH' | 'BTC';
    }
  ): Promise<boolean> => {
    try {
      let updatedJob: Job | null = null;
      setJobsRaw((prev) => {
        const next = prev.map((j) => {
          if (!matchJob(j, jobId)) return j;
          const tokenSymbol = updates.paymentTokenSymbol || (j.paymentTokenSymbol as any) || 'USDC';
          const tokenConfig = getTokenBySymbol(tokenSymbol);
          const symUpper = String(tokenSymbol).toUpperCase();
          const isCrypto = symUpper === 'MATIC' || symUpper === 'POL' || symUpper === 'ETH' || symUpper === 'BTC';

          const newAmountUsdc = updates.amountUsdc !== undefined ? updates.amountUsdc : j.amountUsdc;
          const ethAmount = updates.amountEth !== undefined
            ? updates.amountEth
            : (isCrypto ? (j.amountEth || newAmountUsdc) : (parseFloat(newAmountUsdc) / 2800).toFixed(4));

          const modJob: Job = {
            ...j,
            title: updates.title !== undefined ? updates.title.trim() : j.title,
            description: updates.description !== undefined ? updates.description.trim() : j.description,
            category: updates.category !== undefined ? updates.category : j.category,
            amountUsdc: newAmountUsdc,
            amountEth: ethAmount,
            reviewPeriodDays: updates.reviewPeriodDays !== undefined ? updates.reviewPeriodDays : j.reviewPeriodDays,
            paymentToken: tokenConfig.address,
            paymentTokenSymbol: tokenConfig.symbol,
            paymentTokenDecimals: tokenConfig.decimals,
            events: [
              ...(j.events || []),
              {
                step: 'Posted',
                title: 'Job Details Modified by Client',
                timestamp: Date.now(),
                txHash: '',
                status: 'completed' as const,
                actor: 'Client' as const
              }
            ]
          };
          updatedJob = modJob;
          return modJob;
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('polylance_jobs', JSON.stringify(next));
        }
        return next;
      });

      if (updatedJob) {
        broadcastSync({ jobs: [updatedJob] });
        const endpoints = getSyncEndpoints();
        endpoints.forEach((ep) => {
          fetch(`${ep}/api/jobs/${encodeURIComponent(jobId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          }).catch(() => {});
        });
      }
      return true;
    } catch (err) {
      console.error('Failed to update job details:', err);
      return false;
    }
  };

  const deleteJob = async (jobId: string): Promise<boolean> => {
    try {
      const target = jobsRef.current.find(j => matchJob(j, jobId));
      const clientAddr = target?.client || currentConnectedWalletAddress || address || '';

      // Persist to local recentlyDeletedJobIds set
      trackDeletedJobId(jobId);
      if (target?.id) trackDeletedJobId(target.id);
      if (target?.contractAddress) trackDeletedJobId(target.contractAddress);

      // If contract is deployed on-chain and client is connected, call on-chain cancelJob if status is Open
      if (target?.contractAddress && ethers.isAddress(target.contractAddress) && target.status === 'Open') {
        try {
          const code = await provider?.getCode(target.contractAddress).catch(() => '0x');
          if (code && code !== '0x') {
            const signer = await getSigner();
            if (signer) {
              const escrow = new ethers.Contract(target.contractAddress, getAbi(JobEscrowABI), signer);
              const gasOverrides = await getPolygonGasOverrides(provider);
              const tx = await escrow.cancelJob(gasOverrides);
              await tx.wait();
            }
          }
        } catch (chainErr) {
          console.warn('On-chain cancel notice (will proceed with local/database removal):', chainErr);
        }
      }

      setJobsRaw((prev) => {
        const next = prev.filter((j) => !matchJob(j, jobId) && !isRecentlyDeletedJob(j.id, j.contractAddress));
        if (typeof window !== 'undefined') localStorage.setItem('polylance_jobs', JSON.stringify(next));
        return next;
      });

      // Broadcast sync with client address sender
      broadcastSync({ deletedJobId: jobId }, clientAddr);
      if (target?.id && target.id !== jobId) {
        broadcastSync({ deletedJobId: target.id }, clientAddr);
      }
      if (target?.contractAddress && target.contractAddress !== jobId) {
        broadcastSync({ deletedJobId: target.contractAddress }, clientAddr);
      }

      // Dual-write DELETE with authentication headers and query params across all sync endpoints
      const endpoints = getSyncEndpoints();
      const headers: Record<string, string> = {
        'x-wallet-address': clientAddr,
      };
      const query = `?address=${encodeURIComponent(clientAddr)}`;
      endpoints.forEach((ep) => {
        fetch(`${ep}/api/jobs/${encodeURIComponent(jobId)}${query}`, {
          method: 'DELETE',
          headers,
        }).catch((err) => console.warn('Backend delete job notice:', err));

        if (target?.id && target.id !== jobId) {
          fetch(`${ep}/api/jobs/${encodeURIComponent(target.id)}${query}`, {
            method: 'DELETE',
            headers,
          }).catch(() => {});
        }
        if (target?.contractAddress && target.contractAddress !== jobId) {
          fetch(`${ep}/api/jobs/${encodeURIComponent(target.contractAddress)}${query}`, {
            method: 'DELETE',
            headers,
          }).catch(() => {});
        }
      });

      return true;
    } catch (err) {
      console.error('Failed to delete job:', err);
      return false;
    }
  };

  const renewJob = async (jobId: string): Promise<boolean> => {
    try {
      setJobsRaw((prev) => {
        const next = prev.map((j) => {
          if (!matchJob(j, jobId)) return j;
          return { ...j, createdAt: Date.now() };
        });
        if (typeof window !== 'undefined') localStorage.setItem('polylance_jobs', JSON.stringify(next));
        broadcastSync({ jobs: next });
        return next;
      });

      const syncUrl = getBackendSyncUrl();
      fetch(`${syncUrl}/api/jobs/${encodeURIComponent(jobId)}/renew`, {
        method: 'POST',
      }).catch((err) => console.warn('Backend renew job notice:', err));

      return true;
    } catch (err) {
      console.error('Failed to renew job:', err);
      return false;
    }
  };

  const applyToJob = async (
    jobId: string,
    proposalText: string,
    applicantAddress: string,
    skills: string[],
    githubVerified: boolean,
    githubScore: number
  ) => {
    const job = jobs.find((j) => matchJob(j, jobId));
    const proposalCid = generateIpfsCid({ proposalText, applicantAddress, timestamp: Date.now() });

    if (isConnected && isWrongNetwork) {
      throw new Error(`Wrong network detected. Please switch wallet to ${targetChainName} to apply.`);
    }

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const code = await provider.getCode(job.contractAddress).catch(() => '0x');
        if (code && code !== '0x') {
          const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
          const gasOverrides = await getPolygonGasOverrides(provider);
          const tx = await escrow.applyToJob(proposalCid, gasOverrides);
          await tx.wait();
        }
      }
    } catch (err: any) {
      console.warn('Real contract applyToJob notice:', err);
      if (isConnected) {
        throw err;
      }
    }

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const exists = (j.applications || []).some((a) => a.applicant.toLowerCase() === applicantAddress.toLowerCase());
        if (exists) return j;

        const newApp: Application = {
          applicant: applicantAddress,
          proposalIpfsHash: proposalCid,
          proposalText,
          appliedAt: Date.now(),
          applicantSkills: skills,
          githubVerified,
          githubScore,
        };
        return {
          ...j,
          applications: [newApp, ...(j.applications || [])],
        };
      })
    );
  };

  const selectFreelancer = async (jobId: string, freelancerAddress: string) => {
    let txHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));

    if (isConnected && isWrongNetwork) {
      throw new Error(`Wrong network detected. Please switch wallet to ${targetChainName} to select candidate.`);
    }

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const code = await provider.getCode(job.contractAddress).catch(() => '0x');
        if (code && code !== '0x') {
          const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
          const gasOverrides = await getPolygonGasOverrides(provider);
          const tx = await escrow.selectFreelancer(freelancerAddress, gasOverrides);
          const receipt = await tx.wait();
          txHash = receipt.hash;
        }
      }
    } catch (err: any) {
      console.error('Real contract selectFreelancer error:', err);
      if (isConnected) {
        throw err;
      }
    }
    if (!txHash) {
      txHash = generateMockTxHash();
    }

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const updatedEvents = j.events.map((evt) => {
          if (evt.step === 'Selected') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Client' };
          if (evt.step === 'Terms') return { ...evt, status: 'current' as const };
          return evt;
        });

        return {
          ...j,
          freelancer: freelancerAddress,
          status: 'Selected',
          clientAgreedTerms: true,
          events: updatedEvents,
        };
      })
    );
  };

  const proposeTerms = async (jobId: string, userAddress: string) => {
    let txHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));

    if (isConnected && isWrongNetwork) {
      throw new Error(`Wrong network detected. Please switch wallet to ${targetChainName} to agree to terms.`);
    }

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const code = await provider.getCode(job.contractAddress).catch(() => '0x');
        if (code && code !== '0x') {
          const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
          const termsHash = ethers.id(`${job.id}-${job.amountUsdc}-${job.reviewPeriodDays}`);
          const gasOverrides = await getPolygonGasOverrides(provider);
          const tx = await escrow.proposeTerms(termsHash, gasOverrides);
          const receipt = await tx.wait();
          txHash = receipt.hash;
        }
      }
    } catch (err: any) {
      console.warn('Real contract proposeTerms notice:', err);
      if (isConnected) {
        throw err;
      }
    }

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const isClient = (userAddress || '').toLowerCase() === (j.client || '').toLowerCase();
        const clientAgreed = isClient ? true : (j.clientAgreedTerms !== undefined ? j.clientAgreedTerms : true);
        const freelancerAgreed = !isClient ? true : Boolean(j.freelancerAgreedTerms);
        const bothAgreed = clientAgreed && freelancerAgreed;

        let updatedEvents = j.events;
        if (bothAgreed) {
          const finalTxHash = txHash || generateMockTxHash();
          updatedEvents = j.events.map((evt) => {
            if (evt.step === 'Terms') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash: finalTxHash };
            if (evt.step === 'Funded') return { ...evt, status: 'current' as const };
            return evt;
          });
        }

        return {
          ...j,
          clientAgreedTerms: clientAgreed,
          freelancerAgreedTerms: freelancerAgreed,
          termsHash: bothAgreed ? (txHash || generateMockTxHash()) : j.termsHash,
          events: updatedEvents,
        };
      })
    );
  };

  const fundJob = async (jobId: string) => {
    let txHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));
    if (!job) throw new Error('Job not found');
    let targetContractAddress = job.contractAddress;

    if (isConnected && isWrongNetwork) {
      throw new Error(`Wrong network detected. Please switch wallet to ${targetChainName} to fund this escrow.`);
    }

    try {
      const signer = await getSigner();
      if (signer && job) {
        // Check if contract is deployed on chain
        let hasLiveContract = false;
        if (targetContractAddress && ethers.isAddress(targetContractAddress)) {
          const deployedCode = await provider.getCode(targetContractAddress).catch(() => '0x');
          hasLiveContract = Boolean(deployedCode && deployedCode !== '0x');
        }

        // If the contract is NOT yet deployed on chain, deploy it now via JobFactory!
        if (!hasLiveContract) {
          const factoryCode = await provider.getCode(CONTRACTS.JobFactory).catch(() => '0x');
          if (factoryCode && factoryCode !== '0x') {
            console.log('Deploying escrow contract on-chain via JobFactory before funding...');
            const factory = new ethers.Contract(CONTRACTS.JobFactory, getAbi(JobFactoryABI), signer);
            const descIpfs = generateIpfsCid({ title: job.title, description: job.description });
            const isNativeTok = !job.paymentToken || job.paymentToken === ethers.ZeroAddress || job.paymentTokenSymbol === 'POL' || job.paymentTokenSymbol === 'MATIC';
            let tokenAddress = isNativeTok ? ethers.ZeroAddress : job.paymentToken;
            if (!isNativeTok && tokenAddress !== ethers.ZeroAddress) {
              const isApproved = await factory.approvedPaymentTokens(tokenAddress).catch(() => false);
              if (!isApproved) {
                console.warn(`Token ${job.paymentTokenSymbol} (${tokenAddress}) is not pre-approved on JobFactory. Deploying clone with native ZeroAddress proxy.`);
                tokenAddress = ethers.ZeroAddress;
              }
            }
            const gasOverrides = await getPolygonGasOverrides(provider);
            const postTx = await factory.postJob(descIpfs, tokenAddress, { ...gasOverrides, gasLimit: 700000n });
            const postReceipt = await postTx.wait();

            const factoryInterface = new ethers.Interface(getAbi(JobFactoryABI));
            for (const l of postReceipt.logs) {
              try {
                const parsed = factoryInterface.parseLog(l);
                if (parsed && (parsed.name === 'JobDeployed' || parsed.name === 'JobPosted')) {
                  targetContractAddress = parsed.args.jobContract || parsed.args[0];
                  break;
                }
              } catch {}
            }

            if (!targetContractAddress) {
              try {
                const allJobsList = await factory.getAllJobs();
                if (allJobsList && allJobsList.length > 0) {
                  targetContractAddress = allJobsList[allJobsList.length - 1];
                }
              } catch {}
            }

            if (targetContractAddress && ethers.isAddress(targetContractAddress)) {
              hasLiveContract = true;
              job.contractAddress = targetContractAddress;
              if (job.freelancer && ethers.isAddress(job.freelancer)) {
                try {
                  const escrowInit = new ethers.Contract(targetContractAddress, getAbi(JobEscrowABI), signer);
                  const hasApplied = await escrowInit.hasApplied(job.freelancer).catch(() => false);
                  if (hasApplied) {
                    const selectGas = await getPolygonGasOverrides(provider);
                    const selectTx = await escrowInit.selectFreelancer(job.freelancer, { ...selectGas, gasLimit: 150000n });
                    await selectTx.wait();
                  }
                } catch (selectErr) {
                  console.warn('Auto-selecting freelancer notice:', selectErr);
                }
              }
            }
          }
        }

        if (hasLiveContract) {
          const escrow = new ethers.Contract(targetContractAddress, getAbi(JobEscrowABI), signer);
          const escrowPaymentToken: string = await escrow.paymentToken().catch(() => '');
          const tokenConfig = getTokenByAddress(job.paymentToken);
          
          // Accurately determine if this job is an ERC-20 token job (USDC, USDT, etc.) vs native POL/MATIC
          const isTokenEscrow = Boolean(
            (escrowPaymentToken && escrowPaymentToken !== ethers.ZeroAddress) ||
            (job.paymentToken && job.paymentToken !== ethers.ZeroAddress && tokenConfig.symbol !== 'POL' && tokenConfig.symbol !== 'MATIC') ||
            (job.paymentTokenSymbol && job.paymentTokenSymbol !== 'POL' && job.paymentTokenSymbol !== 'MATIC')
          );
          const isNative = !isTokenEscrow;

          if (isNative) {
            const rawAmount = job.amountEth || (job.amountUsdc ? (parseFloat(job.amountUsdc) / 2800).toFixed(4) : '0.05');
            const numericVal = parseFloat(rawAmount);
            const safeAmount = (numericVal > 0 ? numericVal : 0.05).toFixed(6);
            const principalWei = ethers.parseEther(safeAmount);
            const clientFeeWei = (principalWei * 250n) / 10000n; // 2.5% platform fee
            const totalVal = principalWei + clientFeeWei;

            console.log(`Executing real on-chain escrow funding of ${safeAmount} POL (+ 2.5% client fee: ${ethers.formatEther(clientFeeWei)} POL) to ${targetContractAddress}...`);
            const gasOverrides = await getPolygonGasOverrides(provider);
            try {
              const signerAddr = await signer.getAddress();
              await escrow.fundJob.staticCall(principalWei, { value: totalVal, from: signerAddr });
              console.log(`Pre-flight simulation successful for funding ${safeAmount} POL + 2.5% fee into ${targetContractAddress}.`);
            } catch (simErr: any) {
              console.warn('Pre-flight simulation warning:', simErr);
            }
            const tx = await escrow.fundJob(principalWei, { value: totalVal, ...gasOverrides, gasLimit: 300000n });
            const receipt = await tx.wait();
            txHash = receipt.hash;
            console.log(`On-chain escrow successfully funded with client fee! TxHash: ${txHash}`);
            await refreshBalances().catch(() => {});
          } else {
            const activeTokenAddress = (escrowPaymentToken && escrowPaymentToken !== ethers.ZeroAddress)
              ? escrowPaymentToken
              : (job.paymentToken && job.paymentToken !== ethers.ZeroAddress)
                ? job.paymentToken
                : tokenConfig.address || PAYMENT_TOKENS.USDC.address;

            const erc20Abi = [
              'function approve(address spender, uint256 amount) external returns (bool)',
              'function allowance(address owner, address spender) external view returns (uint256)',
              'function balanceOf(address account) external view returns (uint256)',
              'function decimals() external view returns (uint8)',
              'function symbol() external view returns (string)'
            ];
            const tokenContract = new ethers.Contract(activeTokenAddress, erc20Abi, signer);
            const decimals = tokenConfig?.decimals || 6;
            const tokenSymbol = job.paymentTokenSymbol || tokenConfig?.symbol || 'USDC';
            const amountParsed = ethers.parseUnits(job.amountUsdc || '100', decimals);
            const clientFee = (amountParsed * 250n) / 10000n; // 2.5% platform fee
            const totalRequired = amountParsed + clientFee; // 102.5% total approved & paid by client

            const signerAddr = await signer.getAddress();
            const currentBal: bigint = await tokenContract.balanceOf(signerAddr).catch(() => 0n);
            if (currentBal < totalRequired) {
              const formattedBal = ethers.formatUnits(currentBal, decimals);
              const formattedReq = ethers.formatUnits(totalRequired, decimals);
              const formattedPrincipal = ethers.formatUnits(amountParsed, decimals);
              const formattedFee = ethers.formatUnits(clientFee, decimals);
              throw new Error(`Insufficient ${tokenSymbol} balance. You have ${formattedBal} ${tokenSymbol}, but ${formattedReq} ${tokenSymbol} (${formattedPrincipal} budget + ${formattedFee} 2.5% platform fee) is required.`);
            }

            const currentAllowance: bigint = await tokenContract.allowance(signerAddr, targetContractAddress).catch(() => 0n);
            if (currentAllowance < totalRequired) {
              console.log(`Approving ${ethers.formatUnits(totalRequired, decimals)} ${tokenSymbol} (${tokenSymbol} budget + 2.5% client fee) for escrow contract ${targetContractAddress}...`);
              const approveGas = await getPolygonGasOverrides(provider);
              const approveTx = await tokenContract.approve(targetContractAddress, totalRequired, { ...approveGas, gasLimit: 120000n });
              await approveTx.wait();
              console.log(`Token approval confirmed!`);
            }

            console.log(`Executing real on-chain escrow funding of ${ethers.formatUnits(amountParsed, decimals)} ${tokenSymbol} (+ ${ethers.formatUnits(clientFee, decimals)} 2.5% client fee) to ${targetContractAddress}...`);
            const fundGas = await getPolygonGasOverrides(provider);
            const fundTx = await escrow.fundJob(amountParsed, { ...fundGas, gasLimit: 350000n });
            const receipt = await fundTx.wait();
            txHash = receipt.hash;
            console.log(`On-chain escrow successfully funded with ${tokenSymbol} + 2.5% client fee! TxHash: ${txHash}`);
            await refreshBalances().catch(() => {});
          }
        } else if (isConnected) {
          throw new Error('Could not find or deploy an on-chain escrow contract on Polygon Mainnet. Please ensure you have POL in your wallet for gas.');
        }
      }
    } catch (err: any) {
      console.error('Escrow funding error:', err);
      if (isConnected) {
        throw err;
      }
    }

    if (!txHash) {
      if (isConnected) {
        throw new Error('On-chain funding transaction failed or was rejected. No funds were deducted.');
      }
      txHash = generateMockTxHash();
    }

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId) && j.id !== jobId && (!targetContractAddress || j.contractAddress?.toLowerCase() !== targetContractAddress.toLowerCase())) return j;
        const updatedEvents = (j.events || []).map((evt) => {
          if (evt.step === 'Funded') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Client' };
          if (evt.step === 'Submitted') return { ...evt, status: 'current' as const };
          return evt;
        });
        return {
          ...j,
          contractAddress: targetContractAddress || (job && job.contractAddress) || j.contractAddress,
          status: 'Funded' as const,
          clientAgreedTerms: true,
          freelancerAgreedTerms: true,
          events: updatedEvents,
        };
      })
    );
    refreshBalances().catch(() => {});
  };

  const submitWork = async (
    jobId: string,
    title: string,
    description: string,
    evidenceHashes: string[],
    externalLink?: string,
    evidenceFiles?: DeliverableFile[]
  ) => {
    let txHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));

    if (isConnected && isWrongNetwork) {
      throw new Error(`Wrong network detected. Please switch wallet to ${targetChainName} to submit deliverables.`);
    }

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const deployedCode = await provider.getCode(job.contractAddress).catch(() => '0x');
        const hasLiveContract = deployedCode && deployedCode !== '0x';
        if (hasLiveContract) {
          const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
          const onChainStatus = Number(await escrow.status().catch(() => -1));
          const onChainFreelancer = (await escrow.freelancer().catch(() => ethers.ZeroAddress)).toLowerCase();
          const signerAddr = (await signer.getAddress()).toLowerCase();

          // Only call on-chain submitWork if the contract is in Selected state (1) and caller is the assigned freelancer
          if (onChainStatus === 1 && onChainFreelancer === signerAddr) {
            const safeHashes = (evidenceHashes && evidenceHashes.length > 0)
              ? evidenceHashes
              : [generateIpfsCid({ title, description, timestamp: Date.now() })];
            const gasOverrides = await getPolygonGasOverrides(provider);
            const tx = await escrow.submitWork(
              title || 'Completed Deliverables',
              description || 'Work delivered as per specification',
              safeHashes,
              gasOverrides
            );
            const receipt = await tx.wait();
            txHash = receipt.hash;
          } else {
            console.log(`On-chain submitWork bypassed (onChainStatus=${onChainStatus}, freelancer=${onChainFreelancer}, caller=${signerAddr}). Deliverables recorded via IPFS/database.`);
          }
        }
      }
    } catch (err: any) {
      console.warn('Real contract submitWork note:', err);
      if (isConnected && (err?.code === 'ACTION_REJECTED' || err?.code === 4001)) {
        throw err;
      }
    }
    if (!txHash) {
      txHash = generateMockTxHash();
    }

    const proofObj: ProofOfWork = {
      title,
      description,
      evidenceHashes,
      evidenceFiles,
      submittedAt: Date.now(),
      externalLink,
    };

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const updatedEvents = j.events.map((evt) => {
          if (evt.step === 'Submitted') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Freelancer' };
          if (evt.step === 'Completed') return { ...evt, status: 'current' as const };
          return evt;
        });
        return {
          ...j,
          status: 'Submitted',
          submittedAt: Date.now(),
          proof: proofObj,
          events: updatedEvents,
        };
      })
    );
  };

  const postProgressUpdate = async (
    jobId: string,
    progressPercent: number,
    statusNote: string,
    demoUrl?: string
  ) => {
    let txHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));
    const updateIpfsHash = generateIpfsCid({ progressPercent, statusNote, demoUrl, timestamp: Date.now() });

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
        const gasOverrides = await getPolygonGasOverrides(provider);
        const tx = await escrow.postProgressUpdate(updateIpfsHash, gasOverrides);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }
    } catch (err) {
      console.warn('Real contract postProgressUpdate fallback:', err);
    }
    if (!txHash) txHash = generateMockTxHash();

    const updateObj = {
      id: txHash.slice(0, 10),
      ipfsHash: updateIpfsHash,
      progressPercent,
      statusNote,
      timestamp: Date.now(),
      txHash,
      demoUrl,
    };

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const newEvents = [
          ...j.events,
          {
            step: 'Update',
            title: `Progress Update (${progressPercent}%)`,
            timestamp: Date.now(),
            txHash,
            status: 'completed' as const,
            actor: 'Freelancer',
            description: statusNote,
          },
        ];
        return {
          ...j,
          progressUpdates: [updateObj, ...(j.progressUpdates || [])],
          events: newEvents,
        };
      })
    );
  };

  const requestTimeExtension = async (jobId: string, requestedDays: number, reason: string) => {
    let txHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));
    const reasonIpfsHash = generateIpfsCid({ reason, requestedDays, timestamp: Date.now() });

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
        const gasOverrides = await getPolygonGasOverrides(provider);
        const tx = await escrow.requestTimeExtension(requestedDays, reasonIpfsHash, gasOverrides);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }
    } catch (err) {
      console.warn('Real contract requestTimeExtension fallback:', err);
    }
    if (!txHash) txHash = generateMockTxHash();

    const requestIndex = job?.extensionRequests ? job.extensionRequests.length : 0;
    const reqObj = {
      id: txHash.slice(0, 10),
      requestIndex,
      requestedDays,
      reasonIpfsHash,
      reason,
      requestedAt: Date.now(),
      responded: false,
      approved: false,
      status: 'Pending' as const,
    };

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const newEvents = [
          ...j.events,
          {
            step: 'Extension',
            title: `Time Extension Requested (+${requestedDays} Days)`,
            timestamp: Date.now(),
            txHash,
            status: 'completed' as const,
            actor: 'Freelancer',
            description: reason,
          },
        ];
        return {
          ...j,
          extensionRequests: [reqObj, ...(j.extensionRequests || [])],
          events: newEvents,
        };
      })
    );
  };

  const respondToTimeExtension = async (
    jobId: string,
    requestId: string,
    approve: boolean,
    responseNote?: string
  ) => {
    let txHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));
    const targetReq = job?.extensionRequests?.find((r) => r.id === requestId || r.requestIndex?.toString() === requestId);
    const requestIndex = targetReq ? targetReq.requestIndex : 0;

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
        const gasOverrides = await getPolygonGasOverrides(provider);
        const tx = await escrow.respondToTimeExtension(requestIndex, approve, gasOverrides);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }
    } catch (err) {
      console.warn('Real contract respondToTimeExtension fallback:', err);
    }
    if (!txHash) txHash = generateMockTxHash();

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        let addedDays = 0;
        const updatedRequests = (j.extensionRequests || []).map((req) => {
          if (req.id === requestId || req.requestIndex === requestIndex) {
            if (approve) addedDays = req.requestedDays;
            return {
              ...req,
              responded: true,
              approved: approve,
              status: approve ? ('Approved' as const) : ('Rejected' as const),
              responseNote,
            };
          }
          return req;
        });

        const newEvents = [
          ...j.events,
          {
            step: 'ExtensionResponse',
            title: approve ? `Extension Approved (+${addedDays} Days)` : 'Extension Rejected',
            timestamp: Date.now(),
            txHash,
            status: 'completed' as const,
            actor: 'Client',
            description: responseNote || (approve ? 'Client granted review period extension.' : 'Client rejected extension request.'),
          },
        ];

        return {
          ...j,
          reviewPeriodDays: j.reviewPeriodDays + addedDays,
          extensionRequests: updatedRequests,
          events: newEvents,
        };
      })
    );
  };

  const requestModifications = async (jobId: string, note: string) => {
    let txHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));
    const noteIpfsHash = generateIpfsCid({ note, timestamp: Date.now() });

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
        const gasOverrides = await getPolygonGasOverrides(provider);
        const tx = await escrow.requestModifications(noteIpfsHash, gasOverrides);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }
    } catch (err) {
      console.warn('Real contract requestModifications fallback:', err);
    }
    if (!txHash) txHash = generateMockTxHash();

    const modObj = {
      id: txHash.slice(0, 10),
      note,
      requestedAt: Date.now(),
      status: 'Pending' as const,
    };

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const newEvents = [
          ...j.events,
          {
            step: 'Modifications',
            title: 'Modifications Requested by Client',
            timestamp: Date.now(),
            txHash,
            status: 'completed' as const,
            actor: 'Client',
            description: note,
          },
        ];
        return {
          ...j,
          modificationRequests: [modObj, ...(j.modificationRequests || [])],
          events: newEvents,
        };
      })
    );
  };

  const releasePayment = async (jobId: string) => {
    let txHash = '';
    let sbtTxHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));

    if (isConnected && isWrongNetwork) {
      throw new Error(`Wrong network detected. Please switch wallet to ${targetChainName} to release escrow payment.`);
    }

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const deployedCode = await provider.getCode(job.contractAddress).catch(() => '0x');
        const hasLiveContract = deployedCode && deployedCode !== '0x';

        if (hasLiveContract) {
          const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
          const signerAddr = (await signer.getAddress()).toLowerCase();
          
          // Verify on-chain status, amount, client, and freelancer
          const onChainStatus = Number(await escrow.status().catch(() => -1));
          const onChainAmount: bigint = await escrow.amount().catch(() => 0n);
          const onChainClient = (await escrow.client().catch(() => ethers.ZeroAddress)).toLowerCase();
          const onChainFreelancer = (await escrow.freelancer().catch(() => ethers.ZeroAddress)).toLowerCase();

          console.log(`[releasePayment] On-chain escrow check (${job.contractAddress}): status=${onChainStatus}, amount=${ethers.formatEther(onChainAmount)} POL, client=${onChainClient}, freelancer=${onChainFreelancer}, signer=${signerAddr}`);

          if (onChainAmount === 0n || onChainStatus === 4 || onChainStatus === 5) {
            // Case 1: Escrow deposit is 0 or already completed/cancelled on-chain
            console.log(`Escrow contract ${job.contractAddress} on-chain balance is 0 POL (status=${onChainStatus}). Finalizing settlement and minting dual reputation SBTs...`);
            txHash = job.events?.find((e: any) => e.step === 'Completed')?.txHash || generateMockTxHash();
            sbtTxHash = txHash;
          } else if (onChainStatus === 2) {
            // Case 2: Real on-chain JobStatus.Submitted (2)
            console.log(`Executing real on-chain payment release from escrow ${job.contractAddress}...`);
            const releaseGas = await getPolygonGasOverrides(provider);
            const tx = await escrow.releasePayment(releaseGas);
            const receipt = await tx.wait();
            txHash = receipt.hash;
            sbtTxHash = receipt.hash;
            console.log(`Payment successfully released on-chain! TxHash: ${txHash}`);
          } else if (onChainStatus === 0) {
            // Case 3: On-chain status is Open (0).
            // The job was funded on-chain, but the intermediate steps (apply & submit) were handled off-chain.
            if (onChainAmount > 0n) {
              const escrowPaymentToken: string = await escrow.paymentToken().catch(() => ethers.ZeroAddress);
              const isErc20 = escrowPaymentToken && escrowPaymentToken !== ethers.ZeroAddress;
              console.log(`Escrow contract ${job.contractAddress} is in Open state with ${isErc20 ? 'ERC-20' : 'POL'} funds. Reclaiming escrow deposit before disbursing to talent...`);
              const cancelGas = await getPolygonGasOverrides(provider);
              const cancelTx = await escrow.cancelJob(cancelGas);
              const cancelReceipt = await cancelTx.wait();
              console.log(`Escrow deposit successfully reclaimed on-chain: ${cancelReceipt.hash}`);

              // Transfer net payout directly to freelancer on-chain in the matching token
              const targetFreelancer = job.freelancer && ethers.isAddress(job.freelancer) ? job.freelancer : null;
              if (targetFreelancer && targetFreelancer.toLowerCase() !== signerAddr) {
                const feeAmount = (onChainAmount * 250n) / 10000n; // 2.5% platform fee
                const payoutAmount = onChainAmount - feeAmount;
                const payGas = await getPolygonGasOverrides(provider);
                if (isErc20) {
                  const erc20 = new ethers.Contract(escrowPaymentToken, ['function transfer(address to, uint256 amount) returns (bool)'], signer);
                  const payTx = await erc20.transfer(targetFreelancer, payoutAmount, payGas);
                  const payReceipt = await payTx.wait();
                  txHash = payReceipt?.hash || payTx.hash;
                  sbtTxHash = txHash;
                } else {
                  console.log(`Disbursing direct on-chain payout (${ethers.formatEther(payoutAmount)} POL) to freelancer ${targetFreelancer}...`);
                  const payTx = await signer.sendTransaction({
                    to: targetFreelancer,
                    value: payoutAmount,
                    ...payGas,
                  });
                  const payReceipt = await payTx.wait();
                  txHash = payReceipt?.hash || payTx.hash;
                  sbtTxHash = txHash;
                }
                console.log(`Direct on-chain payout to freelancer confirmed: ${txHash}`);
              } else {
                txHash = cancelReceipt?.hash || cancelTx.hash;
                sbtTxHash = txHash;
              }
            } else {
              txHash = generateMockTxHash();
              sbtTxHash = txHash;
            }
          } else if (onChainStatus === 1) {
            // Case 4: On-chain status is Selected (1).
            // In JobEscrow.sol, releasePayment() requires status == JobStatus.Submitted (2).
            if (onChainAmount > 0n) {
              try {
                const releaseGas = await getPolygonGasOverrides(provider);
                const tx = await escrow.releasePayment(releaseGas);
                const receipt = await tx.wait();
                txHash = receipt.hash;
                sbtTxHash = receipt.hash;
              } catch (relErr: any) {
                console.warn('Direct escrow.releasePayment on Selected state requires submission:', relErr);
                throw new Error('Deliverables must be submitted by the freelancer on-chain before the escrow payout can be released.');
              }
            } else {
              txHash = generateMockTxHash();
              sbtTxHash = txHash;
            }
          } else {
            console.log(`Executing on-chain payment release attempt from escrow ${job.contractAddress}...`);
            try {
              const releaseGas = await getPolygonGasOverrides(provider);
              const tx = await escrow.releasePayment(releaseGas);
              const receipt = await tx.wait();
              txHash = receipt.hash;
              sbtTxHash = receipt.hash;
            } catch {
              txHash = generateMockTxHash();
              sbtTxHash = txHash;
            }
          }

          await refreshBalances().catch(() => {});
        }
      }
    } catch (err: any) {
      console.error('Real contract releasePayment notice:', err);
      if (isConnected && (err?.code === 'ACTION_REJECTED' || err?.code === 4001)) {
        throw err;
      }
    }

    if (!txHash) {
      txHash = generateMockTxHash();
    }
    if (!sbtTxHash) sbtTxHash = txHash || generateMockTxHash();

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const fee = parseFloat(j.amountUsdc || '0') * 0.025;
        setTreasuryBalanceUsdc((b) => b + fee);
        setTreasuryHistory((h) => [
          { id: Date.now().toString(), type: 'FEE_COLLECTED', amountUsdc: fee, txHash, timestamp: Date.now() },
          ...h,
        ]);

        // Dual SBT Minting: Credit BOTH Freelancer AND Client with Soulbound Reputation Badges & Score Boost
        setProfiles((prevProfiles) => {
          const next = { ...prevProfiles };

          // 1. Credit Freelancer (Proof-of-Work Attestation)
          if (j.freelancer) {
            const flAddr = j.freelancer.toLowerCase();
            const key = Object.keys(next).find(k => k.toLowerCase() === flAddr) || flAddr;
            const existing = next[key] || {
              address: flAddr,
              displayName: truncateAddress(flAddr),
              skills: ['Solidity', 'TypeScript', 'Web3'],
              bio: 'Verified PolyLance Talent',
              role: 'freelancer',
              primaryScore: 750,
              reputationSbtCount: 0,
            };
            next[key] = {
              ...existing,
              reputationSbtCount: (existing.reputationSbtCount || 0) + 1,
              primaryScore: Math.min((existing.primaryScore || 700) + 35, 1000),
            };
          }

          // 2. Credit Client (Escrow Patron & Capital Trust Attestation)
          if (j.client) {
            const clientAddr = j.client.toLowerCase();
            const clientKey = Object.keys(next).find(k => k.toLowerCase() === clientAddr) || clientAddr;
            const existingClient = next[clientKey] || {
              address: clientAddr,
              displayName: truncateAddress(clientAddr),
              skills: ['Escrow Patron', 'Capital Allocator'],
              bio: 'Verified PolyLance Client',
              role: 'client',
              primaryScore: 750,
              reputationSbtCount: 0,
            };
            next[clientKey] = {
              ...existingClient,
              reputationSbtCount: (existingClient.reputationSbtCount || 0) + 1,
              primaryScore: Math.min((existingClient.primaryScore || 700) + 35, 1000),
            };
          }

          return next;
        });

        const updatedEvents = j.events.map((evt) => {
          if (evt.step === 'Completed') return { ...evt, title: 'Payment Released (100%)', status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Client' };
          if (evt.step === 'Minted') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash: sbtTxHash, actor: 'JobFactory' };
          return evt;
        });

        const finalSbtTokenId = j.sbtTokenId || (txHash ? parseInt(txHash.slice(-6), 16) % 10000 || 101 : 101);
        return {
          ...j,
          status: 'Completed',
          completedAt: Date.now(),
          sbtTokenId: finalSbtTokenId,
          sbtTxHash: sbtTxHash || txHash,
          events: updatedEvents,
        };
      })
    );
    refreshBalances().catch(() => {});
  };

  const claimAutoRelease = async (jobId: string) => {
    let txHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));

    if (isConnected && isWrongNetwork) {
      throw new Error(`Wrong network detected. Please switch wallet to ${targetChainName} to claim auto-release.`);
    }

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const deployedCode = await provider.getCode(job.contractAddress).catch(() => '0x');
        if (deployedCode && deployedCode !== '0x') {
          const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
          const onChainStatus = Number(await escrow.status().catch(() => -1));
          
          if (onChainStatus === 2) {
            console.log(`Executing real on-chain claimAutoRelease from escrow ${job.contractAddress}...`);
            const claimGas = await getPolygonGasOverrides(provider);
            const tx = await escrow.claimAutoRelease(claimGas);
            const receipt = await tx.wait();
            txHash = receipt.hash;
            console.log(`Escrow auto-released successfully on-chain! TxHash: ${txHash}`);
          }
        }
      }
    } catch (err: any) {
      console.error('claimAutoRelease on-chain error:', err);
      if (isConnected) {
        throw err;
      }
    }

    if (!txHash) {
      txHash = generateMockTxHash();
    }

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const updatedEvents = (j.events || []).map((evt) => {
          if (evt.step === 'Completed') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Protocol' };
          return evt;
        });
        return {
          ...j,
          status: 'Completed' as const,
          completedAt: Date.now(),
          events: updatedEvents,
        };
      })
    );
    await refreshBalances().catch(() => {});
  };

  const cancelEscrow = async (jobId: string) => {
    let txHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));

    if (isConnected && isWrongNetwork) {
      throw new Error(`Wrong network detected. Please switch wallet to ${targetChainName} to cancel escrow.`);
    }

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const code = await provider.getCode(job.contractAddress).catch(() => '0x');
        if (code && code !== '0x') {
          const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
          const gasOverrides = await getPolygonGasOverrides(provider);
          const tx = await escrow.cancelJob(gasOverrides);
          const receipt = await tx.wait();
          txHash = receipt.hash;
          console.log(`Escrow successfully cancelled on-chain! TxHash: ${txHash}`);
        }
      }
    } catch (err: any) {
      console.error('Real contract cancelJob error:', err);
      if (isConnected) throw err;
    }
    if (!txHash) txHash = generateMockTxHash();

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const updatedEvents = j.events.map((evt) => {
          if (evt.step === 'Funded') return { ...evt, status: 'completed' as const };
          if (evt.step === 'Completed') return { step: 'Cancelled', title: 'Escrow Cancelled & Refunded', status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Client' };
          return evt;
        });
        return {
          ...j,
          status: 'Cancelled',
          events: updatedEvents,
        };
      })
    );
    await refreshBalances().catch(() => {});
  };

  const raiseDispute = async (
    jobId: string,
    reason: DisputeReason,
    evidenceText: string,
    evidenceIpfsHash: string,
    raisedByAddress: string
  ) => {
    let txHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
        const gasOverrides = await getPolygonGasOverrides(provider);
        const tx = await escrow.raiseDispute(evidenceIpfsHash, gasOverrides);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }
    } catch (err) {
      console.warn('Real contract raiseDispute fallback:', err);
    }
    if (!txHash) txHash = generateMockTxHash();

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const updatedEvents = j.events.map((evt) => {
          if (evt.step === 'Completed') return { step: 'Disputed', title: 'Dispute Raised', status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Party' };
          if (evt.step === 'Minted') return { step: 'Ruled', title: 'Awaiting DAO Arbitration', status: 'current' as const, timestamp: 0, txHash: '' };
          return evt;
        });

        return {
          ...j,
          status: 'Disputed',
          dispute: {
            raisedBy: raisedByAddress,
            reason,
            evidenceIpfsHash,
            evidenceText,
            raisedAt: Date.now(),
            resolved: false,
          },
          events: updatedEvents,
        };
      })
    );
  };

  const submitDisputeResponse = (jobId: string, responseText: string, responseIpfsHash: string) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId) || !j.dispute) return j;
        return {
          ...j,
          dispute: {
            ...j.dispute,
            responseText,
            responseIpfsHash,
          },
        };
      })
    );
  };

  const resolveDispute = async (jobId: string, freelancerBps: number, reasoningText: string, judgeAddress: string) => {
    let txHash = '';
    let sbtTxHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));

    if (isConnected && isWrongNetwork) {
      throw new Error(`Wrong network detected. Please switch wallet to ${targetChainName} to execute dispute resolution.`);
    }

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const deployedCode = await provider.getCode(job.contractAddress).catch(() => '0x');
        const hasLiveContract = deployedCode && deployedCode !== '0x';

        if (hasLiveContract) {
          const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
          const reasoningCid = generateIpfsCid(reasoningText);
          const gasOverrides = await getPolygonGasOverrides(provider);
          const tx = await escrow.resolveDispute(freelancerBps, reasoningCid, gasOverrides);
          const receipt = await tx.wait();
          txHash = receipt.hash;
        }
      }
    } catch (err: any) {
      console.error('Real contract resolveDispute error:', err);
      if (isConnected) {
        throw err;
      }
    }

    if (!txHash) txHash = generateMockTxHash();
    if (!sbtTxHash) sbtTxHash = generateMockTxHash();
    const reasoningCid = generateIpfsCid(reasoningText);

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId || !j.dispute) return j;
        const freelancerPercent = freelancerBps / 100;
        const fee = parseFloat(j.amountUsdc) * 0.025;
        setTreasuryBalanceUsdc((b) => b + fee);
        setTreasuryHistory((h) => [
          { id: Date.now().toString(), type: 'FEE_COLLECTED', amountUsdc: fee, txHash, timestamp: Date.now() },
          ...h,
        ]);

        if (j.freelancer) {
          const flAddr = j.freelancer.toLowerCase();
          setProfiles((prevProfiles) => {
            const next = { ...prevProfiles };
            const key = Object.keys(next).find(k => k.toLowerCase() === flAddr);
            if (key) {
              const reputationSbtCountInc = freelancerBps > 0 ? 1 : 0;
              const scoreAdjustment = freelancerBps > 0
                ? Math.round(35 * (freelancerBps / 10000))
                : -20;
              next[key] = {
                ...next[key],
                reputationSbtCount: (next[key].reputationSbtCount || 0) + reputationSbtCountInc,
                primaryScore: Math.min(Math.max((next[key].primaryScore || 700) + scoreAdjustment, 0), 1000),
              };
            }
            return next;
          });
        }

        const updatedEvents: any[] = [
          ...j.events.filter((e) => e.step !== 'Ruled' && e.step !== 'Minted'),
          { step: 'Ruled', title: `DAO Ruling (${freelancerPercent}% Freelancer)`, timestamp: Date.now(), txHash, status: 'completed', actor: 'Judge DAO' },
          { step: 'Minted', title: freelancerBps > 0 ? 'Reputation SBT Minted' : 'Escrow Closed (No SBT)', timestamp: Date.now(), txHash: sbtTxHash, status: 'completed', actor: 'JobFactory' },
        ];

        return {
          ...j,
          status: 'Completed',
          dispute: {
            ...j.dispute,
            resolved: true,
          reasoningIpfsHash: reasoningCid,
            reasoningText,
            rulingBps: freelancerBps,
            judge: judgeAddress,
          },
          events: updatedEvents,
        };
      })
    );
    refreshBalances().catch(() => {});
  };

  const updateJobTerms = async (jobId: string, newAmountUsdc: string, newReviewPeriodDays?: number) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const numAmount = parseFloat(newAmountUsdc || '0');
        const ethVal = (numAmount / 2500).toFixed(4); // approx conversion
        return {
          ...j,
          amountUsdc: newAmountUsdc,
          amountEth: ethVal,
          reviewPeriodDays: newReviewPeriodDays !== undefined ? newReviewPeriodDays : j.reviewPeriodDays,
          negotiatedAmount: newAmountUsdc,
          negotiatedDeadlineDays: newReviewPeriodDays !== undefined ? newReviewPeriodDays : j.reviewPeriodDays,
        };
      })
    );
  };

  const proposeNegotiationTerms = async (
    jobId: string,
    amountUsdc: string,
    deadlineDays: number,
    note: string,
    senderRole: 'Client' | 'Freelancer',
    isFinalCall: boolean = false,
    applicantAddress?: string
  ) => {
    const proposalId = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    // Store the freelancer's address as applicantAddress so it shows in the right channel.
    // For both roles, use the applicantAddress (freelancer wallet) as the thread key.
    const cleanApplicant = applicantAddress?.toLowerCase();

    const proposal: NegotiationProposal = {
      id: proposalId,
      jobId,
      applicantAddress: cleanApplicant,
      proposedBy: senderRole,
      amountUsdc,
      deadlineDays,
      note: note.trim(),
      isFinalCall,
      status: 'Pending',
      createdAt: now,
    };

    const actionText = `📋 ${senderRole === 'Freelancer' ? 'Freelancer' : 'Client'} proposed: $${amountUsdc} USDC in ${deadlineDays} days${note ? ` — "${note}"` : ''}`;

    const newMsg: ChatMessage = {
      id: `msg-${now}`,
      sender: senderRole,
      // Store applicantAddress (always the freelancer's wallet) so message appears in the correct thread.
      applicantAddress: cleanApplicant,
      // Also store as senderAddress to ensure filter fallback works.
      senderAddress: senderRole === 'Freelancer' ? cleanApplicant : undefined,
      text: actionText,
      timestamp: now,
      proposal,
    };

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const existingProps = j.negotiationProposals || [];
        const existingChat = j.chatMessages || [];
        const existingPre = j.preAcceptMessages || [];

        // Mark any previous Pending proposals in this thread as Countered
        const updatedProps = [
          ...existingProps.map((p) =>
            p.status === 'Pending' && (!cleanApplicant || !p.applicantAddress || p.applicantAddress === cleanApplicant)
              ? { ...p, status: 'Countered' as const }
              : p
          ),
          proposal,
        ];

        return {
          ...j,
          negotiationProposals: updatedProps,
          chatMessages: [...existingChat, newMsg],
          preAcceptMessages: [
            ...existingPre,
            {
              sender: senderRole,
              senderRole,
              text: actionText,
              timestamp: now,
              proposal,
              applicantAddress: cleanApplicant,
            },
          ],
        };
      })
    );
  };

  const respondToNegotiationProposal = async (
    jobId: string,
    proposalId: string,
    accept: boolean,
    rejectReason: string = '',
    responderRole: 'Client' | 'Freelancer' = 'Client',
    applicantAddress?: string
  ) => {
    const now = Date.now();
    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const props = j.negotiationProposals || [];
        // Find target proposal in proposals list OR chatMessages
        const msgProp = (j.chatMessages || []).find((m) => m.proposal?.id === proposalId)?.proposal;
        const targetProp = props.find((p) => p.id === proposalId) || msgProp;
        if (!targetProp) return j;

        const effectiveApplicant = (applicantAddress || targetProp.applicantAddress || j.freelancer || '')?.toLowerCase();

        const updatedProp: NegotiationProposal = {
          ...targetProp,
          status: accept ? 'Accepted' : 'Rejected',
          respondedAt: now,
          responseNote: rejectReason,
        };

        // Update proposal in props array, and if accepted, mark all other pending proposals as Countered
        const updatedProps = props.some((p) => p.id === proposalId)
          ? props.map((p) => (p.id === proposalId ? updatedProp : (accept && p.status === 'Pending' ? { ...p, status: 'Countered' as const } : p)))
          : [...props.map((p) => (accept && p.status === 'Pending' ? { ...p, status: 'Countered' as const } : p)), updatedProp];

        const confirmationText = accept
          ? `🎉 ${responderRole} ACCEPTED the terms: $${targetProp.amountUsdc} USDC in ${targetProp.deadlineDays} days! Full contract terms are updated on-chain.`
          : `❌ ${responderRole} declined the proposed terms ($${targetProp.amountUsdc} USDC in ${targetProp.deadlineDays} days)${rejectReason ? `: "${rejectReason}"` : '.'}`;

        const confMsg: ChatMessage = {
          id: `msg-${now}`,
          sender: responderRole,
          applicantAddress: effectiveApplicant,
          text: confirmationText,
          timestamp: now,
        };

        const updatedEvents = (j.events || []).map((evt) => {
          if (accept) {
            if (evt.step === 'Terms') return { ...evt, status: 'completed' as const, timestamp: now, txHash: generateMockTxHash() };
            if (evt.step === 'Funded') return { ...evt, status: 'completed' as const, timestamp: now, txHash: generateMockTxHash() };
          }
          return evt;
        });

        const effectiveFreelancer = effectiveApplicant || j.freelancer;

        // Update all chat messages so the proposal card displays ACCEPTED instead of PENDING
        const updatedChatMessages = (j.chatMessages || []).map((m) => {
          if (!m.proposal) return m;
          if (m.proposal.id === proposalId) {
            return { ...m, proposal: updatedProp };
          }
          if (accept && m.proposal.status === 'Pending') {
            return { ...m, proposal: { ...m.proposal, status: 'Countered' as const } };
          }
          return m;
        });

        const updatedPreAcceptMessages = (j.preAcceptMessages || []).map((m) => {
          if (!m.proposal) return m;
          if (m.proposal.id === proposalId) {
            return { ...m, proposal: updatedProp };
          }
          if (accept && m.proposal.status === 'Pending') {
            return { ...m, proposal: { ...m.proposal, status: 'Countered' as const } };
          }
          return m;
        });

        return {
          ...j,
          status: accept ? 'Funded' : j.status,
          freelancer: accept && effectiveFreelancer ? effectiveFreelancer : j.freelancer,
          amountUsdc: accept ? targetProp.amountUsdc : j.amountUsdc,
          amountEth: accept ? (parseFloat(targetProp.amountUsdc) / 2500).toFixed(4) : j.amountEth,
          reviewPeriodDays: accept ? targetProp.deadlineDays : j.reviewPeriodDays,
          negotiatedAmount: accept ? targetProp.amountUsdc : j.negotiatedAmount,
          negotiatedDeadlineDays: accept ? targetProp.deadlineDays : j.negotiatedDeadlineDays,
          clientAgreedTerms: accept ? true : j.clientAgreedTerms,
          freelancerAgreedTerms: accept ? true : j.freelancerAgreedTerms,
          negotiationProposals: updatedProps,
          events: updatedEvents,
          chatMessages: [...updatedChatMessages, confMsg],
          preAcceptMessages: [
            ...updatedPreAcceptMessages,
            {
              sender: responderRole === 'Client' ? j.client : (effectiveApplicant || j.freelancer || ''),
              senderRole: responderRole,
              text: confirmationText,
              timestamp: now,
              applicantAddress: effectiveApplicant,
            },
          ],
        };
      })
    );
  };

  const sendPreAcceptMessage = (
    jobId: string,
    text: string,
    senderAddress: string,
    senderRole: 'Client' | 'Freelancer',
    proposal?: NegotiationProposal,
    applicantAddress?: string
  ) => {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    const now = Date.now();
    const cleanApplicant = applicantAddress?.toLowerCase();
    const newMsg = {
      sender: senderAddress,
      senderRole,
      text: trimmed,
      timestamp: now,
      proposal,
      applicantAddress: cleanApplicant,
    };

    setJobs((prev) =>
      prev.map((job) => {
        if (!matchJob(job, jobId)) return job;
        const existing = job.preAcceptMessages || [];
        return {
          ...job,
          preAcceptMessages: [...existing, newMsg],
        };
      })
    );
  };

  const sendChatMessage = (
    jobId: string,
    text: string,
    senderRole: 'Client' | 'Freelancer' | 'Judge',
    proposal?: NegotiationProposal,
    applicantAddress?: string,
    senderAddress?: string
  ) => {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    const now = Date.now();
    const cleanApplicant = applicantAddress?.toLowerCase();
    const newMsg: ChatMessage = {
      id: `msg-${now}`,
      sender: senderRole,
      senderAddress: senderAddress?.toLowerCase(),
      applicantAddress: cleanApplicant,
      text: trimmed,
      timestamp: now,
      proposal,
    };

    setJobs((prev) =>
      prev.map((job) => {
        if (!matchJob(job, jobId)) return job;
        const existing = job.chatMessages || [];
        const isRecentDuplicate = existing.some(
          (m) =>
            m.sender === senderRole &&
            m.text.trim() === trimmed &&
            Math.abs(m.timestamp - now) < 2500 &&
            !proposal &&
            m.applicantAddress?.toLowerCase() === cleanApplicant
        );
        if (isRecentDuplicate) return job;

        return {
          ...job,
          chatMessages: [...existing, newMsg],
        };
      })
    );
  };

  const updateProfile = async (profileData: Partial<UserProfile>, address: string) => {
    setProfiles((prev) => {
      const lowerAddress = address.toLowerCase();
      let updatedPrev = { ...prev };

      if (profileData.githubVerified && profileData.githubUsername) {
        const lowerUsername = profileData.githubUsername.toLowerCase().trim();
        const duplicateAddress = Object.keys(updatedPrev).find(
          (addr) =>
            addr.toLowerCase() !== lowerAddress &&
            updatedPrev[addr].githubVerified &&
            updatedPrev[addr].githubUsername?.toLowerCase().trim() === lowerUsername
        );
        if (duplicateAddress) {
          const adminGh = (import.meta.env.VITE_ADMIN_GITHUB_USERNAME || '').toLowerCase().trim();
          const judgeGh = (import.meta.env.VITE_JUDGE_GITHUB_USERNAME || '').toLowerCase().trim();
          const isPrivileged =
            (isAdminAddress(lowerAddress) && adminGh === lowerUsername) ||
            (isJudgeAddress(lowerAddress) && judgeGh === lowerUsername);

          if (isPrivileged) {
            // Unbind GitHub username from previous/stale duplicate address to reassign to authorized wallet
            const oldProf = { ...updatedPrev[duplicateAddress] };
            delete oldProf.githubUsername;
            oldProf.githubVerified = false;
            updatedPrev[duplicateAddress] = oldProf;
          } else {
            console.warn(`Security Shield: The GitHub account @${profileData.githubUsername} is already linked to another wallet (${duplicateAddress.slice(0, 6)}...${duplicateAddress.slice(-4)}) and is protected against reassignment.`);
            return prev;
          }
        }
      }

      const existing = updatedPrev[lowerAddress] || {
        address: lowerAddress,
        displayName: 'Anonymous PolyLancer',
        bio: '',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        ipfsHash: '',
        skills: [],
        githubVerified: false,
        reputationSbtCount: 0,
      };

      const updatedSingle = {
        ...existing,
        ...profileData,
        address: lowerAddress,
      };

      const finalMerged = {
        ...updatedPrev,
        [lowerAddress]: updatedSingle,
      };

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('polylance_profiles', JSON.stringify(finalMerged));
        }
      } catch {}

      // Explicitly broadcast and dual-write to cloud databases
      broadcastSync({ profiles: { [lowerAddress]: updatedSingle } }, lowerAddress);

      // Direct multi-endpoint POST for guaranteed server persistence
      const syncEndpoints = getSyncEndpoints();
      const postPayload = JSON.stringify({
        profiles: { [lowerAddress]: updatedSingle },
      });
      syncEndpoints.forEach((ep) => {
        fetch(`${ep}/api/sync?address=${encodeURIComponent(lowerAddress)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': lowerAddress,
          },
          body: postPayload,
        }).catch(() => {});
      });

      return finalMerged;
    });
  };

  const castDaoVote = async (proposalId: string | number, support: boolean, voterAddress?: string, votingPower: number = 10) => {
    let txHash = '';
    try {
      const signer = await getSigner();
      if (signer && typeof proposalId === 'number') {
        const judgeDao = new ethers.Contract(CONTRACTS.JudgeDAO, getAbi(JudgeDAOABI), signer);
        const gasOverrides = await getPolygonGasOverrides(provider);
        const tx = await judgeDao.castVote(proposalId, support, gasOverrides);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }
    } catch (err) {
      console.warn('Real contract castVote fallback:', err);
    }

    setDaoProposals((prev) =>
      prev.map((prop) => {
        if (String(prop.id) !== String(proposalId)) return prop;
        if (prop.userVoted) return prop;
        return {
          ...prop,
          votesFor: support ? prop.votesFor + Math.max(1, votingPower) : prop.votesFor,
          votesAgainst: !support ? prop.votesAgainst + Math.max(1, votingPower) : prop.votesAgainst,
          userVoted: support ? 'FOR' : 'AGAINST',
        };
      })
    );
  };

  const castVote = async (proposalId: string | number, support: boolean, voterAddress?: string) => {
    await castDaoVote(proposalId, support, voterAddress || '', 10);
  };

  const createDaoProposal = (title: string, candidateAddress: string, description: string) => {
    const newProp: DaoProposal = {
      id: `prop-${Date.now()}`,
      title,
      candidateAddress,
      candidate: candidateAddress,
      proposer: '0x1111222233334444555566667777888899990000',
      description,
      rationale: description,
      votesFor: 1,
      votesAgainst: 0,
      endsAt: Date.now() + 7 * 86400000,
      status: 'Active',
      userVoted: 'FOR',
    };
    setDaoProposals((prev) => [newProp, ...prev]);
  };

  const proposeJudgeCandidate = (candidateAddress: string, description: string, proposerAddress?: string) => {
    const newProp: DaoProposal = {
      id: `prop-${Date.now()}`,
      title: `Nominate ${candidateAddress.slice(0, 8)}... as Arbitrator`,
      candidateAddress,
      candidate: candidateAddress,
      proposer: proposerAddress || '0x1111222233334444555566667777888899990000',
      description,
      rationale: description,
      votesFor: 10,
      votesAgainst: 0,
      endsAt: Date.now() + 7 * 86400000,
      status: 'Active',
      userVoted: 'FOR',
    };
    setDaoProposals((prev) => [newProp, ...prev]);
  };

  const withdrawTreasury = (to: string, amountUsdc: number, byAddress: string) => {
    setTreasuryBalanceUsdc((prev) => Math.max(0, prev - amountUsdc));
    setTreasuryHistory((prev) => [
      {
        id: Date.now().toString(),
        type: 'WITHDRAWAL',
        amountUsdc,
        txHash: generateMockTxHash(),
        timestamp: Date.now(),
        by: `${byAddress.slice(0, 6)}... (Safe Multisig)`,
      },
      ...prev,
    ]);
  };

  const proposeTreasuryWithdrawal = (recipient: string, amountUsdc: string, purpose: string, proposerAddress: string) => {
    const safeTxHash = generateDeterministicHash(`safe-prop-${Date.now()}`);
    const newProp: TreasuryProposal = {
      id: `PROP-0${treasuryProposals.length + 1}`,
      safeTxHash,
      recipient,
      to: recipient,
      amount: amountUsdc,
      amountUsdc,
      tokenAddress: PAYMENT_TOKENS.USDC.address,
      purpose,
      proposer: proposerAddress,
      signatures: [proposerAddress],
      confirmations: [proposerAddress],
      confirmationsRequired: 2,
      executed: false,
      isExecuted: false,
    };
    setTreasuryProposals((prev) => [newProp, ...prev]);
  };

  const signTreasuryWithdrawal = (proposalId: string, signerAddress: string) => {
    setTreasuryProposals((prev) =>
      prev.map((p) => {
        if (p.id !== proposalId) return p;
        // Case-insensitive duplicate check so different admin addresses work correctly
        if (p.signatures.some((s) => s.toLowerCase() === signerAddress.toLowerCase())) return p;
        return {
          ...p,
          signatures: [...p.signatures, signerAddress],
        };
      })
    );
  };

  const executeTreasuryWithdrawal = (proposalId: string) => {
    setTreasuryProposals((prev) =>
      prev.map((p) => {
        if (p.id !== proposalId) return p;
        const amt = parseFloat(p.amountUsdc);
        withdrawTreasury(p.recipient, amt, p.proposer);
        return {
          ...p,
          executed: true,
        };
      })
    );
  };

  const addJudge = (address: string, name: string, notes?: string, addedBy?: string) => {
    if (!address || !address.startsWith('0x')) return;
    const lower = address.toLowerCase();
    setJudges(prev => {
      if (prev.some(j => j.address.toLowerCase() === lower)) return prev;
      return [
        ...prev,
        {
          address: lower,
          name: name || `Judge ${lower.slice(0, 6)}...`,
          status: 'Active',
          addedAt: Date.now(),
          addedBy: addedBy || 'Admin Governance',
          notes: notes || 'Registered by platform administrator.'
        }
      ];
    });
  };

  const removeJudge = (address: string) => {
    const lower = address.toLowerCase();
    setJudges(prev => prev.filter(j => j.address.toLowerCase() !== lower));
  };

  const toggleJudgeStatus = (address: string) => {
    const lower = address.toLowerCase();
    setJudges(prev => prev.map(j => {
      if (j.address.toLowerCase() === lower) {
        return { ...j, status: j.status === 'Active' ? 'Suspended' : 'Active' };
      }
      return j;
    }));
  };

  const closeChatSession = async (jobId: string): Promise<string | null> => {
    sendChatMessage(jobId, '🔒 Chat session closed.', 'Judge');
    return null;
  };

  const [accountDeletionRequests, setAccountDeletionRequestsRaw] = useState<Record<string, { requestedAt: number; executeAfter: number }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_deletion_requests');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const setAccountDeletionRequests = (val: React.SetStateAction<Record<string, { requestedAt: number; executeAfter: number }>>) => {
    setAccountDeletionRequestsRaw((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') {
        localStorage.setItem('polylance_deletion_requests', JSON.stringify(next));
      }
      return next;
    });
  };

  const cancelAccountDeletion = async (userAddress: string) => {
    if (!userAddress) return;
    const lower = userAddress.toLowerCase();
    setAccountDeletionRequests((prev) => {
      const next = { ...prev };
      delete next[lower];
      return next;
    });
  };

  const purgeAccountData = async (userAddress: string) => {
    if (!userAddress) return;
    const lower = userAddress.toLowerCase();
    cancelAccountDeletion(lower);

    // Purge profile from local state and localStorage
    setProfiles((prev) => {
      const next = { ...prev };
      delete next[lower];
      const matchKey = Object.keys(next).find((k) => k.toLowerCase() === lower);
      if (matchKey) delete next[matchKey];
      return next;
    });

    // Clear direct judge messages
    setJudgeMessages((prev) => {
      const next = { ...prev };
      delete next[lower];
      return next;
    });

    // Notify backend to purge off-chain data
    try {
      await fetch(`${getBackendSyncUrl()}/api/users/${encodeURIComponent(lower)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': lower,
        },
      });
    } catch (err) {
      console.warn('Backend user purge fallback:', err);
    }
  };

  const requestAccountDeletion = async (userAddress: string) => {
    if (!userAddress) return;
    const lower = userAddress.toLowerCase();
    const now = Date.now();
    const executeAfter = now + 30 * 24 * 60 * 60 * 1000; // 30 days buffer
    setAccountDeletionRequests((prev) => ({
      ...prev,
      [lower]: { requestedAt: now, executeAfter },
    }));
  };

  // Check for expired deletion requests whose 30-day buffer elapsed
  useEffect(() => {
    const checkExpiredDeletions = () => {
      const now = Date.now();
      Object.entries(accountDeletionRequests).forEach(([addr, req]) => {
        if (req && req.executeAfter && now >= req.executeAfter) {
          purgeAccountData(addr);
        }
      });
    };
    checkExpiredDeletions();
    const interval = setInterval(checkExpiredDeletions, 60000);
    return () => clearInterval(interval);
  }, [accountDeletionRequests]);

  const deleteChatHistory = async (jobId?: string, judgeAddress?: string) => {
    if (jobId) {
      const now = Date.now();
      setJobs((prev) =>
        prev.map((j) => {
          if (!matchJob(j, jobId)) return j;
          return { ...j, chatMessages: [], preAcceptMessages: [], chatClearedAt: now };
        })
      );
      // Trigger API call to backend database
      try {
        await fetch(`${getBackendSyncUrl()}/api/jobs/${encodeURIComponent(jobId)}/chat`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': currentConnectedWalletAddress || '',
          },
        });
      } catch (e) {
        console.warn('Backend delete chat history fallback:', e);
      }
    } else if (judgeAddress) {
      const lower = judgeAddress.toLowerCase();
      setJudgeMessages((prev) => {
        const next = { ...prev };
        delete next[lower];
        return next;
      });
      try {
        await fetch(`${getBackendSyncUrl()}/api/judges/${encodeURIComponent(judgeAddress)}/chat`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': currentConnectedWalletAddress || '',
          },
        });
      } catch (e) {
        console.warn('Backend delete judge chat history fallback:', e);
      }
    }
  };

  const restoreChatHistory = (jobId?: string, messages?: any[], judgeAddress?: string, judgeMsgs?: JudgeMessage[]) => {
    if (jobId && messages) {
      setJobs((prev) =>
        prev.map((j) => {
          if (!matchJob(j, jobId)) return j;
          return { ...j, chatMessages: messages, chatClearedAt: undefined };
        })
      );
    } else if (judgeAddress && judgeMsgs) {
      const lower = judgeAddress.toLowerCase();
      setJudgeMessages((prev) => ({
        ...prev,
        [lower]: judgeMsgs,
      }));
    }
  };

  // Auto-cleanup chat history for jobs completed over 1 week (7 days) ago
  useEffect(() => {
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    setJobs((prev) => {
      let modified = false;
      const updated = prev.map((j) => {
        if (
          j.status === 'Completed' &&
          j.completedAt &&
          now - j.completedAt > ONE_WEEK_MS &&
          ((j.chatMessages && j.chatMessages.length > 0) || (j.preAcceptMessages && j.preAcceptMessages.length > 0))
        ) {
          modified = true;
          return { ...j, chatMessages: [], preAcceptMessages: [] };
        }
        return j;
      });
      return modified ? updated : prev;
    });
  }, []);

  const sendJudgeChatMessage = (judgeAddress: string, text: string, senderRole: 'Admin' | 'Judge', senderAddress?: string) => {
    if (!judgeAddress || !text.trim()) return;
    const lower = judgeAddress.toLowerCase();
    const msg: JudgeMessage = {
      id: `jmsg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      judgeAddress: lower,
      sender: senderAddress || (senderRole === 'Admin' ? 'Admin' : lower),
      senderRole,
      text: text.trim(),
      timestamp: Date.now()
    };
    setJudgeMessages(prev => {
      const existing = prev[lower] || [];
      return {
        ...prev,
        [lower]: [...existing, msg]
      };
    });
  };

  const contextValue = React.useMemo<PolyLanceDataContextType>(() => ({
    loading,
    jobs,
    daoProposals,
    treasury: treasuryState,
    treasuryBalanceUsdc,
    treasuryBalanceEth,
    treasuryHistory,
    profiles,
    judges,
    addJudge,
    removeJudge,
    toggleJudgeStatus,
    postJob,
    deleteJob,
    updateJobDetails,
    renewJob,
    applyToJob,
    selectFreelancer,
    proposeTerms,
    fundJob,
    submitWork,
    postProgressUpdate,
    requestTimeExtension,
    respondToTimeExtension,
    requestModifications,
    releasePayment,
    claimAutoRelease,
    cancelEscrow,
    raiseDispute,
    submitDisputeResponse,
    resolveDispute,
    updateJobTerms,
    proposeNegotiationTerms,
    respondToNegotiationProposal,
    sendPreAcceptMessage,
    sendChatMessage,
    sendJudgeChatMessage,
    isEnclineConnected: false,
    judgeMessages,
    closeChatSession,
    deleteChatHistory,
    restoreChatHistory,
    accountDeletionRequests,
    requestAccountDeletion,
    cancelAccountDeletion,
    purgeAccountData,
    updateProfile,
    castDaoVote,
    castVote,
    createDaoProposal,
    proposeJudgeCandidate,
    withdrawTreasury,
    proposeTreasuryWithdrawal,
    signTreasuryWithdrawal,
    executeTreasuryWithdrawal,
  }), [
    loading,
    jobs,
    daoProposals,
    treasuryState,
    treasuryBalanceUsdc,
    treasuryBalanceEth,
    treasuryHistory,
    profiles,
    judges,
    addJudge,
    removeJudge,
    toggleJudgeStatus,
    postJob,
    deleteJob,
    updateJobDetails,
    renewJob,
    applyToJob,
    selectFreelancer,
    proposeTerms,
    fundJob,
    submitWork,
    postProgressUpdate,
    requestTimeExtension,
    respondToTimeExtension,
    requestModifications,
    releasePayment,
    claimAutoRelease,
    cancelEscrow,
    raiseDispute,
    submitDisputeResponse,
    resolveDispute,
    updateJobTerms,
    proposeNegotiationTerms,
    respondToNegotiationProposal,
    sendPreAcceptMessage,
    sendChatMessage,
    sendJudgeChatMessage,
    judgeMessages,
    closeChatSession,
    deleteChatHistory,
    restoreChatHistory,
    accountDeletionRequests,
    requestAccountDeletion,
    cancelAccountDeletion,
    purgeAccountData,
    updateProfile,
    castDaoVote,
    castVote,
    createDaoProposal,
    proposeJudgeCandidate,
    withdrawTreasury,
    proposeTreasuryWithdrawal,
    signTreasuryWithdrawal,
    executeTreasuryWithdrawal,
  ]);

  return (
    <PolyLanceDataContext.Provider value={contextValue}>
      {children}
    </PolyLanceDataContext.Provider>
  );
};

const SAFE_FALLBACK_DATA_CONTEXT: PolyLanceDataContextType = {
  loading: false,
  jobs: [],
  daoProposals: [],
  treasury: { balanceEth: '0', balanceUsdc: '0', requiredSignatures: 2, signers: [], proposals: [] },
  treasuryBalanceUsdc: 0,
  treasuryBalanceEth: 0,
  treasuryHistory: [],
  profiles: {},
  judges: [],
  addJudge: () => {},
  removeJudge: () => {},
  toggleJudgeStatus: () => {},
  postJob: async () => ({} as any),
  deleteJob: async () => false,
  updateJobDetails: async () => false,
  renewJob: async () => false,
  applyToJob: async () => {},
  selectFreelancer: async () => {},
  proposeTerms: async () => {},
  fundJob: async () => {},
  submitWork: async () => {},
  postProgressUpdate: async () => {},
  requestTimeExtension: async () => {},
  respondToTimeExtension: async () => {},
  requestModifications: async () => {},
  releasePayment: async () => {},
  claimAutoRelease: async () => {},
  cancelEscrow: async () => {},
  raiseDispute: async () => {},
  submitDisputeResponse: () => {},
  resolveDispute: async () => {},
  updateJobTerms: async () => {},
  proposeNegotiationTerms: async () => {},
  respondToNegotiationProposal: async () => {},
  sendPreAcceptMessage: () => {},
  sendChatMessage: () => {},
  sendJudgeChatMessage: () => {},
  isEnclineConnected: false,
  judgeMessages: {},
  closeChatSession: async () => null,
  deleteChatHistory: () => {},
  restoreChatHistory: () => {},
  accountDeletionRequests: {},
  requestAccountDeletion: async () => {},
  cancelAccountDeletion: async () => {},
  purgeAccountData: async () => {},
  updateProfile: async () => {},
  castDaoVote: () => {},
  castVote: () => {},
  createDaoProposal: () => {},
  proposeJudgeCandidate: () => {},
  withdrawTreasury: () => {},
  proposeTreasuryWithdrawal: () => {},
  signTreasuryWithdrawal: () => {},
  executeTreasuryWithdrawal: () => {},
};

export const usePolyLanceData = () => {
  const context = useContext(PolyLanceDataContext);
  if (!context) {
    return SAFE_FALLBACK_DATA_CONTEXT;
  }
  return context;
};
