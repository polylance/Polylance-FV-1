import { useMemo, useState, useEffect } from 'react';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';

export interface NotificationItem {
  id: string;
  type: 'proposal' | 'funded' | 'work_submitted' | 'disputed' | 'payment_released' | 'system';
  title: string;
  description: string;
  timeAgo: string;
  timestamp: number;
  link: string;
  isRead: boolean;
}

const STORAGE_KEY = 'polylance_read_notifications';

export function useNotifications() {
  const { jobs } = usePolyLanceData();
  const { address, isConnected } = useWeb3();

  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
    } catch {}
  };

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!jobs || !Array.isArray(jobs)) return [];
    const items: NotificationItem[] = [];
    const userAddr = address?.toLowerCase();

    jobs.forEach((job) => {
      const isClient = userAddr && job.client?.toLowerCase() === userAddr;
      const isFreelancer = userAddr && job.freelancer?.toLowerCase() === userAddr;

      // Proposals / Applications received
      if (job.applications && job.applications.length > 0 && isClient) {
        items.push({
          id: `prop-${job.id}-${job.applications.length}`,
          type: 'proposal',
          title: 'Proposal Received',
          description: `${job.applications.length} freelancer(s) applied to "${job.title}"`,
          timeAgo: 'Recently',
          timestamp: (job.createdAt || 0) * 1000 + 3600000,
          link: `/jobs/${job.id}`,
          isRead: readIds.includes(`prop-${job.id}-${job.applications.length}`),
        });
      }

      // Funded escrow
      if (job.status === 'Funded' || job.status === 'Selected') {
        if (isClient || isFreelancer) {
          items.push({
            id: `funded-${job.id}`,
            type: 'funded',
            title: 'Escrow Funded',
            description: `Escrow for "${job.title}" is funded and locked on-chain.`,
            timeAgo: 'Active',
            timestamp: (job.createdAt || 0) * 1000 + 7200000,
            link: `/workspace`,
            isRead: readIds.includes(`funded-${job.id}`),
          });
        }
      }

      // Work submitted
      if (job.status === 'Submitted') {
        if (isClient || isFreelancer) {
          items.push({
            id: `submitted-${job.id}`,
            type: 'work_submitted',
            title: 'Work Submitted for Review',
            description: `Deliverables submitted for "${job.title}".`,
            timeAgo: 'Awaiting Review',
            timestamp: (job.createdAt || 0) * 1000 + 14400000,
            link: `/workspace`,
            isRead: readIds.includes(`submitted-${job.id}`),
          });
        }
      }

      // Dispute opened
      if (job.status === 'Disputed') {
        items.push({
          id: `dispute-${job.id}`,
          type: 'disputed',
          title: 'Dispute Raised',
          description: `Dispute opened for "${job.title}". Awaiting arbitrator review.`,
          timeAgo: 'Under Review',
          timestamp: (job.createdAt || 0) * 1000 + 28800000,
          link: `/workspace`,
          isRead: readIds.includes(`dispute-${job.id}`),
        });
      }

      // Payment released / Completed
      if (job.status === 'Completed') {
        if (isClient || isFreelancer) {
          items.push({
            id: `completed-${job.id}`,
            type: 'payment_released',
            title: 'Payment Released',
            description: `Milestone funds released for "${job.title}". Certificate minted.`,
            timeAgo: 'Completed',
            timestamp: (job.createdAt || 0) * 1000 + 43200000,
            link: `/profile/${job.freelancer || ''}`,
            isRead: readIds.includes(`completed-${job.id}`),
          });
        }
      }
    });

    // If no notifications or user not connected, provide canonical platform updates
    if (items.length === 0) {
      items.push({
        id: 'system-welcome',
        type: 'system',
        title: 'Welcome to PolyLance',
        description: 'Explore on-chain freelance contracts with non-custodial milestone escrow.',
        timeAgo: 'Pinned',
        timestamp: Date.now(),
        link: '/jobs',
        isRead: readIds.includes('system-welcome'),
      });
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [jobs, address, readIds]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
