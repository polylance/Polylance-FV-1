import { describe, it, expect } from 'vitest';

// 1. Canonical JID / Address Normalizer
export function normalizeChatAddress(addr?: string | null): string {
  if (!addr) return '';
  return addr.toLowerCase().trim();
}

// 2. Forward-Only Status State Machine Evaluator
const STATUS_RANKS: Record<string, number> = {
  sending: 0,
  sent: 1,
  seen: 2,
  failed: -1,
};

export function resolveMessageStatusTransition(
  currentStatus: 'sending' | 'sent' | 'seen' | 'failed',
  incomingStatus: 'sending' | 'sent' | 'seen' | 'failed'
): 'sending' | 'sent' | 'seen' | 'failed' {
  // If either is failed, transition to failed or recover to sending/sent/seen
  if (incomingStatus === 'failed') {
    // Only fail if current is not already seen or sent
    return currentStatus === 'seen' ? 'seen' : 'failed';
  }
  const currentRank = STATUS_RANKS[currentStatus] ?? 1;
  const incomingRank = STATUS_RANKS[incomingStatus] ?? 1;

  // Status only moves forward: sending (0) -> sent (1) -> seen (2)
  return incomingRank >= currentRank ? incomingStatus : currentStatus;
}

// 3. Seen Visibility Rule Evaluator
export function shouldSendSeenMarker(params: {
  isTabVisible: boolean;
  isWindowFocused: boolean;
  isCorrectChannelOpen: boolean;
  isIntersecting: boolean;
  intersectionRatio: number;
  isOwnMessage: boolean;
  readReceiptsEnabled: boolean;
}): boolean {
  if (!params.readReceiptsEnabled) return false;
  if (params.isOwnMessage) return false;
  if (!params.isTabVisible) return false;
  if (!params.isWindowFocused) return false;
  if (!params.isCorrectChannelOpen) return false;
  if (!params.isIntersecting || params.intersectionRatio < 0.5) return false;
  return true;
}

// 4. Outbox Queue Simulator
export class ChatOutboxManager {
  private queue: Map<string, { jobId: string; msgId: string; text: string }> = new Map();

  enqueue(jobId: string, msgId: string, text: string) {
    this.queue.set(msgId, { jobId, msgId, text });
  }

  acknowledge(msgId: string) {
    this.queue.delete(msgId);
  }

  pendingCount(): number {
    return this.queue.size;
  }

  getPending(): Array<{ jobId: string; msgId: string; text: string }> {
    return Array.from(this.queue.values());
  }
}

describe('Chat Reliability, Normalization & State Machine Suite', () => {
  describe('Canonical Address & JID Normalization', () => {
    it('normalizes mixed-case checksummed Ethereum addresses to lowercase', () => {
      const mixed = '0xB8aa472659103C6D657bfa3D4b6E136D755D09Dd';
      const expected = '0xb8aa472659103c6d657bfa3d4b6e136d755d09dd';
      expect(normalizeChatAddress(mixed)).toBe(expected);
    });

    it('strips leading and trailing whitespaces', () => {
      const dirty = '   0x62330823b1A934E271F3e2003c467aC0A272C3D3 \n';
      expect(normalizeChatAddress(dirty)).toBe('0x62330823b1a934e271f3e2003c467ac0a272c3d3');
    });

    it('handles null and undefined gracefully without throwing', () => {
      expect(normalizeChatAddress(null)).toBe('');
      expect(normalizeChatAddress(undefined)).toBe('');
    });
  });

  describe('Forward-Only Status Progression State Machine', () => {
    it('advances from sending to sent upon server acknowledgement', () => {
      expect(resolveMessageStatusTransition('sending', 'sent')).toBe('sent');
    });

    it('advances from sent to seen upon recipient display marker', () => {
      expect(resolveMessageStatusTransition('sent', 'seen')).toBe('seen');
    });

    it('advances directly from sending to seen if marker arrives after network lag', () => {
      expect(resolveMessageStatusTransition('sending', 'seen')).toBe('seen');
    });

    it('NEVER moves backward from seen to sent or sending', () => {
      expect(resolveMessageStatusTransition('seen', 'sent')).toBe('seen');
      expect(resolveMessageStatusTransition('seen', 'sending')).toBe('seen');
    });

    it('NEVER moves backward from sent to sending', () => {
      expect(resolveMessageStatusTransition('sent', 'sending')).toBe('sent');
    });

    it('does not downgrade seen message to failed', () => {
      expect(resolveMessageStatusTransition('seen', 'failed')).toBe('seen');
    });

    it('allows failed to retry and move to sending or sent', () => {
      expect(resolveMessageStatusTransition('failed', 'sending')).toBe('sending');
      expect(resolveMessageStatusTransition('failed', 'sent')).toBe('sent');
    });
  });

  describe('Strict Seen Marker Visibility Rules', () => {
    const baseParams = {
      isTabVisible: true,
      isWindowFocused: true,
      isCorrectChannelOpen: true,
      isIntersecting: true,
      intersectionRatio: 0.8,
      isOwnMessage: false,
      readReceiptsEnabled: true,
    };

    it('allows seen marker when all strict conditions are met', () => {
      expect(shouldSendSeenMarker(baseParams)).toBe(true);
    });

    it('rejects seen marker if document tab is in background (visibilityState hidden)', () => {
      expect(shouldSendSeenMarker({ ...baseParams, isTabVisible: false })).toBe(false);
    });

    it('rejects seen marker if window does not have focus', () => {
      expect(shouldSendSeenMarker({ ...baseParams, isWindowFocused: false })).toBe(false);
    });

    it('rejects seen marker if user is viewing a different channel', () => {
      expect(shouldSendSeenMarker({ ...baseParams, isCorrectChannelOpen: false })).toBe(false);
    });

    it('rejects seen marker if message is scrolled off-screen (not intersecting)', () => {
      expect(shouldSendSeenMarker({ ...baseParams, isIntersecting: false })).toBe(false);
      expect(shouldSendSeenMarker({ ...baseParams, intersectionRatio: 0.2 })).toBe(false);
    });

    it('never sends seen marker for own messages', () => {
      expect(shouldSendSeenMarker({ ...baseParams, isOwnMessage: true })).toBe(false);
    });

    it('respects user privacy setting: sends nothing when read receipts disabled', () => {
      expect(shouldSendSeenMarker({ ...baseParams, readReceiptsEnabled: false })).toBe(false);
    });
  });

  describe('Outbox Queue & Retry Resilience', () => {
    it('queues messages offline and flushes idempotently by message id', () => {
      const outbox = new ChatOutboxManager();
      outbox.enqueue('job-1', 'msg-100', 'Hello world');
      outbox.enqueue('job-1', 'msg-101', 'Can you review the spec?');

      expect(outbox.pendingCount()).toBe(2);
      expect(outbox.getPending()[0].msgId).toBe('msg-100');

      // Duplicate enqueue of same msgId does not create duplicates
      outbox.enqueue('job-1', 'msg-100', 'Hello world updated');
      expect(outbox.pendingCount()).toBe(2);

      // Server acknowledges msg-100
      outbox.acknowledge('msg-100');
      expect(outbox.pendingCount()).toBe(1);
      expect(outbox.getPending()[0].msgId).toBe('msg-101');
    });
  });
});
