import { DEADLINE_CONFIG } from "../deadlineConfig.js";
import { getEngagementDisplayState, normalizeTimestampMs } from "../lifecycle.js";
export class DeadlineWorker {
    getJobs;
    getTransactions;
    rpcPool;
    createNotification;
    persistState;
    broadcastSync;
    interval = null;
    isRunning = false;
    sentNotificationKeys = new Set();
    status = {
        lastRunTime: 0,
        processedCount: 0,
        transitionsTriggered: 0,
        notificationsSent: 0,
        errorsCount: 0,
        workerLagMs: 0,
        isPausedDueToOutage: false,
    };
    constructor(options) {
        this.getJobs = options.getJobs;
        this.getTransactions = options.getTransactions;
        this.rpcPool = options.rpcPool;
        this.createNotification = options.createNotification;
        this.persistState = options.persistState;
        this.broadcastSync = options.broadcastSync;
        if (options.existingNotificationKeys) {
            options.existingNotificationKeys.forEach((k) => this.sentNotificationKeys.add(k));
        }
    }
    getStatus() {
        return { ...this.status };
    }
    start(intervalMs = 60000) {
        if (this.interval)
            return;
        // Run initial catch-up tick immediately
        this.tick().catch((err) => console.error("[DeadlineWorker] Initial tick error:", err));
        this.interval = setInterval(() => {
            this.tick().catch((err) => console.error("[DeadlineWorker] Tick error:", err));
        }, intervalMs);
        console.log(`[DeadlineWorker] Started periodic deadline watchdog (interval: ${intervalMs}ms)`);
    }
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    /**
     * Main scan loop. Evaluates active jobs against deadline thresholds in server UTC time.
     */
    async tick() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        const startMs = Date.now();
        try {
            // 1. Platform-fault fairness: Check RPC / Network health before triggering overdue or expiry
            const healthSummary = this.rpcPool.getPublicHealthSummary();
            const isOutage = healthSummary.networkStatus === "DOWN";
            this.status.isPausedDueToOutage = isOutage;
            if (isOutage) {
                console.warn("[DeadlineWorker] Network outage detected. Pausing deadline and overdue state transitions.");
                return;
            }
            const jobs = this.getJobs() || [];
            const transactions = this.getTransactions() || [];
            const now = Date.now();
            let stateChanged = false;
            for (const job of jobs) {
                if (!job || !job.id)
                    continue;
                this.status.processedCount++;
                // Only evaluate funded/active/submitted jobs
                const display = getEngagementDisplayState(job, transactions, now);
                const deadlineVersion = job.deadlineVersion || 1;
                const deadlineMs = job.deadlineTimestamp
                    ? normalizeTimestampMs(job.deadlineTimestamp)
                    : (job.deadlineDays && job.fundedAt
                        ? normalizeTimestampMs(job.fundedAt) + job.deadlineDays * 86400000
                        : (job.durationDays && job.fundedAt
                            ? normalizeTimestampMs(job.fundedAt) + job.durationDays * 86400000
                            : null));
                // ── Case 1: Pre-submission Deadline Alerts ─────────────────────────────
                if (display.state === "DUE_SOON" && deadlineMs) {
                    const remainingMs = deadlineMs - now;
                    for (const thresholdMs of DEADLINE_CONFIG.DUE_SOON_THRESHOLDS_MS) {
                        const hours = Math.round(thresholdMs / 3600000);
                        if (remainingMs <= thresholdMs && remainingMs > thresholdMs - 3600000) {
                            const dedupeKey = `deadline_due_${hours}h_${job.id}_v${deadlineVersion}`;
                            if (!this.sentNotificationKeys.has(dedupeKey)) {
                                this.sentNotificationKeys.add(dedupeKey);
                                this.status.notificationsSent++;
                                if (job.freelancer) {
                                    await this.createNotification({
                                        recipientWallet: job.freelancer,
                                        actorWallet: job.client || "0x0000000000000000000000000000000000000000",
                                        type: "DEADLINE_DUE_SOON",
                                        title: `Deadline Approaching: ${hours}h Remaining`,
                                        body: `Your deadline for "${job.title || 'Job'}" is in ${hours} hours. Please submit your work deliverables or request an extension.`,
                                        entityType: "job",
                                        entityId: job.id,
                                        deepLink: `/workspace?jobId=${job.id}`,
                                        dedupeKey,
                                    });
                                }
                                if (job.client) {
                                    await this.createNotification({
                                        recipientWallet: job.client,
                                        actorWallet: job.freelancer || "0x0000000000000000000000000000000000000000",
                                        type: "DEADLINE_DUE_SOON",
                                        title: `Job Deadline Approaching: ${hours}h`,
                                        body: `The delivery deadline for "${job.title || 'Job'}" is in ${hours} hours.`,
                                        entityType: "job",
                                        entityId: job.id,
                                        deepLink: `/workspace?jobId=${job.id}`,
                                        dedupeKey: `${dedupeKey}_client`,
                                    });
                                }
                            }
                        }
                    }
                }
                // ── Case 2: Overdue (Grace Period) Alert ───────────────────────────────
                if (display.state === "OVERDUE" && deadlineMs) {
                    const dedupeKey = `deadline_overdue_${job.id}_v${deadlineVersion}`;
                    if (!this.sentNotificationKeys.has(dedupeKey)) {
                        this.sentNotificationKeys.add(dedupeKey);
                        this.status.notificationsSent++;
                        this.status.transitionsTriggered++;
                        stateChanged = true;
                        if (job.freelancer) {
                            await this.createNotification({
                                recipientWallet: job.freelancer,
                                actorWallet: job.client || "0x0000000000000000000000000000000000000000",
                                type: "DEADLINE_OVERDUE",
                                title: "Work Delivery Deadline Passed",
                                body: `The agreed deadline for "${job.title || 'Job'}" has passed. A 48-hour grace period is active. Submit now or request an extension.`,
                                entityType: "job",
                                entityId: job.id,
                                deepLink: `/workspace?jobId=${job.id}`,
                                dedupeKey,
                            });
                        }
                        if (job.client) {
                            await this.createNotification({
                                recipientWallet: job.client,
                                actorWallet: job.freelancer || "0x0000000000000000000000000000000000000000",
                                type: "DEADLINE_OVERDUE",
                                title: "Job Overdue — Grace Period Active",
                                body: `The delivery deadline for "${job.title || 'Job'}" passed without submission. The freelancer has a 48h grace period to submit.`,
                                entityType: "job",
                                entityId: job.id,
                                deepLink: `/workspace?jobId=${job.id}`,
                                dedupeKey: `${dedupeKey}_client`,
                            });
                        }
                    }
                }
                // ── Case 3: Expired No Submission (Grace Ended) ─────────────────────────
                if (display.state === "EXPIRED_NO_SUBMISSION" && deadlineMs) {
                    const dedupeKey = `deadline_expired_grace_${job.id}_v${deadlineVersion}`;
                    if (!this.sentNotificationKeys.has(dedupeKey)) {
                        this.sentNotificationKeys.add(dedupeKey);
                        this.status.notificationsSent++;
                        this.status.transitionsTriggered++;
                        stateChanged = true;
                        if (job.client) {
                            await this.createNotification({
                                recipientWallet: job.client,
                                actorWallet: job.freelancer || "0x0000000000000000000000000000000000000000",
                                type: "DEADLINE_EXPIRED_NO_SUBMISSION",
                                title: "Delivery Period & Grace Expired",
                                body: `The freelancer did not submit work for "${job.title || 'Job'}". Review your options: extend deadline, request refund review, or open a dispute.`,
                                entityType: "job",
                                entityId: job.id,
                                deepLink: `/workspace?jobId=${job.id}`,
                                dedupeKey,
                            });
                        }
                        if (job.freelancer) {
                            await this.createNotification({
                                recipientWallet: job.freelancer,
                                actorWallet: job.client || "0x0000000000000000000000000000000000000000",
                                type: "DEADLINE_EXPIRED_NO_SUBMISSION",
                                title: "Delivery Period & Grace Expired",
                                body: `The grace period for "${job.title || 'Job'}" has expired. You may still submit deliverables while the client has not taken final action.`,
                                entityType: "job",
                                entityId: job.id,
                                deepLink: `/workspace?jobId=${job.id}`,
                                dedupeKey: `${dedupeKey}_freelancer`,
                            });
                        }
                    }
                }
                // ── Case 4: Client Review Window Reminders ─────────────────────────────
                const hasSubmission = Boolean(job.deliverableSubmittedAt || job.proof || job.status === "Submitted");
                if (hasSubmission && !display.isApproved && !display.isPaid) {
                    const submissionTime = normalizeTimestampMs(job.deliverableSubmittedAt || job.submittedAt || job.updatedAt);
                    const reviewWindowMs = job.reviewWindowDays
                        ? job.reviewWindowDays * 86400000
                        : DEADLINE_CONFIG.DEFAULT_REVIEW_WINDOW_MS;
                    const reviewEndMs = submissionTime + reviewWindowMs;
                    const remainingReviewMs = reviewEndMs - now;
                    const elapsedFraction = (now - submissionTime) / reviewWindowMs;
                    // Check reminder fractions: 50%, 80%, 95%
                    for (const fraction of DEADLINE_CONFIG.REVIEW_REMINDER_FRACTIONS) {
                        const percent = Math.round(fraction * 100);
                        if (elapsedFraction >= fraction && elapsedFraction < fraction + 0.1) {
                            const dedupeKey = `review_remind_${percent}_${job.id}_sub${submissionTime}`;
                            if (!this.sentNotificationKeys.has(dedupeKey)) {
                                this.sentNotificationKeys.add(dedupeKey);
                                this.status.notificationsSent++;
                                if (job.client) {
                                    await this.createNotification({
                                        recipientWallet: job.client,
                                        actorWallet: job.freelancer || "0x0000000000000000000000000000000000000000",
                                        type: "REVIEW_WINDOW_REMINDER",
                                        title: `Review Window: ${percent}% Elapsed`,
                                        body: `Please review deliverables submitted for "${job.title || 'Job'}". Approve or request revisions.`,
                                        entityType: "job",
                                        entityId: job.id,
                                        deepLink: `/workspace?jobId=${job.id}`,
                                        dedupeKey,
                                    });
                                }
                            }
                        }
                    }
                    // Check final warnings: 48h, 24h, 2h
                    for (const warningMs of DEADLINE_CONFIG.REVIEW_FINAL_WARNINGS_MS) {
                        const hours = Math.round(warningMs / 3600000);
                        if (remainingReviewMs <= warningMs && remainingReviewMs > warningMs - 3600000) {
                            const dedupeKey = `review_warning_${hours}h_${job.id}_sub${submissionTime}`;
                            if (!this.sentNotificationKeys.has(dedupeKey)) {
                                this.sentNotificationKeys.add(dedupeKey);
                                this.status.notificationsSent++;
                                if (job.client) {
                                    await this.createNotification({
                                        recipientWallet: job.client,
                                        actorWallet: job.freelancer || "0x0000000000000000000000000000000000000000",
                                        type: "REVIEW_WINDOW_FINAL_WARNING",
                                        title: `Action Required: ${hours}h Left in Review Window`,
                                        body: `Review window for "${job.title || 'Job'}" expires in ${hours} hours. Please take action to approve, request revisions, or dispute.`,
                                        entityType: "job",
                                        entityId: job.id,
                                        deepLink: `/workspace?jobId=${job.id}`,
                                        dedupeKey,
                                    });
                                }
                            }
                        }
                    }
                }
                // ── Case 5: Stalled Engagement Watchdog ─────────────────────────────────
                const lastUpdated = normalizeTimestampMs(job.updatedAt || job.createdAt);
                const inactivityMs = now - lastUpdated;
                if (inactivityMs > DEADLINE_CONFIG.STALLED_INACTIVITY_MS &&
                    display.state !== "COMPLETED" &&
                    display.state !== "CANCELLED") {
                    const dedupeKey = `stalled_nudge_${job.id}_${Math.floor(inactivityMs / (7 * 86400000))}`;
                    if (!this.sentNotificationKeys.has(dedupeKey)) {
                        this.sentNotificationKeys.add(dedupeKey);
                        this.status.notificationsSent++;
                        if (job.client) {
                            await this.createNotification({
                                recipientWallet: job.client,
                                actorWallet: "0x0000000000000000000000000000000000000000",
                                type: "STALLED_NOTICE",
                                title: "Job Inactivity Notice",
                                body: `No activity has been recorded on "${job.title || 'Job'}" for over 14 days. Please review status.`,
                                entityType: "job",
                                entityId: job.id,
                                deepLink: `/workspace?jobId=${job.id}`,
                                dedupeKey: `${dedupeKey}_client`,
                            });
                        }
                    }
                }
            }
            if (stateChanged) {
                await this.persistState();
                this.broadcastSync();
            }
            this.status.lastRunTime = Date.now();
            this.status.workerLagMs = Date.now() - startMs;
        }
        catch (err) {
            this.status.errorsCount++;
            this.status.lastError = err?.message || String(err);
            console.error("[DeadlineWorker] Execution error:", err);
        }
        finally {
            this.isRunning = false;
        }
    }
}
