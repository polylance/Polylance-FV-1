export type JobStatus = 'Open' | 'Selected' | 'Submitted' | 'Disputed' | 'Completed' | 'Cancelled';

export type DisputeReason = 'QUALITY' | 'NON_DELIVERY' | 'SCOPE_DISAGREEMENT' | 'PAYMENT_DISPUTE' | 'OTHER';

export type SkillCategory = 'web3' | 'frontend' | 'backend' | 'mobile';

export interface Application {
  applicant: string;
  proposalIpfsHash: string;
  proposalText: string;
  appliedAt: number;
  applicantSkills: string[];
  githubVerified: boolean;
  githubScore: number;
}

export interface ProofOfWork {
  title: string;
  description: string;
  evidenceHashes: string[];
  submittedAt: number;
  externalLink?: string;
}

export interface Dispute {
  raisedBy: string;
  reason: DisputeReason;
  evidenceIpfsHash: string;
  evidenceText?: string;
  raisedAt: number;
  resolved: boolean;
  responseIpfsHash?: string;
  responseText?: string;
  reasoningIpfsHash?: string;
  reasoningText?: string;
  rulingBps?: number; // 0..10000 (bps to freelancer)
  judge?: string;
}

export interface JobEvent {
  step: string;
  title: string;
  timestamp: number;
  txHash: string;
  status: 'completed' | 'current' | 'pending';
  actor?: string;
  description?: string;
}

export interface ProgressUpdate {
  id: string;
  progressPercent: number;
  statusNote: string;
  timestamp: number;
  demoUrl?: string;
}

export interface TimeExtensionRequest {
  id: string;
  requestedDays: number;
  reason: string;
  requestedAt: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  responseNote?: string;
}

export interface ModificationRequest {
  id: string;
  note: string;
  requestedAt: number;
  status: 'Pending' | 'Addressed';
}

export interface Job {
  id: string;
  contractAddress: string;
  client: string;
  freelancer?: string;
  amountEth: string;
  amountUsdc: string;
  paymentToken?: 'USDC' | 'USDT' | 'BTC' | 'ETH' | 'POL';
  tokenAmount?: string;
  status: JobStatus;
  title: string;
  description: string;
  category: SkillCategory;
  reviewPeriodDays: number;
  createdAt: number;
  submittedAt?: number;
  termsHash?: string;
  clientAgreedTerms?: boolean;
  freelancerAgreedTerms?: boolean;
  applications: Application[];
  proof?: ProofOfWork;
  dispute?: Dispute;
  progressUpdates?: ProgressUpdate[];
  extensionRequests?: TimeExtensionRequest[];
  modificationRequests?: ModificationRequest[];
  events: JobEvent[];
  chatMessages?: { sender: 'Client' | 'Freelancer' | 'Judge'; text: string; timestamp: number }[];
}

export interface UserProfile {
  address: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  ipfsHash: string;
  skills: string[];
  githubVerified: boolean;
  githubUsername?: string;
  verifiedAt?: number;
  primaryCategory?: string;
  primaryScore?: number;
  secondaryCategories?: string[];
  secondaryScores?: number[];
  attestationUID?: string;
  reputationSbtCount: number;
  languageBytes?: Record<string, number>;
  commitsCount?: number;
  reposCount?: number;
  prsCount?: number;
  reputationTier?: string;
  role?: 'freelancer' | 'client';
}

export interface DaoProposal {
  id: number;
  title: string;
  candidateAddress: string;
  candidate?: string;
  proposer?: string;
  description: string;
  rationale?: string;
  votesFor: number;
  votesAgainst: number;
  endsAt: number;
  status: 'Active' | 'Executed' | 'Defeated';
  userVoted?: 'FOR' | 'AGAINST';
}

export interface TreasuryProposal {
  id: string;
  recipient: string;
  amountUsdc: string;
  purpose: string;
  proposer: string;
  signatures: string[];
  executed: boolean;
}

export interface TreasuryState {
  balanceUsdc: string;
  balanceEth: string;
  requiredSignatures: number;
  signers: string[];
  proposals: TreasuryProposal[];
}

export type DemoRole = 'visitor' | 'client' | 'freelancer' | 'judge' | 'admin';

export interface WalletRoleInfo {
  role: DemoRole;
  label: string;
  address: string;
  isArbitrator: boolean;
  isTreasuryAdmin: boolean;
  reputationCount: number;
}
