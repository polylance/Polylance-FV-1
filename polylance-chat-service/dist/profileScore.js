import { getStoredGithubProof } from './githubProof.js';
import { getStoredPortfolioLinks } from './portfolioLinks.js';
import { findTaxonomyCategory } from './taxonomy.js';
export const DEMO_MODEL_VERSION = 'rule-demo-v1.0.0';
/**
 * Pure rule-based Profile Strength computation (status = "demo").
 *
 * Governance guarantees:
 * - Zero sensitive attributes (never reads email, phone, location, demographics, age, gender)
 * - Deterministic & explainable factor breakdown (factors sum exactly to value 0..100)
 * - Strictly isolated: never consumed by ranking/leaderboard, escrow payouts, or dispute decisions
 */
export function computeRuleBasedProfileStrength(params) {
    const cleanWallet = params.walletAddress.toLowerCase().trim();
    const profile = params.sharedState?.profiles?.[cleanWallet] || {};
    const portfolioLinks = getStoredPortfolioLinks(cleanWallet, params.sharedState);
    const githubProof = getStoredGithubProof(cleanWallet, params.sharedState);
    // Factor 1: Categories & Skills filled (max 25)
    const rawPrimaryCat = profile.primaryCategoryId || profile.primary_category_id || profile.categoryId || profile.category;
    const resolvedCat = rawPrimaryCat ? findTaxonomyCategory(String(rawPrimaryCat)) : undefined;
    const subcategories = Array.isArray(profile.subcategories) ? profile.subcategories.filter(Boolean) : [];
    const skills = Array.isArray(profile.skills) ? profile.skills.filter(Boolean) : [];
    let categoriesScore = 0;
    if (resolvedCat)
        categoriesScore += 15;
    else if (typeof rawPrimaryCat === 'string' && rawPrimaryCat.trim())
        categoriesScore += 8;
    if (subcategories.length > 0)
        categoriesScore += 5;
    if (skills.length >= 3)
        categoriesScore += 5;
    else if (skills.length >= 1)
        categoriesScore += 2;
    categoriesScore = Math.min(25, categoriesScore);
    // Factor 2: Description & Role Clarity (max 25) — strictly text richness, no PII
    const bioText = String(profile.bio || profile.description || profile.overview || '').trim();
    const headlineText = String(profile.title || profile.headline || profile.tagline || '').trim();
    const bioLen = bioText.length;
    let descriptionScore = 0;
    if (bioLen >= 160)
        descriptionScore += 18;
    else if (bioLen >= 80)
        descriptionScore += 12;
    else if (bioLen >= 25)
        descriptionScore += 6;
    if (headlineText.length >= 4)
        descriptionScore += 7;
    descriptionScore = Math.min(25, descriptionScore);
    // Factor 3: Portfolio & Proof Completeness (max 30)
    // Tech track may satisfy via verified GitHub proof; non-tech via curated HTTPS portfolio links; hybrid gets either.
    let portfolioScore = 0;
    if (portfolioLinks.length >= 3)
        portfolioScore += 20;
    else if (portfolioLinks.length === 2)
        portfolioScore += 14;
    else if (portfolioLinks.length === 1)
        portfolioScore += 8;
    if (githubProof) {
        portfolioScore += 15;
        if ((githubProof.stats?.public_repos || 0) >= 3)
            portfolioScore += 5;
    }
    else if (portfolioLinks.length >= 4) {
        portfolioScore += 10;
    }
    portfolioScore = Math.min(30, portfolioScore);
    // Factor 4: Basic Work Identity Completeness (max 20) — public display handle / work role only
    const displayName = String(profile.displayName || profile.name || '').trim();
    const hasAccountMode = Boolean(profile.accountMode || (Array.isArray(profile.roles) && profile.roles.length > 0));
    const hasRateOrAvailability = Boolean(profile.hourlyRate || profile.availability);
    let clarityScore = 0;
    if (displayName.length >= 2)
        clarityScore += 10;
    if (hasAccountMode)
        clarityScore += 5;
    if (hasRateOrAvailability)
        clarityScore += 5;
    clarityScore = Math.min(20, clarityScore);
    const factors = [
        {
            key: 'categories_filled',
            label: 'Categories & skills tagged',
            contribution: categoriesScore,
        },
        {
            key: 'description_quality',
            label: 'Bio & service description quality',
            contribution: descriptionScore,
        },
        {
            key: 'portfolio_completeness',
            label: 'Portfolio links or verified GitHub proof',
            contribution: portfolioScore,
        },
        {
            key: 'profile_clarity',
            label: 'Public name & work availability',
            contribution: clarityScore,
        },
    ];
    const totalValue = factors.reduce((sum, f) => sum + f.contribution, 0);
    return {
        status: 'demo',
        value: Math.min(100, Math.max(0, totalValue)),
        factors,
        model_version: DEMO_MODEL_VERSION,
        computed_at: new Date().toISOString(),
    };
}
export async function getOrComputeOwnProfileScore(params) {
    const cleanWallet = params.walletAddress.toLowerCase().trim();
    const optedOut = Boolean(params.sharedState?.profileScoreOptOut?.[cleanWallet]);
    if (optedOut && !params.forceRecompute) {
        return {
            status: 'unavailable',
            value: null,
            factors: [],
            model_version: DEMO_MODEL_VERSION,
            computed_at: new Date().toISOString(),
        };
    }
    if (params.forceRecompute && params.sharedState?.profileScoreOptOut) {
        delete params.sharedState.profileScoreOptOut[cleanWallet];
    }
    const computed = computeRuleBasedProfileStrength({
        walletAddress: cleanWallet,
        sharedState: params.sharedState,
    });
    if (!params.sharedState.profileScores)
        params.sharedState.profileScores = {};
    params.sharedState.profileScores[cleanWallet] = computed;
    if (params.prisma?.profileStrengthScore) {
        try {
            await params.prisma.profileStrengthScore.upsert({
                where: { walletAddress: cleanWallet },
                update: {
                    status: computed.status,
                    value: computed.value,
                    factors: computed.factors,
                    modelVersion: computed.model_version,
                    optedOut: false,
                    computedAt: new Date(computed.computed_at),
                },
                create: {
                    walletAddress: cleanWallet,
                    status: computed.status,
                    value: computed.value,
                    factors: computed.factors,
                    modelVersion: computed.model_version,
                    optedOut: false,
                    computedAt: new Date(computed.computed_at),
                },
            });
        }
        catch (err) {
            console.warn('[DB] ProfileStrengthScore upsert notice:', err);
        }
    }
    if (params.persistState) {
        await params.persistState();
    }
    return computed;
}
export async function disconnectAndDeleteProfileScore(params) {
    const cleanWallet = params.walletAddress.toLowerCase().trim();
    if (!params.sharedState.profileScoreOptOut)
        params.sharedState.profileScoreOptOut = {};
    params.sharedState.profileScoreOptOut[cleanWallet] = true;
    const existed = Boolean(params.sharedState?.profileScores?.[cleanWallet]);
    if (params.sharedState?.profileScores) {
        delete params.sharedState.profileScores[cleanWallet];
    }
    if (params.prisma?.profileStrengthScore) {
        try {
            await params.prisma.profileStrengthScore.deleteMany({ where: { walletAddress: cleanWallet } });
        }
        catch (err) {
            console.warn('[DB] ProfileStrengthScore delete notice:', err);
        }
    }
    if (params.persistState) {
        await params.persistState();
    }
    return {
        deleted: existed || true,
        score: {
            status: 'unavailable',
            value: null,
            factors: [],
            model_version: DEMO_MODEL_VERSION,
            computed_at: new Date().toISOString(),
        },
    };
}
