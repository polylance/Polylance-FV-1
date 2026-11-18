/**
 * PolyLance Centralized Deadline, Review Window, and Liveness Configuration
 * All time calculations are in UTC epoch milliseconds.
 */
export const DEADLINE_CONFIG = {
    // Approaching deadline alert intervals before deadline
    DUE_SOON_THRESHOLDS_MS: [
        72 * 60 * 60 * 1000, // 72 hours
        24 * 60 * 60 * 1000, // 24 hours
        2 * 60 * 60 * 1000, // 2 hours
    ],
    // Grace period after deadline passes before EXPIRED_NO_SUBMISSION
    GRACE_PERIOD_MS: 48 * 60 * 60 * 1000, // 48 hours
    // Default client review window if not configured on job (7 days)
    DEFAULT_REVIEW_WINDOW_MS: 7 * 24 * 60 * 60 * 1000,
    // Client review reminder milestones (fractions of review window)
    REVIEW_REMINDER_FRACTIONS: [0.5, 0.8, 0.95],
    // Final warnings remaining time
    REVIEW_FINAL_WARNINGS_MS: [
        48 * 60 * 60 * 1000, // 48 hours remaining
        24 * 60 * 60 * 1000, // 24 hours remaining
        2 * 60 * 60 * 1000, // 2 hours remaining
    ],
    // Hard safety flags: NO automatic movement of escrow funds without governance approval
    AUTO_RELEASE_ENABLED: false,
    AUTO_REFUND_ENABLED: false,
    // Maximum number of deadline extensions allowed per job
    MAX_EXTENSIONS: 2,
    // Extension duration limit (max days for a single extension request)
    MAX_EXTENSION_DAYS: 14,
    // Stalled watchdog threshold: non-terminal state without update
    STALLED_INACTIVITY_MS: 14 * 24 * 60 * 60 * 1000, // 14 days
    // Abandoned engagement fallback to admin review
    ABANDONED_TIMEOUT_MS: 60 * 24 * 60 * 60 * 1000, // 60 days
    // Rate limit for deadline extension requests (e.g. 1 per 24 hours)
    EXTENSION_REQUEST_COOLDOWN_MS: 24 * 60 * 60 * 1000,
};
