import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import { Job, UserProfile, DaoProposal, JobStatus, DisputeReason, Application, ProofOfWork, TreasuryProposal, TreasuryState } from '../types';
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

const INITIAL_JOBS: Job[] = [];
const INITIAL_PROPOSALS: DaoProposal[] = [];
const INITIAL_PROFILES: Record<string, UserProfile> = {};

interface PolyLanceDataContextType {
  loading: boolean;
  jobs: Job[];
  daoProposals: DaoProposal[];
  treasury: TreasuryState;
  treasuryBalanceUsdc: number;
  treasuryBalanceEth: number;
  treasuryHistory: { id: string; type: 'FEE_COLLECTED' | 'WITHDRAWAL'; amountUsdc: number; txHash: string; timestamp: number; by?: string }[];
  profiles: Record<string, UserProfile>;
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
  updateProfile: (profile: Partial<UserProfile>, address: string) => Promise<void>;
  castDaoVote: (proposalId: number, support: boolean, voterAddress: string, votingPower?: number) => Promise<void>;
  castVote: (proposalId: number, support: boolean, voterAddress: string) => Promise<void>;
  createDaoProposal: (title: string, candidateAddress: string, description: string) => void;
  proposeJudgeCandidate: (candidateAddress: string, description: string, proposerAddress: string) => void;
  withdrawTreasury: (to: string, amountUsdc: number, byAddress: string) => void;
  proposeTreasuryWithdrawal: (recipient: string, amountUsdc: string, purpose: string, proposerAddress: string) => void;
  signTreasuryWithdrawal: (proposalId: string, signerAddress: string) => void;
  executeTreasuryWithdrawal: (proposalId: string) => void;
}

const PolyLanceDataContext = createContext<PolyLanceDataContextType | undefined>(undefined);

const normalizeProfiles = (rawProfiles: Record<string, UserProfile>): Record<string, UserProfile> => {
  const normalized: Record<string, UserProfile> = {};
  for (const [addr, profile] of Object.entries(rawProfiles)) {
    if (!addr) continue;
    const lowerAddr = addr.toLowerCase();
    const existing = normalized[lowerAddr];
    
    if (!existing) {
      normalized[lowerAddr] = { ...profile, address: lowerAddr };
    } else {
      const selectNewer = (!existing.displayName && profile.displayName) || 
                          (!existing.githubVerified && profile.githubVerified) || 
                          (profile.displayName && existing.displayName && profile.displayName !== 'Anonymous PolyLancer' && existing.displayName === 'Anonymous PolyLancer');
      if (selectNewer) {
        normalized[lowerAddr] = { ...profile, address: lowerAddr };
      }
    }
  }
  return normalized;
};

export const PolyLanceDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { provider, getSigner } = useWeb3();
  const hasUnsyncedChangesRef = useRef(false);
  const isRestoringRef = useRef(false);
  const lastLoadedCidRef = useRef<string | null>(null);

  const touchLocalTimestamp = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('polylance_last_updated', Date.now().toString());
    }
  };

  const [jobs, setJobsRaw] = useState<Job[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_jobs');
      return saved ? JSON.parse(saved) : INITIAL_JOBS;
    }
    return INITIAL_JOBS;
  });
  const setJobs = (val: React.SetStateAction<Job[]>) => {
    if (!isRestoringRef.current) {
      hasUnsyncedChangesRef.current = true;
      touchLocalTimestamp();
    }
    setJobsRaw(val);
  };

  const [daoProposals, setDaoProposalsRaw] = useState<DaoProposal[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_dao_proposals');
      return saved ? JSON.parse(saved) : INITIAL_PROPOSALS;
    }
    return INITIAL_PROPOSALS;
  });
  const setDaoProposals = (val: React.SetStateAction<DaoProposal[]>) => {
    if (!isRestoringRef.current) {
      hasUnsyncedChangesRef.current = true;
      touchLocalTimestamp();
    }
    setDaoProposalsRaw(val);
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
    if (!isRestoringRef.current) {
      hasUnsyncedChangesRef.current = true;
      touchLocalTimestamp();
    }
    setTreasuryBalanceUsdcRaw(val);
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
    if (!isRestoringRef.current) {
      hasUnsyncedChangesRef.current = true;
      touchLocalTimestamp();
    }
    setTreasuryBalanceEthRaw(val);
  };

  const [treasuryProposals, setTreasuryProposalsRaw] = useState<TreasuryProposal[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_treasury_proposals');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const setTreasuryProposals = (val: React.SetStateAction<TreasuryProposal[]>) => {
    if (!isRestoringRef.current) {
      hasUnsyncedChangesRef.current = true;
      touchLocalTimestamp();
    }
    setTreasuryProposalsRaw(val);
  };

  const [treasuryHistory, setTreasuryHistoryRaw] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_treasury_history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const setTreasuryHistory = (val: React.SetStateAction<any[]>) => {
    if (!isRestoringRef.current) {
      hasUnsyncedChangesRef.current = true;
      touchLocalTimestamp();
    }
    setTreasuryHistoryRaw(val);
  };

  const [profiles, setProfilesRaw] = useState<Record<string, UserProfile>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_profiles');
      const raw = saved ? JSON.parse(saved) : INITIAL_PROFILES;
      return normalizeProfiles(raw);
    }
    return INITIAL_PROFILES;
  });
  const setProfiles = (val: React.SetStateAction<Record<string, UserProfile>>) => {
    if (!isRestoringRef.current) {
      hasUnsyncedChangesRef.current = true;
      touchLocalTimestamp();
    }
    setProfilesRaw(val);
  };

  const [loading, setLoading] = useState(true);
  const pinataJwt = import.meta.env.VITE_PINATA_JWT;

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
        setJobs((prev) => {
          const merged = [...parsedJobs];
          prev.forEach((p) => {
            if (!merged.some((m) => m.contractAddress.toLowerCase() === p.contractAddress.toLowerCase())) {
              merged.push(p);
            }
          });
          return merged;
        });
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

  // 2. Background Pinata IPFS State Sync (Load)
  useEffect(() => {
    const loadStateFromPinata = async () => {
      if (!pinataJwt) {
        setLoading(false);
        return;
      }
      try {
        const queryParams = encodeURIComponent('{"app":{"value":"polylance","op":"eq"},"type":{"value":"state","op":"eq"}}');
        const listResponse = await fetch(`https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]=${queryParams}`, {
          headers: {
            Authorization: `Bearer ${pinataJwt}`,
          }
        });
        if (listResponse.ok) {
          const listData = await listResponse.json();
          const rows = listData.rows || [];
          if (rows.length > 0) {
            const newest = rows.sort((a: any, b: any) => new Date(b.date_pinned).getTime() - new Date(a.date_pinned).getTime())[0];
            const cid = newest.ipfs_pin_hash;
            
            const gateways = [
              `https://ipfs.io/ipfs/${cid}`,
              `https://gateway.pinata.cloud/ipfs/${cid}`,
              `https://cloudflare-ipfs.com/ipfs/${cid}`,
              `https://dweb.link/ipfs/${cid}`
            ];

            let data = null;
            for (const gatewayUrl of gateways) {
              try {
                const getResponse = await fetch(gatewayUrl);
                if (getResponse.ok) {
                  data = await getResponse.json();
                  console.log('Restored live cloud state from IPFS via:', gatewayUrl);
                  break;
                }
              } catch (e) {
                console.warn(`Gateway fetch failed for ${gatewayUrl}, trying next...`);
              }
            }

            if (data) {
              isRestoringRef.current = true;
              if (data.jobs) setJobs(data.jobs);
              if (data.daoProposals) setDaoProposals(data.daoProposals);
              if (data.treasuryBalanceUsdc !== undefined) setTreasuryBalanceUsdc(data.treasuryBalanceUsdc);
              if (data.treasuryBalanceEth !== undefined) setTreasuryBalanceEth(data.treasuryBalanceEth);
              if (data.treasuryProposals) setTreasuryProposals(data.treasuryProposals);
              if (data.treasuryHistory) setTreasuryHistory(data.treasuryHistory);
              if (data.profiles) setProfiles(normalizeProfiles(data.profiles));
              
              lastLoadedCidRef.current = cid;
              isRestoringRef.current = false;
            }
          }
        }
      } catch (error) {
        console.warn('Unable to load cloud state from Pinata, using local cache:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStateFromPinata();
  }, [pinataJwt]);

  // 3. Background Polling Loop for Pinata updates
  useEffect(() => {
    if (!pinataJwt) return;

    const pollInterval = setInterval(async () => {
      // Always poll for fresh treasury proposals from other admins
      // but skip all other state refresh if we have local pending changes
      try {
        const queryParams = encodeURIComponent('{"app":{"value":"polylance","op":"eq"},"type":{"value":"state","op":"eq"}}');
        const listResponse = await fetch(`https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]=${queryParams}`, {
          headers: {
            Authorization: `Bearer ${pinataJwt}`,
          }
        });
        if (listResponse.ok) {
          const listData = await listResponse.json();
          const rows = listData.rows || [];
          if (rows.length > 0) {
            const newest = rows.sort((a: any, b: any) => new Date(b.date_pinned).getTime() - new Date(a.date_pinned).getTime())[0];
            const cid = newest.ipfs_pin_hash;
            
            if (cid === lastLoadedCidRef.current) return;

            const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
            if (response.ok) {
              const data = await response.json();
              if (data) {
                isRestoringRef.current = true;
                if (!hasUnsyncedChangesRef.current) {
                  // Full state restore only when no local changes pending
                  if (data.jobs) setJobs(data.jobs);
                  if (data.daoProposals) setDaoProposals(data.daoProposals);
                  if (data.treasuryBalanceUsdc !== undefined) setTreasuryBalanceUsdc(data.treasuryBalanceUsdc);
                  if (data.treasuryBalanceEth !== undefined) setTreasuryBalanceEth(data.treasuryBalanceEth);
                  if (data.treasuryHistory) setTreasuryHistory(data.treasuryHistory);
                  if (data.profiles) setProfiles(normalizeProfiles(data.profiles));
                }
                // ALWAYS merge treasury proposals from cloud so cross-admin signing works
                if (data.treasuryProposals && data.treasuryProposals.length > 0) {
                  setTreasuryProposals((local: TreasuryProposal[]) => {
                    const cloudProposals = data.treasuryProposals as TreasuryProposal[];
                    const cloudMap = new Map<string, TreasuryProposal>(cloudProposals.map((p) => [p.id, p]));
                    const merged: TreasuryProposal[] = local.map((lp) => {
                      const cp = cloudMap.get(lp.id);
                      if (!cp) return lp;
                      const sigs = Array.from(new Set([...lp.signatures, ...cp.signatures]));
                      return { ...lp, signatures: sigs, executed: lp.executed || cp.executed } as TreasuryProposal;
                    });
                    cloudProposals.forEach((cp) => {
                      if (!merged.find((p) => p.id === cp.id)) merged.push(cp);
                    });
                    return merged;
                  });
                }
                isRestoringRef.current = false;
                lastLoadedCidRef.current = cid;
                console.log('Background updated state to latest cloud CID:', cid);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Background state poll failed:', error);
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [pinataJwt]);

  useEffect(() => {
    fetchLiveExchangeRates().catch((err) => console.warn('Failed to load rates on boot:', err));
  }, []);

  // 4. Pinata Save Sync Loop
  useEffect(() => {
    if (loading || !pinataJwt) return;

    const syncStateToPinata = async () => {
      try {
        const statePayload = {
          jobs,
          daoProposals,
          treasuryBalanceUsdc,
          treasuryBalanceEth,
          treasuryProposals,
          treasuryHistory,
          profiles
        };
        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${pinataJwt}`,
          },
          body: JSON.stringify({
            pinataOptions: { cidVersion: 1 },
            pinataMetadata: {
              name: 'polylance_db_state',
              keyvalues: { app: 'polylance', type: 'state' }
            },
            pinataContent: statePayload
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const newCid = data.IpfsHash;
          console.log('Synced live cloud state to Pinata IPFS CID:', newCid);
          
          lastLoadedCidRef.current = newCid;
          hasUnsyncedChangesRef.current = false;

          const queryParams = encodeURIComponent('{"app":{"value":"polylance","op":"eq"},"type":{"value":"state","op":"eq"}}');
          const listResponse = await fetch(`https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]=${queryParams}`, {
            headers: {
              Authorization: `Bearer ${pinataJwt}`,
            }
          });
          if (listResponse.ok) {
            const listData = await listResponse.json();
            const rows = listData.rows || [];
            const oldPins = rows.filter((r: any) => r.ipfs_pin_hash !== newCid);
            if (oldPins.length > 2) {
              const oldest = oldPins.sort((a: any, b: any) => new Date(a.date_pinned).getTime() - new Date(b.date_pinned).getTime())[0];
              fetch(`https://api.pinata.cloud/pinning/unpin/${oldest.ipfs_pin_hash}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${pinataJwt}`,
                }
              }).catch(() => {});
            }
          }
        }
      } catch (error) {
        console.warn('Failed to sync state to Pinata in background:', error);
      }
    };

    const timer = setTimeout(syncStateToPinata, 3000);
    return () => clearTimeout(timer);
  }, [jobs, daoProposals, treasuryBalanceUsdc, treasuryBalanceEth, treasuryProposals, treasuryHistory, profiles, loading, pinataJwt]);

  // Local Cache storage triggers
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('polylance_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('polylance_dao_proposals', JSON.stringify(daoProposals));
  }, [daoProposals]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('polylance_treasury_balance_usdc', treasuryBalanceUsdc.toString());
  }, [treasuryBalanceUsdc]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('polylance_treasury_balance_eth', treasuryBalanceEth.toString());
  }, [treasuryBalanceEth]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('polylance_treasury_proposals', JSON.stringify(treasuryProposals));
  }, [treasuryProposals]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('polylance_treasury_history', JSON.stringify(treasuryHistory));
  }, [treasuryHistory]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('polylance_profiles', JSON.stringify(profiles));
  }, [profiles]);

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
      const nonceVal = Math.floor(performance.now() * 1000) + jobs.length + 1;
      contractAddr = ethers.getCreateAddress({ from: clientAddress || ethers.ZeroAddress, nonce: nonceVal });
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
        if (job.id !== jobId) return job;
        const exists = job.applications.some((a) => a.applicant.toLowerCase() === applicantAddress.toLowerCase());
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
          applications: [newApp, ...job.applications],
        };
      })
    );
  };

  const selectFreelancer = async (jobId: string, freelancerAddress: string) => {
    let txHash = '';
    const job = jobs.find((j) => j.id === jobId);
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
        if (j.id !== jobId) return j;
        const updatedEvents = j.events.map((evt) => {
          if (evt.step === 'Selected') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Client' };
          if (evt.step === 'Terms') return { ...evt, status: 'current' as const };
          return evt;
        });

        return {
          ...j,
          freelancer: freelancerAddress,
          status: 'Selected',
          events: updatedEvents,
        };
      })
    );
  };

  const proposeTerms = async (jobId: string, userAddress: string) => {
    let txHash = '';
    const job = jobs.find((j) => j.id === jobId);
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
        if (j.id !== jobId) return j;
        const isClient = userAddress.toLowerCase() === j.client.toLowerCase();
        const clientAgreed = isClient ? true : j.clientAgreedTerms;
        const freelancerAgreed = !isClient ? true : j.freelancerAgreedTerms;
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
    const job = jobs.find((j) => j.id === jobId);
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
        if (j.id !== jobId) return j;
        const updatedEvents = j.events.map((evt) => {
          if (evt.step === 'Funded') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Client' };
          if (evt.step === 'Submitted') return { ...evt, status: 'current' as const };
          return evt;
        });
        return {
          ...j,
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
    const job = jobs.find((j) => j.id === jobId);
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
        if (j.id !== jobId) return j;
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
    const job = jobs.find((j) => j.id === jobId);
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
        if (j.id !== jobId) return j;
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
    const job = jobs.find((j) => j.id === jobId);
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
        if (j.id !== jobId) return j;
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
    const job = jobs.find((j) => j.id === jobId);
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
        if (j.id !== jobId) return j;
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
    const job = jobs.find((j) => j.id === jobId);
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
        if (j.id !== jobId) return j;
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
    const job = jobs.find((j) => j.id === jobId);

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
        if (j.id !== jobId) return j;
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
    const job = jobs.find((j) => j.id === jobId);

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
        if (j.id !== jobId) return j;
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
        if (j.id !== jobId || !j.dispute) return j;
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
    const job = jobs.find((j) => j.id === jobId);

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
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        const newMsg = { sender: senderRole, text, timestamp: Date.now() };
        return {
          ...job,
          chatMessages: [...(job.chatMessages || []), newMsg],
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

  const castDaoVote = async (proposalId: number, support: boolean, voterAddress: string, votingPower: number = 10) => {
    let txHash = '';
    try {
      const signer = await getSigner();
      if (signer) {
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
        if (prop.id !== proposalId) return prop;
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

  const castVote = async (proposalId: number, support: boolean, voterAddress: string) => {
    await castDaoVote(proposalId, support, voterAddress, 10);
  };

  const createDaoProposal = (title: string, candidateAddress: string, description: string) => {
    const newProp: DaoProposal = {
      id: daoProposals.length + 1,
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

  const proposeJudgeCandidate = (candidateAddress: string, description: string, proposerAddress: string) => {
    const newProp: DaoProposal = {
      id: daoProposals.length + 1,
      title: `Nominate ${candidateAddress.slice(0, 8)}... as Arbitrator`,
      candidateAddress,
      candidate: candidateAddress,
      proposer: proposerAddress,
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
