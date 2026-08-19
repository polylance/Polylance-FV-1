import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '../config/contracts';

export function truncateAddress(addr: string | undefined): string {
  if (!addr) return '';
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDaysRemaining(submittedAt: number, reviewPeriodDays: number): string {
  const reviewPeriodMs = reviewPeriodDays * 24 * 60 * 60 * 1000;
  const expiresAt = submittedAt + reviewPeriodMs;
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 'Review period expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  if (days > 0) return `${days}d ${remHours}h remaining`;
  return `${remHours}h remaining`;
}

export function generateMockTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function generateDeterministicHash(seed: string = Date.now().toString()): string {
  return ethers.keccak256(ethers.toUtf8Bytes(seed));
}

export function getPolygonScanUrl(txHash: string): string {
  const baseUrl = NETWORK_CONFIG.blockExplorerUrl || 'https://amoy.polygonscan.com';
  return `${baseUrl}/tx/${txHash}`;
}

export function getDeterministicSbtId(jobId: string | undefined): number {
  if (!jobId) return 1001;
  let hash = 0;
  for (let i = 0; i < jobId.length; i++) {
    const char = jobId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return (Math.abs(hash) % 8999) + 1000;
}
