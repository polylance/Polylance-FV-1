const REQUIRED_ENV_VARS = [
  "AUDITX_API_URL",
  "AUDITX_API_KEY",
  "AUDITX_WEBHOOK_SECRET",
] as const;

export function validateAuditXConfig() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // Loud, not silent — a monitoring integration that's quietly
    // disabled because of a missing env var is worse than the app
    // refusing to start, since nobody would notice until an incident
    throw new Error(
      `AuditX monitoring misconfigured — missing: ${missing.join(", ")}. ` +
        `Jobs will deploy WITHOUT security monitoring if this isn't fixed.`
    );
  }
}
