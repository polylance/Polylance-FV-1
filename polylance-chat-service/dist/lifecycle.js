/**
 * PolyLance Unified Lifecycle State Machine & Constants
 * Single source of truth for job, proposal, escrow, and notification states.
 */
export const MAX_NEGOTIATION_ROUNDS = 6;
export const OFFER_EXPIRY_MS = 72 * 60 * 60 * 1000; // 72 hours
export const ALLOW_PROPOSALS_DURING_NEGOTIATION = true;
/**
 * Calculates the exact 2.5% platform fee using BigInt arithmetic.
 * Fee = (principalWei * 250n) / 10000n
 * Client pays: principal + fee
 * Freelancer receives: principal - fee
 */
export function calculateEscrowFeeBigInt(principalWei) {
    const clientFeeWei = (principalWei * 250n) / 10000n;
    const freelancerFeeWei = (principalWei * 250n) / 10000n;
    return {
        principalWei,
        clientFeeWei,
        freelancerFeeWei,
        totalClientPayWei: principalWei + clientFeeWei,
        netFreelancerReceiveWei: principalWei - freelancerFeeWei,
    };
}
/**
 * Global single source of truth deciding whether a job appears in Find Jobs.
 * RULE: The job leaves Find Jobs ONLY when escrow funding is confirmed on-chain
 * (status === 'Funded'). Selection, counter-offers, or failed/pending tx MUST NOT hide it.
 */
export function isJobListed(job) {
    if (!job)
        return false;
    if (job.isDemo || job.isMock)
        return false;
    const rawStatus = (job.status || '').toLowerCase().trim();
    const rawEscrowStatus = (job.escrowStatus || '').toLowerCase().trim();
    // Exclude completed, cancelled, or draft
    if (rawStatus === 'completed' ||
        rawStatus === 'cancelled' ||
        rawStatus === 'draft' ||
        rawEscrowStatus === 'released' ||
        rawEscrowStatus === 'completed' ||
        rawEscrowStatus === 'cancelled') {
        return false;
    }
    if (job.dispute && !job.dispute.resolved)
        return false;
    // The job leaves Find Jobs when confirmed funded, submitted, or completed
    if (rawStatus === 'funded' || rawStatus === 'submitted' || rawEscrowStatus === 'funded') {
        return false;
    }
    if (job.engagement?.state === 'ESCROW_FUNDED' || job.engagement?.state === 'COMPLETED') {
        return false;
    }
    // Once funded on-chain, a job can NEVER return to open in Find Jobs
    const wasEverFunded = Boolean(job.fundedAt || job.escrowFundedAt) ||
        (job.events || []).some((e) => (e.step === 'Funded' ||
            e.step === 'EscrowFunded' ||
            e.step === 'Paid' ||
            e.step === 'PaymentReleased' ||
            e.step === 'AutoReleased' ||
            e.step === 'Completed') &&
            (e.status === 'completed' || e.status === 'CONFIRMED'));
    if (wasEverFunded) {
        return false;
    }
    // Jobs in 'open' or 'selected' (with active negotiation or pending funding) MUST stay listed!
    return rawStatus === 'open' || rawStatus === 'selected';
}
/**
 * Normalizes any timestamp to epoch milliseconds.
 * If timestamp is in seconds (< 1e11), converts to ms.
 */
export function normalizeTimestampMs(val) {
    if (!val)
        return Date.now();
    const num = typeof val === 'string' ? Number(val) : val;
    if (isNaN(num) || num <= 0)
        return Date.now();
    if (num < 100000000000)
        return num * 1000;
    return num;
}
/**
 * Derives the honest engagement state for a given job.
 */
export function deriveEngagementState(job) {
    if (!job)
        return 'OFFER_SENT';
    if (job.status === 'Completed')
        return 'COMPLETED';
    if (job.status === 'Disputed')
        return 'DISPUTED';
    if (job.status === 'Cancelled')
        return 'CANCELLED';
    const isFundedEvent = (job.events || []).some((e) => e.step === 'Funded' && e.status === 'completed');
    if (job.status === 'Submitted')
        return 'WORK_SUBMITTED';
    if (job.status === 'Funded' || isFundedEvent) {
        if (job.deliverableSubmittedAt || job.proof)
            return 'WORK_SUBMITTED';
        return 'ESCROW_FUNDED';
    }
    // Active negotiation / pre-funding engagement
    if (job.engagement) {
        return job.engagement.state || 'OFFER_SENT';
    }
    if (job.status === 'Selected') {
        if (job.freelancerAgreedTerms && job.clientAgreedTerms) {
            return 'TERMS_AGREED';
        }
        if (job.freelancerAgreedTerms) {
            return 'OFFER_ACCEPTED_BY_FREELANCER';
        }
        return 'OFFER_SENT';
    }
    return 'OFFER_SENT';
}
/**
 * Validates whether a requested job transition is permitted.
 */
export function isValidJobTransition(currentStatus, targetStatus, context) {
    if (currentStatus === targetStatus)
        return { valid: true };
    switch (currentStatus) {
        case 'Draft':
            if (targetStatus === 'Open' || targetStatus === 'Cancelled')
                return { valid: true };
            return { valid: false, reason: 'Draft jobs can only be published to Open or Cancelled' };
        case 'Open':
            if (targetStatus === 'Selected' && context?.hasFreelancer)
                return { valid: true };
            if (targetStatus === 'Cancelled')
                return { valid: true };
            return { valid: false, reason: 'Open jobs can only transition to Selected (with freelancer) or Cancelled' };
        case 'Selected':
            // From Selected, can move to Open (if selection cancelled, offer declined/expired),
            // or to Funded (if escrow deposit confirmed), or Cancelled
            if (targetStatus === 'Open')
                return { valid: true };
            if (targetStatus === 'Funded' && context?.isFunded)
                return { valid: true };
            if (targetStatus === 'Cancelled')
                return { valid: true };
            return { valid: false, reason: 'Selected jobs require confirmed escrow funding to become Funded' };
        case 'Funded':
            if (targetStatus === 'Submitted')
                return { valid: true };
            if (targetStatus === 'Disputed')
                return { valid: true };
            return { valid: false, reason: 'Funded jobs can only transition to Submitted or Disputed' };
        case 'Submitted':
            if (targetStatus === 'Funded')
                return { valid: true }; // revision requested -> back to working
            if (targetStatus === 'Completed')
                return { valid: true }; // approved & paid
            if (targetStatus === 'Disputed')
                return { valid: true };
            return { valid: false, reason: 'Submitted deliverables can be approved (Completed), revised (Funded), or Disputed' };
        case 'Disputed':
            if (targetStatus === 'Completed' || targetStatus === 'Cancelled')
                return { valid: true };
            return { valid: false, reason: 'Disputed jobs can only transition after ruling to Completed or Cancelled' };
        case 'Completed':
        case 'Cancelled':
            return { valid: false, reason: `Cannot transition from terminal state ${currentStatus}` };
        default:
            return { valid: true };
    }
}
export function getEngagementDisplayState(job, transactions, nowMs = Date.now()) {
    const txList = Array.isArray(transactions) ? transactions : [];
    const events = Array.isArray(job?.events) ? job.events : [];
    const hasPendingReleaseTx = txList.some((tx) => (tx.jobId === job?.id || (job?.contractAddress && tx.to?.toLowerCase() === job.contractAddress.toLowerCase())) &&
        (tx.type === 'RELEASE' || tx.type === 'PAYMENT_RELEASED') &&
        (tx.status === 'PENDING' || tx.status === 'SUBMITTED' || tx.status === 'CONFIRMING'));
    const hasConfirmedReleaseTx = txList.some((tx) => (tx.jobId === job?.id || (job?.contractAddress && tx.to?.toLowerCase() === job.contractAddress.toLowerCase())) &&
        (tx.type === 'RELEASE' || tx.type === 'PAYMENT_RELEASED') &&
        tx.status === 'CONFIRMED');
    const hasIndexedReleaseEvent = events.some((e) => (e.step === 'Paid' || e.step === 'PaymentReleased' || e.step === 'AutoReleased' || e.step === 'Completed') &&
        (e.status === 'completed' || e.status === 'CONFIRMED'));
    const isFundedEvent = events.some((e) => (e.step === 'Funded' || e.step === 'EscrowFunded') &&
        (e.status === 'completed' || e.status === 'CONFIRMED'));
    const isConfirmedPaid = hasConfirmedReleaseTx ||
        hasIndexedReleaseEvent ||
        job?.status === 'Completed' ||
        job?.escrowStatus === 'RELEASED' ||
        job?.engagement?.state === 'COMPLETED';
    const isApproved = Boolean(job?.approvedAt || job?.status === 'Approved' || job?.engagement?.state === 'APPROVED');
    // Compute if a modification/revision request is actively pending
    const sortedMods = [...(job?.modificationRequests || [])].sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
    const latestMod = sortedMods[0] || null;
    const sortedSubs = [...(job?.submissions || [])].sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
    const latestSub = sortedSubs[0] || null;
    const isRevisionActive = Boolean(latestMod &&
        !isConfirmedPaid &&
        !isApproved &&
        (!latestSub || (latestMod.requestedAt || 0) > (latestSub.submittedAt || 0)));
    if (hasPendingReleaseTx && !isConfirmedPaid) {
        return {
            state: 'PAYMENT_PENDING',
            displayLabel: 'Payment confirming…',
            isCompleted: false,
            isPaid: false,
            isApproved: true,
            isOverdue: false,
            isLate: false,
            lateByMs: 0,
            remainingMs: 0,
            badgeVariant: 'purple',
            whatHappensNext: {
                client: 'Release transaction is confirming on Polygon PoS. Escrow funds will settle momentarily.',
                freelancer: 'Payment release is confirming on Polygon PoS. Funds will appear in your balance shortly.',
            },
            allowedActions: {
                canSubmit: false,
                canRequestExtension: false,
                canApproveExtension: false,
                canApproveWork: false,
                canRequestRevision: false,
                canOpenDispute: false,
                canCancelOrRefund: false,
                canReleasePayment: false,
            },
        };
    }
    // Terminal Completed State — strictly requires confirmed on-chain release
    if (isConfirmedPaid) {
        return {
            state: 'COMPLETED',
            displayLabel: 'Job Completed & Payment Released',
            isCompleted: true,
            isPaid: true,
            isApproved: true,
            isOverdue: false,
            isLate: false,
            lateByMs: 0,
            remainingMs: 0,
            badgeVariant: 'success',
            whatHappensNext: {
                client: 'Job is complete. Escrow payment was confirmed on Polygon PoS.',
                freelancer: 'Payment released to your wallet. You may view your Soulbound Work Certificate.',
            },
            allowedActions: {
                canSubmit: false,
                canRequestExtension: false,
                canApproveExtension: false,
                canApproveWork: false,
                canRequestRevision: false,
                canOpenDispute: false,
                canCancelOrRefund: false,
                canReleasePayment: false,
            },
        };
    }
    // Cancelled check
    if (job?.status === 'Cancelled' || job?.engagement?.state === 'CANCELLED') {
        return {
            state: 'CANCELLED',
            displayLabel: 'Job Cancelled',
            isCompleted: false,
            isPaid: false,
            isApproved: false,
            isOverdue: false,
            isLate: false,
            lateByMs: 0,
            remainingMs: 0,
            badgeVariant: 'secondary',
            whatHappensNext: {
                client: 'This job was cancelled. Any deposited escrow funds were returned to your wallet.',
                freelancer: 'This job was cancelled.',
            },
            allowedActions: {
                canSubmit: false,
                canRequestExtension: false,
                canApproveExtension: false,
                canApproveWork: false,
                canRequestRevision: false,
                canOpenDispute: false,
                canCancelOrRefund: false,
                canReleasePayment: false,
            },
        };
    }
    // Disputed check
    if (job?.status === 'Disputed' || job?.engagement?.state === 'DISPUTED') {
        return {
            state: 'DISPUTED',
            displayLabel: 'Dispute in Arbitration',
            isCompleted: false,
            isPaid: false,
            isApproved: false,
            isOverdue: false,
            isLate: false,
            lateByMs: 0,
            remainingMs: 0,
            badgeVariant: 'destructive',
            whatHappensNext: {
                client: 'Dispute is open. PolyLance JudgeDAO arbitration is assessing evidence.',
                freelancer: 'Dispute is open. Provide your evidence and details in the dispute room.',
            },
            allowedActions: {
                canSubmit: false,
                canRequestExtension: false,
                canApproveExtension: false,
                canApproveWork: false,
                canRequestRevision: false,
                canOpenDispute: false,
                canCancelOrRefund: false,
                canReleasePayment: false,
            },
        };
    }
    const hasSubmission = Boolean(job?.deliverableSubmittedAt ||
        job?.proof ||
        job?.status === 'Submitted' ||
        job?.engagement?.state === 'WORK_SUBMITTED');
    const submissionTime = normalizeTimestampMs(job?.deliverableSubmittedAt || job?.submittedAt || (hasSubmission ? job?.updatedAt : null));
    const deadlineMs = job?.deadlineTimestamp
        ? normalizeTimestampMs(job.deadlineTimestamp)
        : (job?.deadlineDays && job?.fundedAt
            ? normalizeTimestampMs(job.fundedAt) + job.deadlineDays * 86400000
            : (job?.durationDays && job?.fundedAt
                ? normalizeTimestampMs(job.fundedAt) + job.durationDays * 86400000
                : null));
    const isLate = Boolean(hasSubmission && deadlineMs && submissionTime > deadlineMs);
    const lateByMs = isLate && deadlineMs ? Math.max(0, submissionTime - deadlineMs) : 0;
    const isOverdue = Boolean(!hasSubmission && deadlineMs && nowMs > deadlineMs);
    const remainingMs = deadlineMs ? Math.max(0, deadlineMs - nowMs) : 0;
    if (isApproved) {
        return {
            state: 'APPROVED',
            displayLabel: 'Approved — Payment Release Pending',
            isCompleted: false,
            isPaid: false,
            isApproved: true,
            isOverdue: false,
            isLate,
            lateByMs,
            remainingMs: 0,
            badgeVariant: 'purple',
            whatHappensNext: {
                client: 'Work approved. Payment release transaction is awaiting final on-chain confirmation.',
                freelancer: 'Client approved your work. Payment release transaction is confirming on Polygon.',
            },
            allowedActions: {
                canSubmit: false,
                canRequestExtension: false,
                canApproveExtension: false,
                canApproveWork: false,
                canRequestRevision: false,
                canOpenDispute: false,
                canCancelOrRefund: false,
                canReleasePayment: true,
            },
        };
    }
    const reviewWindowMs = job?.reviewWindowDays
        ? job.reviewWindowDays * 86400000
        : 7 * 86400000;
    const reviewEndMs = hasSubmission && submissionTime ? submissionTime + reviewWindowMs : null;
    const isReviewWindowEnded = Boolean(hasSubmission && reviewEndMs && nowMs > reviewEndMs);
    if (hasSubmission) {
        if (isReviewWindowEnded) {
            return {
                state: 'REVIEW_WINDOW_ENDED',
                displayLabel: isLate ? 'Review Window Ended (Late Submission)' : 'Review Window Ended — Action Required',
                isCompleted: false,
                isPaid: false,
                isApproved: false,
                isOverdue: false,
                isLate,
                lateByMs,
                remainingMs: 0,
                badgeVariant: 'warning',
                whatHappensNext: {
                    client: 'Review window has ended. Please approve the work, request revisions, or open a dispute.',
                    freelancer: 'Review window ended with no client action. You may request release or open dispute.',
                },
                allowedActions: {
                    canSubmit: false,
                    canRequestExtension: false,
                    canApproveExtension: false,
                    canApproveWork: true,
                    canRequestRevision: true,
                    canOpenDispute: true,
                    canCancelOrRefund: false,
                    canReleasePayment: false,
                },
            };
        }
        return {
            state: isLate ? 'SUBMITTED_LATE' : 'UNDER_REVIEW',
            displayLabel: isLate ? 'Submitted Late — Under Review' : 'Work Submitted — Under Review',
            isCompleted: false,
            isPaid: false,
            isApproved: false,
            isOverdue: false,
            isLate,
            lateByMs,
            remainingMs: reviewEndMs ? Math.max(0, reviewEndMs - nowMs) : 0,
            badgeVariant: isLate ? 'warning' : 'purple',
            whatHappensNext: {
                client: isLate
                    ? 'Freelancer submitted deliverables after the agreed deadline. Review the work and decide whether to approve, request revision, or dispute.'
                    : 'Freelancer submitted work deliverables. Review submissions and approve or request revisions.',
                freelancer: 'Deliverables submitted. Waiting for client review and approval.',
            },
            allowedActions: {
                canSubmit: false,
                canRequestExtension: false,
                canApproveExtension: false,
                canApproveWork: true,
                canRequestRevision: true,
                canOpenDispute: true,
                canCancelOrRefund: false,
                canReleasePayment: false,
            },
        };
    }
    const isFunded = job?.status === 'Funded' || isFundedEvent;
    if (isFunded) {
        const gracePeriodMs = 48 * 3600000;
        const isGraceEnded = Boolean(deadlineMs && nowMs > deadlineMs + gracePeriodMs);
        if (isGraceEnded) {
            return {
                state: 'EXPIRED_NO_SUBMISSION',
                displayLabel: 'Deadline Expired (No Submission)',
                isCompleted: false,
                isPaid: false,
                isApproved: false,
                isOverdue: true,
                isLate: false,
                lateByMs: 0,
                remainingMs: 0,
                badgeVariant: 'destructive',
                whatHappensNext: {
                    client: 'Delivery deadline and grace period ended with no submission. You may extend, keep waiting, request refund review, or open a dispute.',
                    freelancer: 'Delivery deadline and grace period have expired. You may still submit work if the client has not cancelled or refunded.',
                },
                allowedActions: {
                    canSubmit: true,
                    canRequestExtension: true,
                    canApproveExtension: false,
                    canApproveWork: false,
                    canRequestRevision: false,
                    canOpenDispute: true,
                    canCancelOrRefund: true,
                    canReleasePayment: false,
                },
            };
        }
        if (isOverdue) {
            return {
                state: 'OVERDUE',
                displayLabel: 'Overdue (Grace Period Active)',
                isCompleted: false,
                isPaid: false,
                isApproved: false,
                isOverdue: true,
                isLate: false,
                lateByMs: 0,
                remainingMs: 0,
                badgeVariant: 'destructive',
                whatHappensNext: {
                    client: 'Agreed delivery deadline has passed with no submission. A 48-hour grace period is active.',
                    freelancer: 'Agreed delivery deadline has passed. Submit your deliverables now or request an extension.',
                },
                allowedActions: {
                    canSubmit: true,
                    canRequestExtension: true,
                    canApproveExtension: false,
                    canApproveWork: false,
                    canRequestRevision: false,
                    canOpenDispute: true,
                    canCancelOrRefund: false,
                    canReleasePayment: false,
                },
            };
        }
        const isDueSoon = Boolean(deadlineMs && remainingMs <= 72 * 3600000 && remainingMs > 0);
        if (isDueSoon) {
            return {
                state: 'DUE_SOON',
                displayLabel: 'Due Soon',
                isCompleted: false,
                isPaid: false,
                isApproved: false,
                isOverdue: false,
                isLate: false,
                lateByMs: 0,
                remainingMs,
                badgeVariant: 'warning',
                whatHappensNext: {
                    client: 'Work delivery deadline is approaching.',
                    freelancer: 'Work delivery deadline is approaching. Submit deliverables or request a deadline extension.',
                },
                allowedActions: {
                    canSubmit: true,
                    canRequestExtension: true,
                    canApproveExtension: false,
                    canApproveWork: false,
                    canRequestRevision: false,
                    canOpenDispute: false,
                    canCancelOrRefund: false,
                    canReleasePayment: false,
                },
            };
        }
        return {
            state: 'IN_PROGRESS',
            displayLabel: 'In Progress',
            isCompleted: false,
            isPaid: false,
            isApproved: false,
            isOverdue: false,
            isLate: false,
            lateByMs: 0,
            remainingMs,
            badgeVariant: 'default',
            whatHappensNext: {
                client: 'Escrow is locked on Polygon PoS. Freelancer is working on your project.',
                freelancer: 'Escrow is safely locked. Work on your deliverables and submit before deadline.',
            },
            allowedActions: {
                canSubmit: true,
                canRequestExtension: true,
                canApproveExtension: false,
                canApproveWork: false,
                canRequestRevision: false,
                canOpenDispute: false,
                canCancelOrRefund: false,
                canReleasePayment: false,
            },
        };
    }
    return {
        state: deriveEngagementState(job),
        displayLabel: job?.status || 'Open',
        isCompleted: false,
        isPaid: false,
        isApproved: false,
        isOverdue: false,
        isLate: false,
        lateByMs: 0,
        remainingMs: 0,
        badgeVariant: 'secondary',
        whatHappensNext: {
            client: 'Select a freelancer and agree on terms to lock escrow.',
            freelancer: 'Submit a proposal or agree to terms to begin work.',
        },
        allowedActions: {
            canSubmit: false,
            canRequestExtension: false,
            canApproveExtension: false,
            canApproveWork: false,
            canRequestRevision: false,
            canOpenDispute: false,
            canCancelOrRefund: job?.status === 'Selected',
            canReleasePayment: false,
        },
    };
}
