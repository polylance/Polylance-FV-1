export type JobStatus = 'Open' | 'Selected' | 'Funded' | 'Submitted' | 'Disputed' | 'Completed' | 'Cancelled';

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

export interface DeliverableFile {
  cid: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  uploadedAt: number;
}

export interface ProofOfWork {
  title: string;
  description: string;
  evidenceHashes: string[];
  evidenceFiles?: DeliverableFile[];
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
  txHash?: string;
  status: 'completed' | 'current' | 'pending' | 'upcoming';
  actor?: string;
  description?: string;
}

export interface ProgressUpdate {
  id: string;
  ipfsHash?: string;
  progressPercent: number;
  statusNote: string;
  timestamp: number;
  txHash?: string;
  demoUrl?: string;
}

export interface TimeExtensionRequest {
  id: string;
  requestIndex?: number;
  requestedDays: number;
  reasonIpfsHash?: string;
  reason: string;
  requestedAt: number;
  responded?: boolean;
  approved?: boolean;
  status: 'Pending' | 'Approved' | 'Rejected';
  responseNote?: string;
}

export interface ModificationRequest {
  id: string;
  note: string;
  requestedAt: number;
  status: 'Pending' | 'Addressed';
}

export interface NegotiationProposal {
  id: string;
  jobId?: string;
  applicantAddress?: string;
  proposedBy: 'Client' | 'Freelancer';
  amountUsdc: string;
  deadlineDays: number;
  note?: string;
  isFinalCall?: boolean;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Countered';
  createdAt: number;
  respondedAt?: number;
  responseNote?: string;
}

export interface ChatMessage {
  id?: string;
  sender: 'Client' | 'Freelancer' | 'Judge';
  senderAddress?: string;
  recipientAddress?: string;
  applicantAddress?: string;
  text: string;
  timestamp: number;
  proposal?: NegotiationProposal;
}

export interface Job {
  id: string;
  contractAddress: string;
  client: string;
  freelancer?: string;
  amountEth: string;
  amountUsdc: string;
  paymentToken: string;
  paymentTokenSymbol: string;
  paymentTokenDecimals: number;
  status: JobStatus;
  title: string;
  description: string;
  category: SkillCategory;
  skillsRequired?: string[];
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
  negotiationProposals?: NegotiationProposal[];
  events: JobEvent[];
  chatMessages?: ChatMessage[];
  sbtTokenId?: number;
  negotiatedAmount?: string;
  negotiatedDeadlineDays?: number;
  preAcceptMessages?: { sender: string; senderRole: 'Client' | 'Freelancer'; text: string; timestamp: number; proposal?: NegotiationProposal; applicantAddress?: string }[];
  completedAt?: number;
  chatClearedAt?: number;
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
  role?: 'freelancer' | 'client' | 'admin' | 'judge';
  title?: string;
  hourlyRateUsdc?: number;
}

export interface DaoProposal {
  id: number | string;
  title?: string;
  candidateAddress?: string;
  candidate?: string;
  proposer?: string;
  description?: string;
  rationale?: string;
  votesFor: number;
  votesAgainst: number;
  endsAt?: number;
  createdAt?: number;
  status: 'Active' | 'Executed' | 'Defeated';
  userVoted?: 'FOR' | 'AGAINST';
}

export interface TreasuryProposal {
  id: string;
  safeTxHash?: string;
  recipient: string;
  to?: string;
  amount?: string;
  amountUsdc: string;
  tokenAddress?: string;
  purpose: string;
  proposer: string;
  signatures: string[];
  confirmations?: string[];
  confirmationsRequired?: number;
  executed: boolean;
  isExecuted?: boolean;
  timestamp?: number;
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

export interface JudgeRecord {
  address: string;
  name: string;
  status: 'Active' | 'Suspended';
  addedAt: number;
  addedBy: string;
  notes?: string;
  specialty?: string;
  casesResolved?: number;
  avgResolutionTime?: string;
}

export interface JudgeMessage {
  id: string;
  judgeAddress: string;
  sender: string;
  senderRole: 'Admin' | 'Judge';
  text: string;
  timestamp: number;
}

