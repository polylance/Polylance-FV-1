import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import { TAXONOMY_CATEGORIES, LEGACY_CATEGORY_MAP, findTaxonomyCategory, findTaxonomySubcategory, } from './taxonomy.js';
export const MAX_PORTFOLIO_LINKS = 5;
export const MAX_PORTFOLIO_TITLE_LEN = 100;
export const MAX_PORTFOLIO_ROLE_LEN = 60;
export const MAX_PORTFOLIO_URL_LEN = 500;
function stripPlainText(input) {
    if (typeof input !== 'string')
        return '';
    return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
        .replace(/\s+/g, ' ')
        .trim();
}
function isPrivateOrDisallowedHost(rawHost) {
    const host = rawHost.toLowerCase().trim().replace(/\.$/, '');
    if (!host || !host.includes('.'))
        return true;
    if (host === 'localhost' ||
        host.endsWith('.localhost') ||
        host.endsWith('.local') ||
        host.endsWith('.internal') ||
        host.endsWith('.arpa')) {
        return true;
    }
    // IPv6 literals or loopback/ULA ranges
    if (host.startsWith('[') || host.includes(':')) {
        return true;
    }
    // IPv4 literal checks (loopback, RFC1918, link-local / cloud metadata 169.254.169.254, CGNAT, 0.0.0.0)
    const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
    if (ipv4Match) {
        const [, aStr, bStr] = ipv4Match;
        const a = Number(aStr);
        const b = Number(bStr);
        if (a === 0 ||
            a === 10 ||
            a === 127 ||
            (a === 100 && b >= 64 && b <= 127) ||
            (a === 169 && b === 254) ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && b === 168) ||
            a >= 224) {
            return true;
        }
    }
    return false;
}
/**
 * Pure syntactic SSRF-safe URL validator:
 * - Never makes any outbound HTTP/DNS request from the server
 * - Requires HTTPS public domain URLs with zero embedded credentials
 */
export function validateSafePortfolioUrl(rawUrl) {
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
        return { valid: false, code: 'INVALID_PORTFOLIO_URL', message: 'Portfolio link URL is required' };
    }
    const trimmed = rawUrl.trim();
    if (trimmed.length > MAX_PORTFOLIO_URL_LEN) {
        return {
            valid: false,
            code: 'INVALID_PORTFOLIO_URL',
            message: `Portfolio URL exceeds ${MAX_PORTFOLIO_URL_LEN} characters`,
        };
    }
    let parsed;
    try {
        parsed = new URL(trimmed);
    }
    catch {
        return { valid: false, code: 'INVALID_PORTFOLIO_URL', message: 'Malformed portfolio URL' };
    }
    if (parsed.protocol !== 'https:') {
        return {
            valid: false,
            code: 'UNSAFE_PORTFOLIO_URL',
            message: 'Portfolio URLs must use https://',
        };
    }
    if (parsed.username || parsed.password) {
        return {
            valid: false,
            code: 'UNSAFE_PORTFOLIO_URL',
            message: 'Portfolio URLs must not contain embedded credentials',
        };
    }
    if (isPrivateOrDisallowedHost(parsed.hostname)) {
        return {
            valid: false,
            code: 'UNSAFE_PORTFOLIO_URL',
            message: 'Portfolio URL host must be a public domain',
        };
    }
    return { valid: true, normalizedUrl: parsed.toString() };
}
export function resolvePortfolioCategoryTag(rawTag) {
    const tag = stripPlainText(rawTag);
    if (!tag)
        return null;
    const directCat = findTaxonomyCategory(tag);
    if (directCat)
        return directCat.id;
    const legacy = LEGACY_CATEGORY_MAP[tag.toLowerCase()];
    if (legacy)
        return legacy.categoryId;
    for (const cat of TAXONOMY_CATEGORIES) {
        const sub = findTaxonomySubcategory(cat, tag);
        if (sub)
            return sub.id;
    }
    return null;
}
export function validateSinglePortfolioLink(rawItem, existingCreatedAt) {
    if (!rawItem || typeof rawItem !== 'object') {
        return {
            valid: false,
            errorCode: 'INVALID_PORTFOLIO_PAYLOAD',
            errorMessage: 'Portfolio entry must be an object',
        };
    }
    const title = stripPlainText(rawItem.title);
    if (!title || title.length > MAX_PORTFOLIO_TITLE_LEN) {
        return {
            valid: false,
            errorCode: 'INVALID_PORTFOLIO_TITLE',
            errorMessage: `Title is required and must be at most ${MAX_PORTFOLIO_TITLE_LEN} characters`,
        };
    }
    const urlCheck = validateSafePortfolioUrl(rawItem.url);
    if (!urlCheck.valid || !urlCheck.normalizedUrl) {
        return {
            valid: false,
            errorCode: urlCheck.code || 'INVALID_PORTFOLIO_URL',
            errorMessage: urlCheck.message || 'Invalid portfolio URL',
        };
    }
    const role = stripPlainText(rawItem.role);
    if (!role || role.length > MAX_PORTFOLIO_ROLE_LEN) {
        return {
            valid: false,
            errorCode: 'INVALID_PORTFOLIO_ROLE',
            errorMessage: `Role is required and must be at most ${MAX_PORTFOLIO_ROLE_LEN} characters`,
        };
    }
    const resolvedTag = resolvePortfolioCategoryTag(rawItem.category_tag ?? rawItem.categoryTag);
    if (!resolvedTag) {
        return {
            valid: false,
            errorCode: 'INVALID_CATEGORY_TAG',
            errorMessage: 'category_tag must match a valid PolyLance category or subcategory ID/slug',
        };
    }
    const nowIso = new Date().toISOString();
    const id = typeof rawItem.id === 'string' && /^[a-zA-Z0-9_-]{4,64}$/.test(rawItem.id.trim())
        ? rawItem.id.trim()
        : `pf_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    return {
        valid: true,
        item: {
            id,
            title,
            url: urlCheck.normalizedUrl,
            role,
            category_tag: resolvedTag,
            created_at: existingCreatedAt || (typeof rawItem.created_at === 'string' ? rawItem.created_at : nowIso),
            updated_at: nowIso,
        },
    };
}
export function validatePortfolioLinksList(rawList) {
    if (!Array.isArray(rawList)) {
        return {
            valid: false,
            errorCode: 'INVALID_PORTFOLIO_PAYLOAD',
            errorMessage: 'Portfolio links must be provided as an array',
            links: [],
        };
    }
    if (rawList.length > MAX_PORTFOLIO_LINKS) {
        return {
            valid: false,
            errorCode: 'MAX_PORTFOLIO_LINKS_EXCEEDED',
            errorMessage: `A maximum of ${MAX_PORTFOLIO_LINKS} portfolio links is allowed per profile`,
            links: [],
        };
    }
    const seenUrls = new Set();
    const normalized = [];
    for (const raw of rawList) {
        const res = validateSinglePortfolioLink(raw);
        if (!res.valid || !res.item) {
            return {
                valid: false,
                errorCode: res.errorCode,
                errorMessage: res.errorMessage,
                links: [],
            };
        }
        const canonicalUrlKey = res.item.url.toLowerCase();
        if (seenUrls.has(canonicalUrlKey)) {
            return {
                valid: false,
                errorCode: 'DUPLICATE_PORTFOLIO_URL',
                errorMessage: 'Duplicate portfolio URL in submission',
                links: [],
            };
        }
        seenUrls.add(canonicalUrlKey);
        normalized.push(res.item);
    }
    return { valid: true, links: normalized };
}
export function getStoredPortfolioLinks(walletAddress, sharedState) {
    const cleanWallet = walletAddress.toLowerCase().trim();
    const direct = sharedState?.portfolioLinks?.[cleanWallet];
    if (Array.isArray(direct))
        return direct;
    const fromProfile = sharedState?.profiles?.[cleanWallet]?.portfolioLinks;
    return Array.isArray(fromProfile) ? fromProfile : [];
}
async function savePortfolioLinksState(walletAddress, links, sharedState, prisma) {
    if (!sharedState.portfolioLinks)
        sharedState.portfolioLinks = {};
    sharedState.portfolioLinks[walletAddress] = links;
    if (!sharedState.profiles)
        sharedState.profiles = {};
    const existingProfile = sharedState.profiles[walletAddress] || { address: walletAddress };
    sharedState.profiles[walletAddress] = {
        ...existingProfile,
        address: walletAddress,
        portfolioLinks: links,
    };
    if (prisma?.portfolioLink) {
        try {
            await prisma.portfolioLink.deleteMany({ where: { walletAddress } });
            if (links.length > 0) {
                await prisma.portfolioLink.createMany({
                    data: links.map((item, position) => ({
                        id: item.id,
                        walletAddress,
                        title: item.title,
                        url: item.url,
                        role: item.role,
                        categoryTag: item.category_tag,
                        position,
                    })),
                });
            }
        }
        catch (err) {
            console.warn('[DB] PortfolioLink sync notice:', err);
        }
    }
}
export async function replacePortfolioLinks(params) {
    const cleanWallet = params.walletAddress.toLowerCase().trim();
    const validated = validatePortfolioLinksList(params.items);
    if (!validated.valid)
        return validated;
    await savePortfolioLinksState(cleanWallet, validated.links, params.sharedState, params.prisma);
    if (params.persistState)
        await params.persistState();
    return validated;
}
export async function addPortfolioLink(params) {
    const cleanWallet = params.walletAddress.toLowerCase().trim();
    const existing = getStoredPortfolioLinks(cleanWallet, params.sharedState);
    if (existing.length >= MAX_PORTFOLIO_LINKS) {
        return {
            valid: false,
            errorCode: 'MAX_PORTFOLIO_LINKS_EXCEEDED',
            errorMessage: `A maximum of ${MAX_PORTFOLIO_LINKS} portfolio links is allowed per profile`,
            links: existing,
        };
    }
    const single = validateSinglePortfolioLink(params.item);
    if (!single.valid || !single.item) {
        return {
            valid: false,
            errorCode: single.errorCode,
            errorMessage: single.errorMessage,
            links: existing,
        };
    }
    if (existing.some((x) => x.url.toLowerCase() === single.item.url.toLowerCase())) {
        return {
            valid: false,
            errorCode: 'DUPLICATE_PORTFOLIO_URL',
            errorMessage: 'This URL is already saved in your portfolio',
            links: existing,
        };
    }
    const updated = [...existing, single.item];
    await savePortfolioLinksState(cleanWallet, updated, params.sharedState, params.prisma);
    if (params.persistState)
        await params.persistState();
    return { valid: true, links: updated };
}
export async function deletePortfolioLinkById(params) {
    const cleanWallet = params.walletAddress.toLowerCase().trim();
    const existing = getStoredPortfolioLinks(cleanWallet, params.sharedState);
    const filtered = existing.filter((item) => item.id !== params.linkId);
    if (filtered.length === existing.length) {
        return { found: false, links: existing };
    }
    await savePortfolioLinksState(cleanWallet, filtered, params.sharedState, params.prisma);
    if (params.persistState)
        await params.persistState();
    return { found: true, links: filtered };
}
