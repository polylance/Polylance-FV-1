import React, { createContext, useContext, useState, useEffect } from 'react';
import { Job, UserProfile, DaoProposal, JobStatus, DisputeReason, Application, ProofOfWork, TreasuryProposal, TreasuryState } from '../types';
import { generateMockTxHash } from '../utils/formatters';
import { generateIpfsCid } from '../utils/ipfs';

// Demo initial state with rich realistic data fulfilling all sections of the spec
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
  postJob: (jobData: { title: string; description: string; category: any; amountUsdc: string; reviewPeriodDays: number }, clientAddress: string) => Job;
  applyToJob: (jobId: string, proposalText: string, applicantAddress: string, skills: string[], githubVerified: boolean, githubScore: number) => void;
  selectFreelancer: (jobId: string, freelancerAddress: string) => void;
  proposeTerms: (jobId: string, userAddress: string) => void;
  fundJob: (jobId: string) => void;
  submitWork: (jobId: string, title: string, description: string, evidenceHashes: string[], externalLink?: string) => void;
  postProgressUpdate: (jobId: string, progressPercent: number, statusNote: string, demoUrl?: string) => void;
  requestTimeExtension: (jobId: string, requestedDays: number, reason: string) => void;
  respondToTimeExtension: (jobId: string, requestId: string, approve: boolean, responseNote?: string) => void;
  requestModifications: (jobId: string, note: string) => void;
  releasePayment: (jobId: string) => void;
  claimAutoRelease: (jobId: string) => void;
  raiseDispute: (jobId: string, reason: DisputeReason, evidenceText: string, evidenceIpfsHash: string, raisedByAddress: string) => void;
  submitDisputeResponse: (jobId: string, responseText: string, responseIpfsHash: string) => void;
  resolveDispute: (jobId: string, freelancerBps: number, reasoningText: string, judgeAddress: string) => void;
  updateProfile: (profile: Partial<UserProfile>, address: string) => void;
  castDaoVote: (proposalId: number, support: boolean, voterAddress: string, votingPower: number) => void;
  castVote: (proposalId: number, support: boolean, voterAddress: string) => void;
  createDaoProposal: (title: string, candidateAddress: string, description: string) => void;
  proposeJudgeCandidate: (candidateAddress: string, description: string, proposerAddress: string) => void;
  withdrawTreasury: (to: string, amountUsdc: number, byAddress: string) => void;
  proposeTreasuryWithdrawal: (recipient: string, amountUsdc: string, purpose: string, proposerAddress: string) => void;
  signTreasuryWithdrawal: (proposalId: string, signerAddress: string) => void;
  executeTreasuryWithdrawal: (proposalId: string) => void;
}

const PolyLanceDataContext = createContext<PolyLanceDataContextType | undefined>(undefined);

export const PolyLanceDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem('polylance_jobs');
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });
  const [daoProposals, setDaoProposals] = useState<DaoProposal[]>(() => {
    const saved = localStorage.getItem('polylance_dao_proposals');
    return saved ? JSON.parse(saved) : INITIAL_PROPOSALS;
  });
  const [treasuryBalanceUsdc, setTreasuryBalanceUsdc] = useState<number>(() => {
    const saved = localStorage.getItem('polylance_treasury_balance_usdc');
    if (saved === '10000' || !saved) return 0;
    return parseFloat(saved);
  });
  const [treasuryBalanceEth, setTreasuryBalanceEth] = useState<number>(() => {
    const saved = localStorage.getItem('polylance_treasury_balance_eth');
    if (saved === '4.5' || !saved) return 0.0;
    return parseFloat(saved);
  });

  const [treasuryProposals, setTreasuryProposals] = useState<TreasuryProposal[]>(() => {
    const saved = localStorage.getItem('polylance_treasury_proposals');
    return saved ? JSON.parse(saved) : [];
  });

  const [treasuryHistory, setTreasuryHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('polylance_treasury_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [profiles, setProfiles] = useState<Record<string, UserProfile>>(() => {
    const saved = localStorage.getItem('polylance_profiles');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [loading, setLoading] = useState(true);
  const pinataJwt = import.meta.env.VITE_PINATA_JWT;

  // Background Pinata IPFS State Sync
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
            
            const getResponse = await fetch(`https://cloudflare-ipfs.com/ipfs/${cid}`);
            if (getResponse.ok) {
              const data = await getResponse.json();
              if (data.jobs) setJobs(data.jobs);
              if (data.daoProposals) setDaoProposals(data.daoProposals);
              if (data.treasuryBalanceUsdc !== undefined) setTreasuryBalanceUsdc(data.treasuryBalanceUsdc);
              if (data.treasuryBalanceEth !== undefined) setTreasuryBalanceEth(data.treasuryBalanceEth);
              if (data.treasuryProposals) setTreasuryProposals(data.treasuryProposals);
              if (data.treasuryHistory) setTreasuryHistory(data.treasuryHistory);
              if (data.profiles) setProfiles(data.profiles);
              console.log('Restored live cloud state from Pinata IPFS CID:', cid);
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

          // Clean up old state pins to keep IPFS storage clean
          const queryParams = encodeURIComponent('{"app":{"value":"polylance","op":"eq"},"type":{"value":"state","op":"eq"}}');
          const listResponse = await fetch(`https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]=${queryParams}`, {
            headers: {
              Authorization: `Bearer ${pinataJwt}`,
            }
          });
          if (listResponse.ok) {
            const listData = await listResponse.json();
            const rows = listData.rows || [];
            for (const row of rows) {
              if (row.ipfs_pin_hash !== newCid) {
                fetch(`https://api.pinata.cloud/pinning/unpin/${row.ipfs_pin_hash}`, {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${pinataJwt}`,
                  }
                }).catch(() => {});
              }
            }
          }
        }
      } catch (error) {
        console.warn('Failed to sync state to Pinata in background:', error);
      }
    };

    const timer = setTimeout(syncStateToPinata, 2500);
    return () => clearTimeout(timer);
  }, [jobs, daoProposals, treasuryBalanceUsdc, treasuryBalanceEth, treasuryProposals, treasuryHistory, profiles, loading, pinataJwt]);

  useEffect(() => {
    localStorage.setItem('polylance_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('polylance_dao_proposals', JSON.stringify(daoProposals));
  }, [daoProposals]);

  useEffect(() => {
    localStorage.setItem('polylance_treasury_balance_usdc', treasuryBalanceUsdc.toString());
  }, [treasuryBalanceUsdc]);

  useEffect(() => {
    localStorage.setItem('polylance_treasury_balance_eth', treasuryBalanceEth.toString());
  }, [treasuryBalanceEth]);

  useEffect(() => {
    localStorage.setItem('polylance_treasury_proposals', JSON.stringify(treasuryProposals));
  }, [treasuryProposals]);

  useEffect(() => {
    localStorage.setItem('polylance_treasury_history', JSON.stringify(treasuryHistory));
  }, [treasuryHistory]);

  useEffect(() => {
    localStorage.setItem('polylance_profiles', JSON.stringify(profiles));
  }, [profiles]);

  const treasuryState: TreasuryState = {
    balanceUsdc: treasuryBalanceUsdc.toString(),
    balanceEth: treasuryBalanceEth.toString(),
    requiredSignatures: 2,
    signers: ['0x62cDfc0692cC675c95304BaCE2C834D8F901dCba', '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A'],
    proposals: treasuryProposals,
  };

  const postJob = (
    jobData: { title: string; description: string; category: any; amountUsdc: string; reviewPeriodDays: number },
    clientAddress: string
  ) => {
    const contractAddr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const txHash = generateMockTxHash();
    const ethAmount = (parseFloat(jobData.amountUsdc) / 2800).toFixed(2);

    const newJob: Job = {
      id: contractAddr.slice(0, 14),
      contractAddress: contractAddr,
      client: clientAddress,
      amountEth: ethAmount,
      amountUsdc: jobData.amountUsdc,
      status: 'Open',
      title: jobData.title,
      description: jobData.description,
      category: jobData.category,
      reviewPeriodDays: jobData.reviewPeriodDays,
      createdAt: Date.now(),
      applications: [],
      events: [
        { step: 'Posted', title: 'Job Posted (Cloned Escrow)', timestamp: Date.now(), txHash, status: 'completed', actor: 'Client' },
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

  const applyToJob = (
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

  const selectFreelancer = (jobId: string, freelancerAddress: string) => {
    const txHash = generateMockTxHash();
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        const updatedEvents = job.events.map((evt) => {
          if (evt.step === 'Selected') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Client' };
          if (evt.step === 'Terms') return { ...evt, status: 'current' as const };
          return evt;
        });

        return {
          ...job,
          freelancer: freelancerAddress,
          status: 'Selected',
          events: updatedEvents,
        };
      })
    );
  };

  const proposeTerms = (jobId: string, userAddress: string) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        const isClient = userAddress.toLowerCase() === job.client.toLowerCase();
        const clientAgreed = isClient ? true : job.clientAgreedTerms;
        const freelancerAgreed = !isClient ? true : job.freelancerAgreedTerms;
        const bothAgreed = clientAgreed && freelancerAgreed;

        let updatedEvents = job.events;
        if (bothAgreed) {
          const txHash = generateMockTxHash();
          updatedEvents = job.events.map((evt) => {
            if (evt.step === 'Terms') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash };
            if (evt.step === 'Funded') return { ...evt, status: 'current' as const };
            return evt;
          });
        }

        return {
          ...job,
          clientAgreedTerms: clientAgreed,
          freelancerAgreedTerms: freelancerAgreed,
          termsHash: bothAgreed ? generateMockTxHash() : job.termsHash,
          events: updatedEvents,
        };
      })
    );
  };

  const fundJob = (jobId: string) => {
    const txHash = generateMockTxHash();
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        const updatedEvents = job.events.map((evt) => {
          if (evt.step === 'Funded') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Client' };
          if (evt.step === 'Submitted') return { ...evt, status: 'current' as const };
          return evt;
        });
        return {
          ...job,
          events: updatedEvents,
        };
      })
    );
  };

  const submitWork = (
    jobId: string,
    title: string,
    description: string,
    evidenceHashes: string[],
    externalLink?: string
  ) => {
    const txHash = generateMockTxHash();
    const proofObj: ProofOfWork = {
      title,
      description,
      evidenceHashes,
      submittedAt: Date.now(),
      externalLink,
    };

    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        const updatedEvents = job.events.map((evt) => {
          if (evt.step === 'Submitted') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Freelancer' };
          if (evt.step === 'Completed') return { ...evt, status: 'current' as const };
          return evt;
        });
        return {
          ...job,
          status: 'Submitted',
          submittedAt: Date.now(),
          proof: proofObj,
          events: updatedEvents,
        };
      })
    );
  };

  const postProgressUpdate = (
    jobId: string,
    progressPercent: number,
    statusNote: string,
    demoUrl?: string
  ) => {
    const updateObj = {
      id: Math.random().toString(36).slice(2),
      progressPercent,
      statusNote,
      timestamp: Date.now(),
      demoUrl,
    };
    const txHash = generateMockTxHash();

    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        const newEvents = [
          ...job.events,
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
          ...job,
          progressUpdates: [updateObj, ...(job.progressUpdates || [])],
          events: newEvents,
        };
      })
    );
  };

  const requestTimeExtension = (jobId: string, requestedDays: number, reason: string) => {
    const reqObj = {
      id: Math.random().toString(36).slice(2),
      requestedDays,
      reason,
      requestedAt: Date.now(),
      status: 'Pending' as const,
    };
    const txHash = generateMockTxHash();

    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        const newEvents = [
          ...job.events,
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
          ...job,
          extensionRequests: [reqObj, ...(job.extensionRequests || [])],
          events: newEvents,
        };
      })
    );
  };

  const respondToTimeExtension = (
    jobId: string,
    requestId: string,
    approve: boolean,
    responseNote?: string
  ) => {
    const txHash = generateMockTxHash();
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        let addedDays = 0;
        const updatedRequests = (job.extensionRequests || []).map((req) => {
          if (req.id === requestId) {
            if (approve) addedDays = req.requestedDays;
            return {
              ...req,
              status: approve ? ('Approved' as const) : ('Rejected' as const),
              responseNote,
            };
          }
          return req;
        });

        const newEvents = [
          ...job.events,
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
          ...job,
          reviewPeriodDays: job.reviewPeriodDays + addedDays,
          extensionRequests: updatedRequests,
          events: newEvents,
        };
      })
    );
  };

  const requestModifications = (jobId: string, note: string) => {
    const modObj = {
      id: Math.random().toString(36).slice(2),
      note,
      requestedAt: Date.now(),
      status: 'Pending' as const,
    };
    const txHash = generateMockTxHash();

    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        const newEvents = [
          ...job.events,
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
          ...job,
          modificationRequests: [modObj, ...(job.modificationRequests || [])],
          events: newEvents,
        };
      })
    );
  };

  const releasePayment = (jobId: string) => {
    const txHash = generateMockTxHash();
    const sbtTxHash = generateMockTxHash();

    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        const fee = (parseFloat(job.amountUsdc) * 0.025);
        setTreasuryBalanceUsdc((b) => b + fee);
        setTreasuryHistory((h) => [
          { id: Date.now().toString(), type: 'FEE_COLLECTED', amountUsdc: fee, txHash, timestamp: Date.now() },
          ...h,
        ]);

        const updatedEvents = job.events.map((evt) => {
          if (evt.step === 'Completed') return { ...evt, title: 'Payment Released (100%)', status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Client' };
          if (evt.step === 'Minted') return { ...evt, status: 'completed' as const, timestamp: Date.now(), txHash: sbtTxHash, actor: 'JobFactory' };
          return evt;
        });

        return {
          ...job,
          status: 'Completed',
          events: updatedEvents,
        };
      })
    );
  };

  const claimAutoRelease = (jobId: string) => {
    releasePayment(jobId);
  };

  const raiseDispute = (
    jobId: string,
    reason: DisputeReason,
    evidenceText: string,
    evidenceIpfsHash: string,
    raisedByAddress: string
  ) => {
    const txHash = generateMockTxHash();
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        const updatedEvents = job.events.map((evt) => {
          if (evt.step === 'Completed') return { step: 'Disputed', title: 'Dispute Raised', status: 'completed' as const, timestamp: Date.now(), txHash, actor: 'Party' };
          if (evt.step === 'Minted') return { step: 'Ruled', title: 'Awaiting DAO Arbitration', status: 'current' as const, timestamp: 0, txHash: '' };
          return evt;
        });

        return {
          ...job,
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
      prev.map((job) => {
        if (job.id !== jobId || !job.dispute) return job;
        return {
          ...job,
          dispute: {
            ...job.dispute,
            responseText,
            responseIpfsHash,
          },
        };
      })
    );
  };

  const resolveDispute = (jobId: string, freelancerBps: number, reasoningText: string, judgeAddress: string) => {
    const txHash = generateMockTxHash();
    const sbtTxHash = generateMockTxHash();
    const reasoningCid = generateIpfsCid(reasoningText);

    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId || !job.dispute) return job;
        const freelancerPercent = freelancerBps / 100;
        const fee = parseFloat(job.amountUsdc) * 0.025;
        setTreasuryBalanceUsdc((b) => b + fee);

        const updatedEvents: any[] = [
          ...job.events.filter((e) => e.step !== 'Ruled' && e.step !== 'Minted'),
          { step: 'Ruled', title: `DAO Ruling (${freelancerPercent}% Freelancer)`, timestamp: Date.now(), txHash, status: 'completed', actor: 'Judge DAO' },
          { step: 'Minted', title: freelancerBps > 0 ? 'Reputation SBT Minted' : 'Escrow Closed (No SBT)', timestamp: Date.now(), txHash: sbtTxHash, status: 'completed', actor: 'JobFactory' },
        ];

        return {
          ...job,
          status: 'Completed',
          dispute: {
            ...job.dispute,
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

  const updateProfile = (profileData: Partial<UserProfile>, address: string) => {
    setProfiles((prev) => {
      // Uniqueness check: Ensure no other wallet has already linked this GitHub account
      if (profileData.githubVerified && profileData.githubUsername) {
        const lowerUsername = profileData.githubUsername.toLowerCase().trim();
        const duplicateAddress = Object.keys(prev).find(
          (addr) =>
            addr.toLowerCase() !== address.toLowerCase() &&
            prev[addr].githubVerified &&
            prev[addr].githubUsername?.toLowerCase().trim() === lowerUsername
        );
        if (duplicateAddress) {
          alert(`Verification Error: The GitHub account @${profileData.githubUsername} is already linked to another wallet address (${duplicateAddress.slice(0, 6)}...${duplicateAddress.slice(-4)})!\nOnly one wallet connection per GitHub username is allowed for Sybil resistance.`);
          return prev; // Reject updates
        }
      }

      const existing = prev[address] || {
        address,
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
        [address]: {
          ...existing,
          ...profileData,
        },
      };
    });
  };

  const castDaoVote = (proposalId: number, support: boolean, voterAddress: string, votingPower: number = 10) => {
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

  const castVote = (proposalId: number, support: boolean, voterAddress: string) => {
    castDaoVote(proposalId, support, voterAddress, 10);
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
    const newProp: TreasuryProposal = {
      id: `PROP-0${treasuryProposals.length + 1}`,
      recipient,
      amountUsdc,
      purpose,
      proposer: proposerAddress,
      signatures: [proposerAddress],
      executed: false,
    };
    setTreasuryProposals((prev) => [newProp, ...prev]);
  };

  const signTreasuryWithdrawal = (proposalId: string, signerAddress: string) => {
    setTreasuryProposals((prev) =>
      prev.map((p) => {
        if (p.id !== proposalId) return p;
        if (p.signatures.includes(signerAddress)) return p;
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
