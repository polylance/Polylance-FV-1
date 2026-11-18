import { useMemo, useState, useEffect, useCallback } from 'react';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { normalizeTimestampMs } from '../types/lifecycle';
import { formatTimeAgo } from './formatters';
import { sharedPoller } from './sharedPoller';
import { apiClient } from './apiClient';

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

function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    return (
      (import.meta.env.VITE_BACKEND_URL as string) ||
      (import.meta.env.VITE_API_URL as string) ||
      `${window.location.protocol}//${window.location.hostname}:3001`
    );
  }
  return 'http://localhost:3001';
}

export function useNotifications() {
  const { jobs } = usePolyLanceData();
  const { address } = useWeb3();
  const { isAuthenticated } = useAuth();

  const [serverNotifications, setServerNotifications] = useState<any[]>([]);

  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const userAddr = address?.toLowerCase().trim();

  // Fetch real notifications from backend server via deduplicated poller
  const fetchServerNotifications = useCallback(async () => {
    if (!userAddr || !isAuthenticated) {
      setServerNotifications([]);
      return;
    }
    try {
      const backendUrl = getBackendUrl();
      const data = await sharedPoller.fetchDeduplicated<{ notifications: any[] }>(
        `${backendUrl}/api/notifications`,
        {},
        { cacheTtlMs: 8000, skipIfHidden: true }
      );
      if (data && Array.isArray(data.notifications)) {
        setServerNotifications(data.notifications);
      }
    } catch (err) {
      // Graceful offline fallback / rate-limit cooldown
    }
  }, [userAddr, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !userAddr) {
      setServerNotifications([]);
      return;
    }
    fetchServerNotifications();
    // 20s interval with slight random jitter (18s-22s)
    const jitter = Math.floor(Math.random() * 4000) - 2000;
    const interval = setInterval(fetchServerNotifications, 20000 + jitter);
    return () => clearInterval(interval);
  }, [fetchServerNotifications, isAuthenticated, userAddr]);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (id.startsWith('notif-')) {
      apiClient.post(`/api/notifications/${encodeURIComponent(id)}/read`).catch(() => {});
    }
  }, []);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    const seenIds = new Set<string>();

    // 1. Process server-delivered notifications
    if (Array.isArray(serverNotifications)) {
      serverNotifications.forEach((sn) => {
        if (!sn || !sn.id) return;
        const isRead = Boolean(sn.readAt) || readIds.includes(sn.id);
        const mappedType: NotificationItem['type'] =
          sn.type === 'PROPOSAL_RECEIVED' ||
          sn.type === 'OFFER_SENT' ||
          sn.type === 'OFFER_ACCEPTED' ||
          sn.type === 'OFFER_DECLINED' ||
          sn.type === 'COUNTER_OFFER_REQUESTED' ||
          sn.type === 'COUNTER_OFFER_ACCEPTED' ||
          sn.type === 'COUNTER_OFFER_REJECTED' ||
          sn.type === 'TERMS_AGREED' ||
          sn.type === 'SELECTION_CANCELLED'
            ? 'proposal'
            : sn.type === 'ESCROW_FUNDED'
            ? 'funded'
            : sn.type === 'WORK_SUBMITTED' || sn.type === 'REVISION_REQUESTED'
            ? 'work_submitted'
            : sn.type === 'PAYMENT_RELEASED'
            ? 'payment_released'
            : sn.type === 'DISPUTE_OPENED'
            ? 'disputed'
            : 'system';

        const ts = normalizeTimestampMs(sn.createdAt);
        items.push({
          id: sn.id,
          type: mappedType,
          title: sn.title || 'Notification',
          description: sn.body || '',
          timeAgo: formatTimeAgo(ts),
          timestamp: ts,
          link: sn.deepLink || '/dashboard',
          isRead,
        });
        seenIds.add(sn.id);
      });
    }

    // 2. Derive authentic local contract state notifications for real-time responsiveness
    if (jobs && Array.isArray(jobs) && userAddr) {
      jobs.forEach((job) => {
        if (!job) return;
        const isClient = job.client?.toLowerCase() === userAddr;
        const isFreelancer = job.freelancer?.toLowerCase() === userAddr;
        const jobTs = normalizeTimestampMs(job.createdAt || job.events?.[0]?.timestamp);

        // Proposals received by client
        if (job.applications && job.applications.length > 0 && isClient) {
          const propId = `prop-${job.id}-${job.applications.length}`;
          if (!seenIds.has(propId)) {
            items.push({
              id: propId,
              type: 'proposal',
              title: 'Proposal Received',
              description: `${job.applications.length} freelancer(s) applied to "${job.title}"`,
              timeAgo: formatTimeAgo(jobTs),
              timestamp: jobTs,
              link: `/jobs/${job.id}`,
              isRead: readIds.includes(propId),
            });
            seenIds.add(propId);
          }
        }

        // Freelancer selected / Offer received (Awaiting acceptance)
        if (job.status === 'Selected' && isFreelancer && !job.freelancerAgreedTerms) {
          const offerId = `offer-${job.id}`;
          if (!seenIds.has(offerId)) {
            items.push({
              id: offerId,
              type: 'proposal',
              title: "You've Been Selected!",
              description: `You were selected for "${job.title}". Review and accept the terms in your Workspace.`,
              timeAgo: formatTimeAgo(jobTs),
              timestamp: jobTs + 1000,
              link: `/workspace?jobId=${job.id}`,
              isRead: readIds.includes(offerId),
            });
            seenIds.add(offerId);
          }
        }

        // Offer accepted by freelancer -> client needs to fund
        if (job.status === 'Selected' && isClient && job.freelancerAgreedTerms) {
          const acceptId = `terms-accepted-${job.id}`;
          if (!seenIds.has(acceptId)) {
            items.push({
              id: acceptId,
              type: 'funded',
              title: 'Offer Accepted by Freelancer',
              description: `Freelancer accepted terms for "${job.title}". Deposit escrow to begin work.`,
              timeAgo: formatTimeAgo(jobTs),
              timestamp: jobTs + 2000,
              link: `/workspace?jobId=${job.id}`,
              isRead: readIds.includes(acceptId),
            });
            seenIds.add(acceptId);
          }
        }

        // Genuinely Funded escrow (strictly when job.status === 'Funded')
        if (job.status === 'Funded') {
          if (isClient || isFreelancer) {
            const fundedId = `funded-${job.id}`;
            if (!seenIds.has(fundedId)) {
              items.push({
                id: fundedId,
                type: 'funded',
                title: 'Escrow Funded',
                description: `Escrow for "${job.title}" is funded and locked on Polygon.`,
                timeAgo: formatTimeAgo(jobTs),
                timestamp: jobTs + 3000,
                link: `/workspace?jobId=${job.id}`,
                isRead: readIds.includes(fundedId),
              });
              seenIds.add(fundedId);
            }
          }
        }

        // Work submitted
        if (job.status === 'Submitted') {
          if (isClient || isFreelancer) {
            const submittedId = `submitted-${job.id}`;
            if (!seenIds.has(submittedId)) {
              items.push({
                id: submittedId,
                type: 'work_submitted',
                title: 'Work Submitted for Review',
                description: `Deliverables submitted for "${job.title}".`,
                timeAgo: formatTimeAgo(jobTs),
                timestamp: jobTs + 4000,
                link: `/workspace?jobId=${job.id}`,
                isRead: readIds.includes(submittedId),
              });
              seenIds.add(submittedId);
            }
          }
        }

        // Dispute opened
        if (job.status === 'Disputed') {
          const disputeId = `dispute-${job.id}`;
          if (!seenIds.has(disputeId)) {
            items.push({
              id: disputeId,
              type: 'disputed',
              title: 'Dispute Raised',
              description: `Dispute opened for "${job.title}". Awaiting arbitrator review.`,
              timeAgo: formatTimeAgo(jobTs),
              timestamp: jobTs + 5000,
              link: `/workspace?jobId=${job.id}`,
              isRead: readIds.includes(disputeId),
            });
            seenIds.add(disputeId);
          }
        }

        // Payment released / Completed
        if (job.status === 'Completed') {
          if (isClient || isFreelancer) {
            const completedId = `completed-${job.id}`;
            if (!seenIds.has(completedId)) {
              items.push({
                id: completedId,
                type: 'payment_released',
                title: 'Payment Released',
                description: `Milestone funds released for "${job.title}". Certificate minted.`,
                timeAgo: formatTimeAgo(jobTs),
                timestamp: jobTs + 6000,
                link: `/workspace?jobId=${job.id}`,
                isRead: readIds.includes(completedId),
              });
              seenIds.add(completedId);
            }
          }
        }
      });
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [serverNotifications, jobs, userAddr, readIds]);

  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
    } catch {}

    if (userAddr) {
      try {
        const backendUrl = getBackendUrl();
        fetch(`${backendUrl}/api/notifications/read-all`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': userAddr,
          },
          body: JSON.stringify({ wallet: userAddr }),
        }).catch(() => {});
      } catch {}
    }
  }, [userAddr, notifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
