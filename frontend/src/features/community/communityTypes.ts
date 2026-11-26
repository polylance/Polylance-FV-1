export type CommunityTab = 'all' | 'opinion' | 'blog' | 'complaint';

export type CommunityPostKind = 'opinion' | 'blog' | 'complaint';

export type ComplaintCategory = 'Escrow' | 'UI/UX' | 'Dispute' | 'Verification' | 'General';

export type ComplaintStatus = 'Open' | 'Under Review' | 'Resolved';

export type AuthorRoleKind = 'client' | 'tech-freelancer' | 'non-tech-freelancer';

export interface CommunityReply {
  id: string;
  author: string;
  authorName?: string;
  authorRoleKind?: AuthorRoleKind;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  authorName?: string;
  authorRoleKind?: AuthorRoleKind;
  kind?: CommunityPostKind;
  discipline?: string;
  complaintCategory?: ComplaintCategory;
  complaintStatus?: ComplaintStatus;
  readTimeMin?: number;
  title: string;
  slug: string;
  content: string;
  coverImage?: string;
  tags: string[];
  language: string;
  isPinned: boolean;
  upvotesCount: number;
  userHasVoted?: boolean;
  commentsCount: number;
  replies?: CommunityReply[];
  createdAt: string;
  updatedAt: string;
}

export type IssueArea =
  | 'Jobs'
  | 'Escrow'
  | 'Disputes'
  | 'Messages'
  | 'Profile'
  | 'Payments'
  | 'UI/UX'
  | 'Other';

export type IssueStatus =
  | 'Open'
  | 'Acknowledged'
  | 'InProgress'
  | 'Fixed'
  | 'Closed';

export interface ProjectReview {
  id: string;
  jobId: string;
  reviewerWallet: string;
  revieweeWallet: string;
  reviewerRole: 'Client' | 'Freelancer';
  rating: number;
  comment: string;
  onchainVerified: boolean;
  txHash?: string;
  createdAt: string;
}

export interface IssueReport {
  id: string;
  reporter: string;
  title: string;
  area: IssueArea;
  steps: string;
  expected: string;
  actual: string;
  environment?: {
    browser?: string;
    wallet?: string;
    network?: string;
  };
  status: IssueStatus;
  upvotesCount: number;
  userHasVoted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationLogEntry {
  id: string;
  action: 'PostRemoved' | 'CommentRemoved' | 'IssueClosed';
  targetId: string;
  targetType: 'Post' | 'Comment' | 'Issue';
  reasonCode: string;
  moderator: string;
  timestamp: string;
}
