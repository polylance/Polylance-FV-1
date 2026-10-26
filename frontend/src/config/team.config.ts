/**
 * Team & Core Contributors Configuration
 * Pure data source for the Landing Page Team / Early Access block.
 * In accordance with Honesty Rules: only real, verified contributors are listed.
 * If empty, the team section gracefully renders nothing (null).
 */

export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  avatarUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  // Zero fake members. Keep empty or list verified contributors only.
];
