import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Job, UserProfile, DaoProposal, JobStatus, DisputeReason, Application, ProofOfWork, TreasuryProposal, TreasuryState, JudgeRecord, JudgeMessage } from '../types';
import { generateMockTxHash, generateDeterministicHash } from '../utils/formatters';
import { generateIpfsCid } from '../utils/ipfs';
import { fetchLiveExchangeRates } from '../utils/currency';
import { CONTRACTS } from '../config/contracts';
import { PAYMENT_TOKENS, getTokenBySymbol, getTokenByAddress } from '../config/paymentTokens';
import JobFactoryABI from '../config/abis/JobFactory.json';
import JobEscrowABI from '../config/abis/JobEscrow.json';
import ProfileRegistryABI from '../config/abis/ProfileRegistry.json';
import JudgeDAOABI from '../config/abis/JudgeDAO.json';
import { useWeb3 } from './Web3Context';
import { io as socketIO, Socket } from 'socket.io-client';

const BACKEND_SYNC_URL = import.meta.env.VITE_CHAT_SERVER_URL || 'http://localhost:3001';
let syncSocket: Socket | null = null;

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
  postJob: (jobData: { title: string; description: string; category: any; amountUsdc: string; paymentTokenSymbol?: 'USDC' | 'MATIC'; reviewPeriodDays: number }, clientAddress: string) => Promise<Job>;
  applyToJob: (jobId: string, proposalText: string, applicantAddress: string, skills: string[], githubVerified: boolean, githubScore: number) => Promise<void>;
  selectFreelancer: (jobId: string, freelancerAddress: string) => Promise<void>;
  proposeTerms: (jobId: string, userAddress: string) => Promise<void>;
  fundJob: (jobId: string) => Promise<void>;
  submitWork: (jobId: string, title: string, description: string, evidenceHashes: string[], externalLink?: string) => Promise<void>;
  postProgressUpdate: (jobId: string, progressPercent: number, statusNote: string, demoUrl?: string) => Promise<void>;
  requestTimeExtension: (jobId: string, requestedDays: number, reason: string) => Promise<void>;
  respondToTimeExtension: (jobId: string, requestId: string, approve: boolean, responseNote?: string) => Promise<void>;
  requestModifications: (jobId: string, note: string) => Promise<void>;
  releasePayment: (jobId: string) => Promise<void>;
  claimAutoRelease: (jobId: string) => Promise<void>;
  raiseDispute: (jobId: string, reason: DisputeReason, evidenceText: string, evidenceIpfsHash: string, raisedByAddress: string) => Promise<void>;
  submitDisputeResponse: (jobId: string, responseText: string, responseIpfsHash: string) => void;
  resolveDispute: (jobId: string, freelancerBps: number, reasoningText: string, judgeAddress: string) => Promise<void>;
  sendChatMessage: (jobId: string, text: string, senderRole: 'Client' | 'Freelancer' | 'Judge') => void;
  sendJudgeChatMessage: (judgeAddress: string, text: string, senderRole: 'Admin' | 'Judge', senderAddress?: string) => void;
  isEnclineConnected: boolean;
  judgeMessages: Record<string, JudgeMessage[]>;
  closeChatSession: (jobId: string) => Promise<string | null>;
  deleteChatHistory: (jobId?: string, judgeAddress?: string) => void;
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
]);

const MOCK_NAMES_TO_PURGE = new Set([
  'alex rivera',
  'elena rostova',
  'marcus sterling',
  'nadia chen',
  'devpioneer'
]);

const normalizeProfiles = (rawProfiles: Record<string, UserProfile>): Record<string, UserProfile> => {
  const normalized: Record<string, UserProfile> = {};
  const judgeAddr = (import.meta.env.VITE_JUDGE_ADDRESS || '').toLowerCase();
  const judgeGithub = import.meta.env.VITE_JUDGE_GITHUB_USERNAME || 'sunny200551';

  for (const [addr, profile] of Object.entries(rawProfiles || {})) {
    if (!addr) continue;
    const lowerAddr = addr.toLowerCase();

    // Strip legacy mock records
    if (MOCK_ADDRESSES_TO_PURGE.has(lowerAddr)) continue;
    if (profile.displayName && MOCK_NAMES_TO_PURGE.has(profile.displayName.toLowerCase().trim())) continue;

    // Copy profile data, but if this is NOT the judge address and it has the judge's GitHub username, unbind it
    let cleanedProfile = { ...profile };
    if (judgeAddr && lowerAddr !== judgeAddr && cleanedProfile.githubUsername?.toLowerCase() === judgeGithub.toLowerCase()) {
      delete cleanedProfile.githubUsername;
      cleanedProfile.githubVerified = false;
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

  // If judge address is configured in .env and not yet in profiles, initialize editable profile
  if (judgeAddr && !normalized[judgeAddr]) {
    normalized[judgeAddr] = {
      address: judgeAddr,
      displayName: judgeGithub || 'Lead Developer',
      bio: 'Full-Stack Web3 & Software Engineer.',
      avatarUrl: judgeGithub ? `https://github.com/${judgeGithub}.png` : `https://api.dicebear.com/7.x/identicon/svg?seed=${judgeAddr}`,
      ipfsHash: '',
      skills: ['TypeScript', 'React', 'Smart Contracts', 'Node.js', 'Solidity'],
      githubUsername: judgeGithub,
      githubVerified: true,
      primaryScore: 850,
      reputationSbtCount: 0,
    };
  } else if (judgeAddr && normalized[judgeAddr] && judgeGithub) {
    if (!normalized[judgeAddr].githubUsername || !normalized[judgeAddr].githubVerified) {
      normalized[judgeAddr].githubUsername = judgeGithub;
      normalized[judgeAddr].githubVerified = true;
    }
    if (!normalized[judgeAddr].avatarUrl || normalized[judgeAddr].avatarUrl.includes('unsplash.com')) {
      normalized[judgeAddr].avatarUrl = `https://github.com/${judgeGithub}.png`;
    }
  }

  return normalized;
};

const BROADCAST_CHANNEL_NAME = 'polylance_realtime_sync_channel';

const broadcastSync = (data: {
  jobs?: Job[];
  profiles?: Record<string, UserProfile>;
  daoProposals?: DaoProposal[];
  judgeMessages?: Record<string, JudgeMessage[]>;
  judges?: JudgeRecord[];
  treasuryProposals?: TreasuryProposal[];
  treasuryHistory?: any[];
  treasuryBalanceUsdc?: number;
  treasuryBalanceEth?: number;
}) => {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: 'SYNC_UPDATE', payload: data, sender: Date.now() });
      channel.close();
    }
  } catch (err) {
    // Fallback gracefully
  }

  // Cross-Device and Multi-Browser Real-Time Sync via Backend Microservice
  try {
    if (syncSocket && syncSocket.connected) {
      syncSocket.emit('client-sync', data);
    } else {
      fetch(`${BACKEND_SYNC_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
  } catch (err) {}
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

const mergeJobsList = (existing: Job[], incoming: Job[]): Job[] => {
  const map = new Map<string, Job>();
  (existing || []).forEach((j) => {
    const norm = normalizeJob(j);
    const key = (norm.contractAddress || norm.id).toLowerCase();
    map.set(key, norm);
  });

  (incoming || []).forEach((inJobRaw) => {
    const inJob = normalizeJob(inJobRaw);
    const key = (inJob.contractAddress || inJob.id).toLowerCase();
    const curr = map.get(key);
    if (!curr) {
      map.set(key, inJob);
    } else {
      // Merge applications
      const appMap = new Map<string, Application>();
      (curr.applications || []).forEach((a) => appMap.set(a.applicant.toLowerCase(), a));
      (inJob.applications || []).forEach((a) => appMap.set(a.applicant.toLowerCase(), a));

      // Merge chat messages with smart deduplication (same sender + text within 3.5 seconds)
      const mergedMsgs: any[] = [];
      const allMsgs = [...(curr.chatMessages || []), ...(inJob.chatMessages || [])].sort(
        (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
      );
      for (const m of allMsgs) {
        if (!m || !m.text) continue;
        const isDuplicate = mergedMsgs.some(
          (existing) =>
            existing.sender === m.sender &&
            existing.text.trim() === m.text.trim() &&
            Math.abs((existing.timestamp || 0) - (m.timestamp || 0)) < 3500
        );
        if (!isDuplicate) {
          mergedMsgs.push(m);
        }
      }

      // Merge extension requests safely
      const extMap = new Map<string, any>();
      (curr.extensionRequests || []).forEach((r) => r && extMap.set(r.id || `${r.requestIndex}`, r));
      (inJob.extensionRequests || []).forEach((r) => r && extMap.set(r.id || `${r.requestIndex}`, r));

      // Merge progress updates safely
      const progMap = new Map<string, any>();
      (curr.progressUpdates || []).forEach((p) => p && progMap.set(p.id || `${p.timestamp}`, p));
      (inJob.progressUpdates || []).forEach((p) => p && progMap.set(p.id || `${p.timestamp}`, p));

      // Merge modification requests safely
      const modMap = new Map<string, any>();
      (curr.modificationRequests || []).forEach((m) => m && modMap.set(m.id || `${m.requestedAt}`, m));
      (inJob.modificationRequests || []).forEach((m) => m && modMap.set(m.id || `${m.requestedAt}`, m));

      const mergedJob: Job = {
        ...curr,
        ...inJob,
        status: inJob.status || curr.status,
        freelancer: inJob.freelancer || curr.freelancer,
        clientAgreedTerms: inJob.clientAgreedTerms !== undefined ? inJob.clientAgreedTerms : curr.clientAgreedTerms,
        freelancerAgreedTerms: inJob.freelancerAgreedTerms !== undefined ? inJob.freelancerAgreedTerms : curr.freelancerAgreedTerms,
        termsHash: inJob.termsHash || curr.termsHash,
        amountUsdc: inJob.amountUsdc || curr.amountUsdc,
        amountEth: inJob.amountEth || curr.amountEth,
        paymentTokenSymbol: inJob.paymentTokenSymbol || curr.paymentTokenSymbol,
        applications: Array.from(appMap.values()),
        chatMessages: mergedMsgs,
        events: inJob.events?.length ? inJob.events : curr.events,
        dispute: inJob.dispute || curr.dispute,
        proof: inJob.proof || curr.proof,
        progressUpdates: Array.from(progMap.values()),
        extensionRequests: Array.from(extMap.values()),
        modificationRequests: Array.from(modMap.values()),
      };

      map.set(key, normalizeJob(mergedJob));
    }
  });

  return Array.from(map.values());
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
        primaryScore: inProf.primaryScore || curr.primaryScore,
        reputationSbtCount: inProf.reputationSbtCount ?? curr.reputationSbtCount,
      };
    }
  }
  return normalizeProfiles(merged);
};

export const PolyLanceDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { provider, getSigner } = useWeb3();



  const [jobs, setJobsRaw] = useState<Job[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_jobs');
      if (saved) {
        const parsed: Job[] = JSON.parse(saved);
        return parsed.filter(j => j.id !== 'job-101' && j.id !== 'job-102');
      }
    }
    return INITIAL_JOBS;
  });
  const setJobs = (val: React.SetStateAction<Job[]>) => {
    setJobsRaw((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
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
      broadcastSync({ profiles: next });
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

    // Real-Time Cross-Device WebSocket Sync Setup
    try {
      if (!syncSocket) {
        syncSocket = socketIO(BACKEND_SYNC_URL, {
          transports: ['websocket', 'polling'],
          withCredentials: true,
          reconnection: true,
        });

        syncSocket.on('realtime-sync', (payload: any) => {
          if (!payload) return;
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

    // Initial load from backend shared state + upload local items if new
    fetch(`${BACKEND_SYNC_URL}/api/sync`)
      .then((r) => r.json())
      .then((payload) => {
        let currentLocalJobs: Job[] = [];
        try {
          const saved = localStorage.getItem('polylance_jobs');
          if (saved) currentLocalJobs = JSON.parse(saved);
        } catch {}

        if (payload) {
          if (Array.isArray(payload.jobs) && payload.jobs.length > 0) {
            setJobsRaw((curr) => {
              const merged = mergeJobsList(curr, payload.jobs);
              try { localStorage.setItem('polylance_jobs', JSON.stringify(merged)); } catch {}
              return [...merged];
            });
            // If local had additional jobs, merge back to backend
            if (currentLocalJobs.length > 0) {
              broadcastSync({ jobs: currentLocalJobs });
            }
          } else if (currentLocalJobs.length > 0) {
            // Seed backend with existing local jobs
            broadcastSync({ jobs: currentLocalJobs });
          }

          if (payload.profiles && Object.keys(payload.profiles).length > 0) {
            setProfilesRaw((curr) => {
              const merged = mergeProfilesMap(curr, payload.profiles);
              try { localStorage.setItem('polylance_profiles', JSON.stringify(merged)); } catch {}
              return { ...merged };
            });
          }
        }
      })
      .catch(() => {});

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

    // Second-to-second 100% real-time data sync heartbeat from microservice
    const syncFromRemoteBackend = () => {
      fetch(`${BACKEND_SYNC_URL}/api/sync`)
        .then((r) => r.json())
        .then((payload) => {
          if (!payload) return;
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
        })
        .catch(() => {});
    };

    const pollInterval = setInterval(() => {
      syncFromStorage();
      syncFromRemoteBackend();
    }, 1200);

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
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
      window.removeEventListener('focus', syncFromStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const [loading, setLoading] = useState(false);

  const getAbi = (imported: any) => (Array.isArray(imported) ? imported : imported.abi ?? imported);

  // 1. Sync on-chain jobs
  const syncOnChainJobs = useCallback(async () => {
    if (!provider) return;
    try {
      const factory = new ethers.Contract(CONTRACTS.JobFactory, getAbi(JobFactoryABI), provider);
      if (!factory.filters || typeof factory.filters.JobPosted !== 'function') return;
      const filter = factory.filters.JobPosted();
      const logs = await factory.queryFilter(filter);

      const parsedJobs: Job[] = await Promise.all(
        logs.map(async (log: any) => {
          const jobAddr = log.args[0] || log.args.jobAddress;
          const client = log.args[1] || log.args.client;
          const paymentToken = log.args[3] || log.args.paymentToken || ethers.ZeroAddress;

          const escrow = new ethers.Contract(jobAddr, getAbi(JobEscrowABI), provider);
          const [statusRaw, freelancer, amountRaw, reviewPeriod, submittedAt, termsHash] = await Promise.all([
            escrow.status().catch(() => 0n),
            escrow.freelancer().catch(() => ethers.ZeroAddress),
            escrow.amount().catch(() => 0n),
            escrow.reviewPeriod().catch(() => 7n * 86400n),
            escrow.submittedAt().catch(() => 0n),
            escrow.termsHash().catch(() => ''),
          ]);

          const statusMap: JobStatus[] = ['Open', 'Selected', 'Submitted', 'Disputed', 'Completed', 'Cancelled'];
          const status = statusMap[Number(statusRaw)] || 'Open';

          const tokenConfig = getTokenByAddress(paymentToken);
          const formattedAmount = ethers.formatUnits(amountRaw, tokenConfig.decimals);

          return {
            id: jobAddr.slice(0, 14),
            contractAddress: jobAddr,
            client,
            freelancer: freelancer === ethers.ZeroAddress ? undefined : freelancer,
            amountEth: tokenConfig.symbol === 'MATIC' ? formattedAmount : (parseFloat(formattedAmount) / 2800).toFixed(4),
            amountUsdc: formattedAmount,
            paymentToken,
            paymentTokenSymbol: tokenConfig.symbol,
            paymentTokenDecimals: tokenConfig.decimals,
            status,
            title: `Job ${jobAddr.slice(0, 6)}...${jobAddr.slice(-4)}`,
            description: `On-chain JobEscrow clone deployed at ${jobAddr}`,
            category: 'web3',
            reviewPeriodDays: Math.round(Number(reviewPeriod) / 86400) || 7,
            createdAt: Date.now() - 3600000,
            submittedAt: Number(submittedAt) > 0 ? Number(submittedAt) * 1000 : undefined,
            termsHash: termsHash || undefined,
            applications: [],
            events: [
              { step: 'Posted', title: `Job Posted (${tokenConfig.symbol} Escrow)`, timestamp: Date.now() - 3600000, txHash: log.transactionHash, status: 'completed', actor: 'Client' },
              { step: 'Funded', title: 'Fund Escrow', timestamp: Number(amountRaw) > 0 ? Date.now() - 1800000 : 0, txHash: '', status: Number(amountRaw) > 0 ? 'completed' : 'pending' },
            ],
          };
        })
      );

      if (parsedJobs.length > 0) {
        setJobs((prev) => mergeJobsList(parsedJobs, prev));
      }
    } catch (err) {
      console.warn('Real-time on-chain job sync warning:', err);
    }
  }, [provider]);

  useEffect(() => {
    syncOnChainJobs();
    const interval = setInterval(syncOnChainJobs, 10000);
    return () => clearInterval(interval);
  }, [syncOnChainJobs]);

  useEffect(() => {
    fetchLiveExchangeRates().catch((err) => console.warn('Failed to load rates on boot:', err));
  }, []);



  const treasuryState: TreasuryState = {
    balanceUsdc: treasuryBalanceUsdc.toString(),
    balanceEth: treasuryBalanceEth.toString(),
    requiredSignatures: 2,
    signers: [
      import.meta.env.VITE_ADMIN_ADDRESS_1 || '0x62cDfc0692cC675c95304BaCE2C834D8F901dCba',
      import.meta.env.VITE_ADMIN_ADDRESS_2 || '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A',
      import.meta.env.VITE_ADMIN_ADDRESS_3 || '0xb30F2eFBCEBC529d946e05C9ccE0f1ffFB7e1aB1',
    ],
    proposals: treasuryProposals,
  };

  const postJob = async (
    jobData: { title: string; description: string; category: any; amountUsdc: string; paymentTokenSymbol?: 'USDC' | 'MATIC'; reviewPeriodDays: number },
    clientAddress: string
  ): Promise<Job> => {
    const tokenSymbol = jobData.paymentTokenSymbol || 'USDC';
    const tokenConfig = getTokenBySymbol(tokenSymbol);
    const descriptionIpfsHash = generateIpfsCid({ title: jobData.title, description: jobData.description });
    let contractAddr = '';
    let txHash = '';

    try {
      const signer = await getSigner();
      if (signer) {
        const factory = new ethers.Contract(CONTRACTS.JobFactory, getAbi(JobFactoryABI), signer);
        const tx = await factory.postJob(descriptionIpfsHash, tokenConfig.address);
        const receipt = await tx.wait();
        txHash = receipt.hash;
        const log = receipt.logs.find((l: any) => l.fragment && l.fragment.name === 'JobPosted');
        if (log) {
          contractAddr = log.args[0] || log.args.jobAddress;
        }
      }
    } catch (err) {
      console.warn('Real contract postJob fallback to deterministic calculation:', err);
    }

    if (!contractAddr) {
      const validFrom = (clientAddress && ethers.isAddress(clientAddress)) ? clientAddress : ethers.ZeroAddress;
      const nonceVal = Math.floor(Date.now() % 1000000) + jobs.length + 1;
      try {
        contractAddr = ethers.getCreateAddress({ from: validFrom, nonce: nonceVal });
      } catch {
        contractAddr = ethers.Wallet.createRandom().address;
      }
      txHash = generateMockTxHash();
    }

    const ethAmount = tokenConfig.symbol === 'MATIC'
      ? jobData.amountUsdc
      : (parseFloat(jobData.amountUsdc) / 2800).toFixed(4);

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
    return newJob;
  };

  const applyToJob = async (
    jobId: string,
    proposalText: string,
    applicantAddress: string,
    skills: string[],
    githubVerified: boolean,
    githubScore: number
  ) => {
    const proposalCid = generateIpfsCid({ proposalText, applicantAddress, timestamp: Date.now() });

    setJobs((prev) =>
      prev.map((job) => {
        if (!matchJob(job, jobId)) return job;
        const exists = (job.applications || []).some((a) => a.applicant.toLowerCase() === applicantAddress.toLowerCase());
        if (exists) return job;

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
          ...job,
          applications: [newApp, ...(job.applications || [])],
        };
      })
    );
  };

  const selectFreelancer = async (jobId: string, freelancerAddress: string) => {
    let txHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));
    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
        const tx = await escrow.selectFreelancer(freelancerAddress);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }
    } catch (err) {
      console.warn('Real contract selectFreelancer fallback:', err);
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
    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
        const tx = await escrow.proposeTerms();
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }
    } catch (err) {
      console.warn('Real contract proposeTerms fallback:', err);
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
    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
        const tokenConfig = getTokenByAddress(job.paymentToken);

        if (job.paymentToken === ethers.ZeroAddress || tokenConfig.symbol === 'MATIC') {
          const val = ethers.parseUnits(job.amountEth || job.amountUsdc || '0.01', 18);
          const tx = await escrow.fundJob(0n, { value: val });
          const receipt = await tx.wait();
          txHash = receipt.hash;
        } else {
          const erc20Abi = [
            'function approve(address spender, uint256 amount) external returns (bool)',
            'function allowance(address owner, address spender) external view returns (uint256)',
          ];
          const tokenContract = new ethers.Contract(job.paymentToken, erc20Abi, signer);
          const amountParsed = ethers.parseUnits(job.amountUsdc || '100', tokenConfig.decimals);

          const approveTx = await tokenContract.approve(job.contractAddress, amountParsed);
          await approveTx.wait();

          const fundTx = await escrow.fundJob(amountParsed);
          const receipt = await fundTx.wait();
          txHash = receipt.hash;
        }
      }
    } catch (err) {
      console.warn('Real contract fundJob fallback:', err);
    }
    if (!txHash) {
      txHash = generateMockTxHash();
    }

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
        const updatedEvents = j.events.map((evt) => {
          if (evt.step === 'Funded') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Client' };
          if (evt.step === 'Submitted') return { ...evt, status: 'current' as const };
          return evt;
        });
        return {
          ...j,
          status: 'Funded' as const,
          events: updatedEvents,
        };
      })
    );
  };

  const submitWork = async (
    jobId: string,
    title: string,
    description: string,
    evidenceHashes: string[],
    externalLink?: string
  ) => {
    let txHash = '';
    const job = jobs.find((j) => matchJob(j, jobId));
    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
        const tx = await escrow.submitWork(evidenceHashes);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }
    } catch (err) {
      console.warn('Real contract submitWork fallback:', err);
    }
    if (!txHash) {
      txHash = generateMockTxHash();
    }

    const proofObj: ProofOfWork = {
      title,
      description,
      evidenceHashes,
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
        const tx = await escrow.postProgressUpdate(updateIpfsHash);
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
        const tx = await escrow.requestTimeExtension(requestedDays, reasonIpfsHash);
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
        const tx = await escrow.respondToTimeExtension(requestIndex, approve);
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
        const tx = await escrow.requestModifications(noteIpfsHash);
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

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
        const tx = await escrow.releasePayment();
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }
    } catch (err) {
      console.warn('Real contract releasePayment fallback:', err);
    }

    if (!txHash) txHash = generateMockTxHash();
    if (!sbtTxHash) sbtTxHash = generateMockTxHash();

    setJobs((prev) =>
      prev.map((j) => {
        if (!matchJob(j, jobId)) return j;
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
              next[key] = {
                ...next[key],
                reputationSbtCount: (next[key].reputationSbtCount || 0) + 1,
                primaryScore: Math.min((next[key].primaryScore || 700) + 35, 1000),
              };
            }
            return next;
          });
        }

        const updatedEvents = j.events.map((evt) => {
          if (evt.step === 'Completed') return { ...evt, title: 'Payment Released (100%)', status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Client' };
          if (evt.step === 'Minted') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash: sbtTxHash, actor: 'JobFactory' };
          return evt;
        });

        return {
          ...j,
          status: 'Completed',
          events: updatedEvents,
        };
      })
    );
  };

  const claimAutoRelease = async (jobId: string) => {
    await releasePayment(jobId);
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
        const tx = await escrow.raiseDispute(evidenceIpfsHash);
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

    try {
      const signer = await getSigner();
      if (signer && job && ethers.isAddress(job.contractAddress)) {
        const escrow = new ethers.Contract(job.contractAddress, getAbi(JobEscrowABI), signer);
        const reasoningCid = generateIpfsCid(reasoningText);
        const tx = await escrow.resolveDispute(freelancerBps, reasoningCid);
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }
    } catch (err) {
      console.warn('Real contract resolveDispute fallback:', err);
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
  };

  const sendChatMessage = (jobId: string, text: string, senderRole: 'Client' | 'Freelancer' | 'Judge') => {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    const now = Date.now();
    const newMsg = { sender: senderRole, text: trimmed, timestamp: now };

    setJobs((prev) =>
      prev.map((job) => {
        if (!matchJob(job, jobId)) return job;
        const existing = job.chatMessages || [];
        const isRecentDuplicate = existing.some(
          (m) => m.sender === senderRole && m.text.trim() === trimmed && Math.abs(m.timestamp - now) < 2500
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
      if (profileData.githubVerified && profileData.githubUsername) {
        const lowerUsername = profileData.githubUsername.toLowerCase().trim();
        const duplicateAddress = Object.keys(prev).find(
          (addr) =>
            addr.toLowerCase() !== lowerAddress &&
            prev[addr].githubVerified &&
            prev[addr].githubUsername?.toLowerCase().trim() === lowerUsername
        );
        if (duplicateAddress) {
          alert(`Verification Error: The GitHub account @${profileData.githubUsername} is already linked to another wallet address (${duplicateAddress.slice(0, 6)}...${duplicateAddress.slice(-4)})!\nOnly one wallet connection per GitHub username is allowed for Sybil resistance.`);
          return prev;
        }
      }

      const existing = prev[lowerAddress] || {
        address: lowerAddress,
        displayName: 'Anonymous PolyLancer',
        bio: '',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        ipfsHash: '',
        skills: [],
        githubVerified: false,
        reputationSbtCount: 0,
      };

      return {
        ...prev,
        [lowerAddress]: {
          ...existing,
          ...profileData,
        },
      };
    });
  };

  const castDaoVote = async (proposalId: string | number, support: boolean, voterAddress?: string, votingPower: number = 10) => {
    let txHash = '';
    try {
      const signer = await getSigner();
      if (signer && typeof proposalId === 'number') {
        const judgeDao = new ethers.Contract(CONTRACTS.JudgeDAO, getAbi(JudgeDAOABI), signer);
        const tx = await judgeDao.castVote(proposalId, support);
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

  const deleteChatHistory = (jobId?: string, judgeAddress?: string) => {
    if (jobId) {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id.toLowerCase() !== jobId.toLowerCase() && j.contractAddress.toLowerCase() !== jobId.toLowerCase()) return j;
          return { ...j, chatMessages: [] };
        })
      );
    } else if (judgeAddress) {
      const lower = judgeAddress.toLowerCase();
      setJudgeMessages((prev) => {
        const next = { ...prev };
        delete next[lower];
        return next;
      });
    }
  };

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

  return (
    <PolyLanceDataContext.Provider
      value={{
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
        raiseDispute,
        submitDisputeResponse,
        resolveDispute,
        sendChatMessage,
        sendJudgeChatMessage,
        isEnclineConnected: false,
        judgeMessages,
        closeChatSession,
        deleteChatHistory,
        updateProfile,
        castDaoVote,
        castVote,
        createDaoProposal,
        proposeJudgeCandidate,
        withdrawTreasury,
        proposeTreasuryWithdrawal,
        signTreasuryWithdrawal,
        executeTreasuryWithdrawal,
      }}
    >

      {children}
    </PolyLanceDataContext.Provider>
  );
};

export const usePolyLanceData = () => {
  const context = useContext(PolyLanceDataContext);
  if (!context) {
    throw new Error('usePolyLanceData must be used within a PolyLanceDataProvider');
  }
  return context;
};
