import { ethers } from "ethers";
export function normalizeAddress(addr) {
    if (!addr)
        return "";
    const trimmed = addr.trim().toLowerCase();
    try {
        return ethers.getAddress(trimmed);
    }
    catch {
        return trimmed;
    }
}
export function areAddressesEqual(a, b) {
    if (!a || !b)
        return false;
    return normalizeAddress(a) === normalizeAddress(b);
}
export function canApplyToJob(user, job) {
    if (!job) {
        return { allowed: false, reason: "JOB_CLOSED", message: "Job not found" };
    }
    if (!user || !user.address) {
        return {
            allowed: false,
            reason: "NOT_CONNECTED",
            message: "Connect wallet to apply",
        };
    }
    // Owner cannot apply to their own job
    if (areAddressesEqual(user.address, job.client)) {
        return {
            allowed: false,
            reason: "OWN_JOB",
            message: "You cannot apply to your own job",
        };
    }
    // Job must be open
    if (job.status !== "Open") {
        return {
            allowed: false,
            reason: "JOB_CLOSED",
            message: "Job is not open for applications",
        };
    }
    // Duplicate check
    const alreadyApplied = (job.applications || []).some((app) => areAddressesEqual(app.applicant, user.address));
    if (alreadyApplied) {
        return {
            allowed: false,
            reason: "ALREADY_APPLIED",
            message: "Already applied for this job",
        };
    }
    // Client-only mode check
    if (user.accountMode === "client") {
        return {
            allowed: false,
            reason: "CLIENT_ONLY_MODE",
            message: "Client-only accounts cannot apply to jobs. Switch to freelancer or both mode in settings.",
        };
    }
    return { allowed: true };
}
/**
 * Server guard: Checks whether the given account mode allows the specified role.
 * 'freelancer' role allowed by: 'freelancer' | 'both'
 * 'client' role allowed by: 'client' | 'both'
 */
export function isModeAllowedForRole(userMode, requiredRole) {
    const mode = userMode || "both";
    if (mode === "both")
        return true;
    return mode === requiredRole;
}
