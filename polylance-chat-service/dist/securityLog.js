/**
 * Redacts tokens, OAuth secrets, session cookies, and private key values before writing to logs.
 */
export function redactSecretsForLog(input) {
    const raw = input instanceof Error
        ? `${input.name}: ${input.message}`
        : typeof input === 'string'
            ? input
            : (() => {
                try {
                    return JSON.stringify(input);
                }
                catch {
                    return String(input);
                }
            })();
    return raw
        .replace(/(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, '$1[REDACTED]')
        .replace(/\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]+\b/g, '[REDACTED_GITHUB_TOKEN]')
        .replace(/\b(access_token|refresh_token|client_secret|session_secret|polylance_session|private_?key|api_?key|password)\b\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,&}]+)/gi, '$1=[REDACTED]');
}
