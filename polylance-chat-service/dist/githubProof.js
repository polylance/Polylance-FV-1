import crypto from 'crypto';
/**
 * Minimum GitHub OAuth scope:
 * Uses `read:user` ONLY to read public user id/login.
 * Explicitly excludes `user:email` and `repo` (no email, phone, or private repository access).
 */
export const GITHUB_PROOF_MIN_SCOPE = 'read:user';
export const GITHUB_REFRESH_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
function getStateSigningSecret() {
    const secret = (process.env.GITHUB_STATE_SECRET ||
        process.env.SESSION_SECRET ||
        'polylance-crypto-session-secret-2026-strict-key-secure').trim();
    return secret;
}
export function getGithubOAuthCredentials() {
    return {
        clientId: (process.env.GITHUB_CLIENT_ID || '').trim(),
        clientSecret: (process.env.GITHUB_CLIENT_SECRET || '').trim(),
    };
}
export function signGithubProofState(wallet, redirectUrl) {
    const payload = {
        wallet: wallet.toLowerCase().trim(),
        redirectUrl: redirectUrl || '/',
        nonce: crypto.randomBytes(16).toString('hex'),
        issuedAt: Date.now(),
    };
    const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
    const sig = crypto
        .createHmac('sha256', getStateSigningSecret())
        .update(encoded)
        .digest('base64url');
    return `${encoded}.${sig}`;
}
export function verifyGithubProofState(token, maxAgeMs = OAUTH_STATE_TTL_MS) {
    if (!token || !token.includes('.')) {
        return { valid: false, reason: 'Malformed OAuth state parameter' };
    }
    const [encoded, providedSig] = token.split('.');
    if (!encoded || !providedSig) {
        return { valid: false, reason: 'Incomplete OAuth state parameter' };
    }
    const expectedSig = crypto
        .createHmac('sha256', getStateSigningSecret())
        .update(encoded)
        .digest('base64url');
    const a = Buffer.from(providedSig, 'utf-8');
    const b = Buffer.from(expectedSig, 'utf-8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return { valid: false, reason: 'Invalid OAuth state signature' };
    }
    try {
        const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
        if (!payload.wallet || !/^0x[a-fA-F0-9]{40}$/.test(payload.wallet)) {
            return { valid: false, reason: 'Invalid wallet address inside OAuth state' };
        }
        if (!payload.issuedAt || Date.now() - payload.issuedAt > maxAgeMs) {
            return { valid: false, reason: 'Expired OAuth state parameter' };
        }
        return { valid: true, payload };
    }
    catch {
        return { valid: false, reason: 'Unreadable OAuth state payload' };
    }
}
export function buildGithubStatsSnapshot(params) {
    const langCounts = new Map();
    let totalStars = 0;
    for (const repo of Array.isArray(params.repos) ? params.repos : []) {
        if (!repo || repo.private)
            continue;
        totalStars += Number(repo.stargazers_count) || 0;
        if (!repo.fork && typeof repo.language === 'string' && repo.language.trim()) {
            const lang = repo.language.trim();
            langCounts.set(lang, (langCounts.get(lang) || 0) + 1);
        }
    }
    const totalTypedRepos = Array.from(langCounts.values()).reduce((sum, n) => sum + n, 0) || 1;
    const topLanguages = Array.from(langCounts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 5)
        .map(([language, repos]) => ({
        language,
        repos,
        sharePercent: Number(((repos / totalTypedRepos) * 100).toFixed(1)),
    }));
    const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let events30d = 0;
    let pushEvents30d = 0;
    let lastEventAt = null;
    for (const ev of Array.isArray(params.publicEvents) ? params.publicEvents : []) {
        if (!ev || !ev.created_at)
            continue;
        const evMs = Date.parse(ev.created_at);
        if (Number.isNaN(evMs))
            continue;
        if (!lastEventAt || evMs > Date.parse(lastEventAt)) {
            lastEventAt = new Date(evMs).toISOString();
        }
        if (evMs >= cutoffMs) {
            events30d += 1;
            if (ev.type === 'PushEvent') {
                pushEvents30d += 1;
            }
        }
    }
    return {
        public_repos: Math.max(0, Number(params.publicReposCount) || 0),
        top_languages: topLanguages,
        stars: Math.max(0, totalStars),
        recent_activity: {
            events_30d: events30d,
            push_events_30d: pushEvents30d,
            last_event_at: lastEventAt,
        },
    };
}
/**
 * Fetches ONLY public GitHub stats (repos + public events).
 * Never fetches private repos, user emails, or phone numbers.
 */
export async function fetchPublicGithubStats(githubLogin, ephemeralToken) {
    const safeLogin = encodeURIComponent(githubLogin.trim());
    const headers = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'PolyLance-Proof-Verifier',
    };
    if (ephemeralToken) {
        headers.Authorization = `Bearer ${ephemeralToken}`;
    }
    const [userRes, reposRes, eventsRes] = await Promise.all([
        fetch(`https://api.github.com/users/${safeLogin}`, { headers }),
        fetch(`https://api.github.com/users/${safeLogin}/repos?per_page=100&type=owner&sort=updated`, { headers }),
        fetch(`https://api.github.com/users/${safeLogin}/events/public?per_page=30`, { headers }),
    ]);
    if (!userRes.ok) {
        const err = new Error(`GitHub public profile lookup failed (HTTP ${userRes.status})`);
        err.statusCode = userRes.status === 404 ? 404 : 502;
        err.code = 'GITHUB_UPSTREAM_ERROR';
        throw err;
    }
    const publicUser = await userRes.json();
    const repos = reposRes.ok ? await reposRes.json() : [];
    const events = eventsRes.ok ? await eventsRes.json() : [];
    const publicReposCount = Number(publicUser?.public_repos) || 0;
    return {
        publicReposCount,
        stats: buildGithubStatsSnapshot({ publicReposCount, repos, publicEvents: events }),
    };
}
function findGithubSybilConflict(sharedState, walletAddress, githubId, githubLogin) {
    const cleanWallet = walletAddress.toLowerCase().trim();
    const cleanLogin = githubLogin.toLowerCase().trim();
    const proofs = sharedState?.githubProofs || {};
    for (const [ownerWallet, proof] of Object.entries(proofs)) {
        if (ownerWallet.toLowerCase().trim() === cleanWallet || !proof)
            continue;
        if (String(proof.github_id || '') === githubId ||
            String(proof.github_login || '').toLowerCase().trim() === cleanLogin) {
            return ownerWallet;
        }
    }
    const profiles = sharedState?.profiles || {};
    for (const [ownerWallet, profile] of Object.entries(profiles)) {
        if (ownerWallet.toLowerCase().trim() === cleanWallet || !profile || !profile.githubVerified)
            continue;
        const pId = profile.githubId ? String(profile.githubId) : '';
        const pLogin = String(profile.githubUsername || '').toLowerCase().trim();
        if ((pId && pId === githubId) || (pLogin && pLogin === cleanLogin)) {
            return ownerWallet;
        }
    }
    return null;
}
async function persistGithubProofRecord(walletAddress, record, sharedState, prisma) {
    if (!sharedState.githubProofs)
        sharedState.githubProofs = {};
    sharedState.githubProofs[walletAddress] = record;
    if (!sharedState.profiles)
        sharedState.profiles = {};
    const existingProfile = sharedState.profiles[walletAddress] || { address: walletAddress };
    // Never store email, phone, or access tokens on profile
    const { email: _ignoredEmail, phone: _ignoredPhone, accessToken: _ignoredToken, ...cleanProfile } = existingProfile;
    sharedState.profiles[walletAddress] = {
        ...cleanProfile,
        address: walletAddress,
        githubVerified: true,
        githubUsername: record.github_login,
        githubId: record.github_id,
        reposCount: record.stats.public_repos,
    };
    if (prisma?.githubProof) {
        try {
            await prisma.githubProof.upsert({
                where: { walletAddress },
                update: {
                    githubId: record.github_id,
                    githubLogin: record.github_login,
                    statsSnapshot: record.stats,
                    lastSyncedAt: new Date(record.last_synced_at),
                },
                create: {
                    walletAddress,
                    githubId: record.github_id,
                    githubLogin: record.github_login,
                    statsSnapshot: record.stats,
                    lastSyncedAt: new Date(record.last_synced_at),
                },
            });
        }
        catch (err) {
            console.warn('[DB] GithubProof upsert notice:', err);
        }
    }
}
export async function connectGithubProofWithSingleUseToken(params) {
    const { clientId, clientSecret } = getGithubOAuthCredentials();
    if (!clientId || !clientSecret) {
        const err = new Error('GitHub OAuth credentials are not configured on this server');
        err.statusCode = 503;
        err.code = 'GITHUB_OAUTH_UNCONFIGURED';
        throw err;
    }
    const cleanWallet = params.walletAddress.toLowerCase().trim();
    // 1. Exchange code for short-lived OAuth token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'PolyLance-Proof-Verifier',
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: params.code,
            ...(params.redirectUri ? { redirect_uri: params.redirectUri } : {}),
        }),
    });
    const tokenData = await tokenRes.json();
    const singleUseToken = typeof tokenData?.access_token === 'string' ? tokenData.access_token : '';
    if (!singleUseToken) {
        const err = new Error(tokenData?.error_description || tokenData?.error || 'GitHub token exchange failed');
        err.statusCode = 400;
        err.code = 'GITHUB_CODE_INVALID';
        throw err;
    }
    // 2. Use token once to prove ownership of github_id + github_login, read public stats, and discard token
    const identityRes = await fetch('https://api.github.com/user', {
        headers: {
            Authorization: `Bearer ${singleUseToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'PolyLance-Proof-Verifier',
        },
    });
    if (!identityRes.ok) {
        const err = new Error(`GitHub identity verification failed (HTTP ${identityRes.status})`);
        err.statusCode = 502;
        err.code = 'GITHUB_IDENTITY_FAILED';
        throw err;
    }
    const ghIdentity = await identityRes.json();
    const githubId = String(ghIdentity?.id || '').trim();
    const githubLogin = String(ghIdentity?.login || '').trim();
    if (!githubId || !githubLogin) {
        const err = new Error('GitHub response omitted required public id or login');
        err.statusCode = 502;
        err.code = 'GITHUB_IDENTITY_INCOMPLETE';
        throw err;
    }
    const conflictWallet = findGithubSybilConflict(params.sharedState, cleanWallet, githubId, githubLogin);
    if (conflictWallet) {
        const err = new Error('This GitHub account is already connected to another wallet');
        err.statusCode = 409;
        err.code = 'DUPLICATE_GITHUB_ACCOUNT';
        throw err;
    }
    const { stats } = await fetchPublicGithubStats(githubLogin, singleUseToken);
    // `singleUseToken` goes out of scope immediately below and is never stored or returned
    const record = {
        github_id: githubId,
        github_login: githubLogin,
        stats,
        last_synced_at: new Date().toISOString(),
    };
    await persistGithubProofRecord(cleanWallet, record, params.sharedState, params.prisma);
    if (params.persistState) {
        await params.persistState();
    }
    return record;
}
export async function refreshGithubProofSnapshot(params) {
    const cleanWallet = params.walletAddress.toLowerCase().trim();
    const cooldownMs = params.cooldownMs ?? GITHUB_REFRESH_COOLDOWN_MS;
    const existing = getStoredGithubProof(cleanWallet, params.sharedState);
    if (!existing) {
        const err = new Error('No GitHub proof connected for this wallet');
        err.statusCode = 404;
        err.code = 'GITHUB_PROOF_NOT_CONNECTED';
        throw err;
    }
    const lastSyncMs = Date.parse(existing.last_synced_at || '');
    if (!Number.isNaN(lastSyncMs)) {
        const elapsedMs = Date.now() - lastSyncMs;
        if (elapsedMs < cooldownMs) {
            const remainingMs = cooldownMs - elapsedMs;
            const err = new Error('GitHub stats refresh cooldown active');
            err.statusCode = 429;
            err.code = 'REFRESH_COOLDOWN_ACTIVE';
            err.retryAfterSeconds = Math.ceil(remainingMs / 1000);
            err.nextRefreshAt = new Date(lastSyncMs + cooldownMs).toISOString();
            throw err;
        }
    }
    const { stats } = await fetchPublicGithubStats(existing.github_login);
    const updated = {
        github_id: existing.github_id,
        github_login: existing.github_login,
        stats,
        last_synced_at: new Date().toISOString(),
    };
    await persistGithubProofRecord(cleanWallet, updated, params.sharedState, params.prisma);
    if (params.persistState) {
        await params.persistState();
    }
    return updated;
}
export function getStoredGithubProof(walletAddress, sharedState) {
    const cleanWallet = walletAddress.toLowerCase().trim();
    const direct = sharedState?.githubProofs?.[cleanWallet];
    if (direct && direct.github_id && direct.github_login) {
        return {
            github_id: String(direct.github_id),
            github_login: String(direct.github_login),
            stats: direct.stats,
            last_synced_at: direct.last_synced_at,
        };
    }
    return null;
}
export async function disconnectGithubProof(params) {
    const cleanWallet = params.walletAddress.toLowerCase().trim();
    const existed = Boolean(params.sharedState?.githubProofs?.[cleanWallet]);
    if (params.sharedState?.githubProofs) {
        delete params.sharedState.githubProofs[cleanWallet];
    }
    const prof = params.sharedState?.profiles?.[cleanWallet];
    if (prof) {
        delete prof.githubVerified;
        delete prof.githubUsername;
        delete prof.githubId;
        delete prof.attestationUID;
        delete prof.reposCount;
        delete prof.followersCount;
        delete prof.githubHtmlUrl;
        delete prof.reputationTier;
    }
    if (params.prisma?.githubProof) {
        try {
            await params.prisma.githubProof.deleteMany({ where: { walletAddress: cleanWallet } });
        }
        catch (err) {
            console.warn('[DB] GithubProof delete notice:', err);
        }
    }
    if (params.persistState) {
        await params.persistState();
    }
    return { disconnected: existed || Boolean(prof) };
}
