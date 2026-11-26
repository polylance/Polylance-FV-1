import fs from 'fs';
import path from 'path';
export const LEGACY_CATEGORY_MAP = {
    web3: {
        legacyKey: 'web3',
        categoryId: 'cat_web3_block',
        subcategoryId: 'sub_smart_contracts',
        displayFallback: 'Legacy',
    },
    frontend: {
        legacyKey: 'frontend',
        categoryId: 'cat_dev_it',
        subcategoryId: 'sub_web_dev',
        displayFallback: 'Legacy',
    },
    backend: {
        legacyKey: 'backend',
        categoryId: 'cat_dev_it',
        subcategoryId: 'sub_software_apis',
        displayFallback: 'Legacy',
    },
    mobile: {
        legacyKey: 'mobile',
        categoryId: 'cat_dev_it',
        subcategoryId: 'sub_mobile_dev',
        displayFallback: 'Legacy',
    },
};
const TECH_CATEGORY_IDS = new Set([
    'cat_dev_it',
    'cat_ai_auto',
    'cat_web3_block',
    'cat_data_analytics',
]);
function loadRawTaxonomy() {
    const candidates = [
        path.resolve(process.cwd(), 'frontend/src/data/taxonomy.json'),
        path.resolve(process.cwd(), '../frontend/src/data/taxonomy.json'),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            try {
                return JSON.parse(fs.readFileSync(candidate, 'utf-8'));
            }
            catch {
                // Fallback below
            }
        }
    }
    return { version: '1.0.0', categories: [] };
}
const rawData = loadRawTaxonomy();
export const TAXONOMY_CATEGORIES = (rawData.categories || []).map((c) => ({
    id: String(c.id),
    slug: String(c.slug),
    name: String(c.name),
    description: String(c.description || ''),
    track: c.track === 'tech' || c.track === 'non-tech' || c.track === 'hybrid'
        ? c.track
        : TECH_CATEGORY_IDS.has(String(c.id))
            ? 'tech'
            : 'non-tech',
    subcategories: Array.isArray(c.subcategories)
        ? c.subcategories.map((s) => ({
            id: String(s.id),
            slug: String(s.slug),
            name: String(s.name),
            skills: Array.isArray(s.skills) ? s.skills.map(String) : [],
        }))
        : [],
}));
export function findTaxonomyCategory(input) {
    if (!input)
        return undefined;
    const clean = String(input).trim().toLowerCase();
    return TAXONOMY_CATEGORIES.find((c) => c.id.toLowerCase() === clean || c.slug.toLowerCase() === clean || c.name.toLowerCase() === clean);
}
export function findTaxonomySubcategory(cat, input) {
    if (!input)
        return undefined;
    const clean = String(input).trim().toLowerCase();
    return cat.subcategories.find((s) => s.id.toLowerCase() === clean || s.slug.toLowerCase() === clean || s.name.toLowerCase() === clean);
}
/**
 * Validates and resolves canonical off-chain category_id and subcategory_id.
 * Never mutates legacy records; maps known legacy keys ('web3', 'frontend', 'backend', 'mobile')
 * cleanly and flags unrecognized strings as non-destructive Legacy fallback on read.
 */
export function validateAndResolveJobCategories(input, options = {}) {
    const { strictExplicit = true } = options;
    const rawCat = (input.categoryId || input.category || '').trim();
    const rawSub = (input.subcategoryId || input.subcategory || '').trim();
    if (!rawCat && !rawSub) {
        return {
            valid: true,
            categoryId: null,
            subcategoryId: null,
            legacyCategory: null,
            isLegacyFallback: false,
        };
    }
    const lowerCat = rawCat.toLowerCase();
    const legacyHit = LEGACY_CATEGORY_MAP[lowerCat];
    let resolvedCat = findTaxonomyCategory(rawCat);
    let legacyCategory = null;
    let isLegacyFallback = false;
    if (!resolvedCat && legacyHit) {
        resolvedCat = findTaxonomyCategory(legacyHit.categoryId);
        legacyCategory = legacyHit.legacyKey;
    }
    if (!resolvedCat) {
        if (strictExplicit && (input.categoryId || input.subcategoryId)) {
            return {
                valid: false,
                errorCode: 'INVALID_CATEGORY',
                errorMessage: rawCat
                    ? `Unknown taxonomy categoryId: '${rawCat}'`
                    : 'categoryId is required when subcategoryId is specified',
                categoryId: null,
                subcategoryId: null,
                legacyCategory: rawCat || null,
                isLegacyFallback: true,
            };
        }
        return {
            valid: true,
            categoryId: null,
            subcategoryId: null,
            legacyCategory: rawCat || null,
            isLegacyFallback: true,
        };
    }
    let resolvedSub;
    if (rawSub) {
        resolvedSub = findTaxonomySubcategory(resolvedCat, rawSub);
        if (!resolvedSub) {
            // Check if subcategory exists in a DIFFERENT category
            const otherCat = TAXONOMY_CATEGORIES.find((c) => findTaxonomySubcategory(c, rawSub));
            if (strictExplicit) {
                return {
                    valid: false,
                    errorCode: otherCat ? 'SUBCATEGORY_MISMATCH' : 'INVALID_SUBCATEGORY',
                    errorMessage: otherCat
                        ? `Subcategory '${rawSub}' belongs to '${otherCat.id}', not '${resolvedCat.id}'`
                        : `Unknown subcategory '${rawSub}' for category '${resolvedCat.id}'`,
                    categoryId: resolvedCat.id,
                    subcategoryId: null,
                    legacyCategory,
                    isLegacyFallback: false,
                };
            }
        }
    }
    else if (legacyHit) {
        resolvedSub = findTaxonomySubcategory(resolvedCat, legacyHit.subcategoryId);
    }
    return {
        valid: true,
        categoryId: resolvedCat.id,
        subcategoryId: resolvedSub ? resolvedSub.id : null,
        legacyCategory,
        isLegacyFallback,
    };
}
/**
 * Filters public/authorized jobs by canonical taxonomy IDs, slugs, legacy aliases, track, status, and keyword,
 * using cursor pagination and recording execution time in ms.
 */
export function filterAndPaginateJobs(jobs, params) {
    const startNs = process.hrtime.bigint();
    const filterCat = findTaxonomyCategory(params.category) ||
        (params.category && LEGACY_CATEGORY_MAP[params.category.trim().toLowerCase()]
            ? findTaxonomyCategory(LEGACY_CATEGORY_MAP[params.category.trim().toLowerCase()].categoryId)
            : undefined);
    const filterTrack = params.track === 'tech' || params.track === 'non-tech' || params.track === 'hybrid'
        ? params.track
        : undefined;
    const qLower = (params.q || '').trim().toLowerCase();
    const statusLower = (params.status || '').trim().toLowerCase();
    const matched = (jobs || []).filter((job) => {
        if (!job)
            return false;
        const resolved = validateAndResolveJobCategories({
            categoryId: job.categoryId,
            subcategoryId: job.subcategoryId,
            category: job.category,
            subcategory: job.subcategory,
        }, { strictExplicit: false });
        if (params.category) {
            if (!filterCat) {
                if ((job.category || '').toLowerCase() !== params.category.trim().toLowerCase()) {
                    return false;
                }
            }
            else if (resolved.categoryId !== filterCat.id) {
                return false;
            }
        }
        if (params.subcategory) {
            const subClean = params.subcategory.trim().toLowerCase();
            const targetCat = filterCat || findTaxonomyCategory(resolved.categoryId);
            const targetSub = targetCat ? findTaxonomySubcategory(targetCat, subClean) : undefined;
            const jobSubId = (resolved.subcategoryId || job.subcategory || '').toLowerCase();
            if (targetSub) {
                if (jobSubId !== targetSub.id.toLowerCase())
                    return false;
            }
            else if (jobSubId !== subClean) {
                return false;
            }
        }
        if (filterTrack) {
            const cat = findTaxonomyCategory(resolved.categoryId);
            if (!cat || cat.track !== filterTrack)
                return false;
        }
        if (statusLower && statusLower !== 'all') {
            if (String(job.status || '').toLowerCase() !== statusLower)
                return false;
        }
        if (qLower) {
            const hay = `${job.title || ''} ${job.description || ''} ${(job.skillsRequired || []).join(' ')}`.toLowerCase();
            if (!hay.includes(qLower))
                return false;
        }
        return true;
    });
    const limit = Math.min(Math.max(1, Number(params.limit) || 20), 100);
    let startIdx = 0;
    if (params.cursor) {
        const idx = matched.findIndex((j) => String(j.id) === params.cursor);
        if (idx !== -1)
            startIdx = idx + 1;
    }
    const items = matched.slice(startIdx, startIdx + limit);
    const nextCursor = items.length === limit && startIdx + limit < matched.length
        ? String(items[items.length - 1].id)
        : null;
    const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1e6;
    return {
        items,
        nextCursor,
        total: matched.length,
        queryMs: Number(elapsedMs.toFixed(3)),
    };
}
/**
 * Enriches a job object non-destructively with canonical taxonomy IDs and legacy fallback marker.
 */
export function enrichJobCategoryFields(job) {
    const resolved = validateAndResolveJobCategories({
        categoryId: job.categoryId,
        subcategoryId: job.subcategoryId,
        category: job.category,
        subcategory: job.subcategory,
    }, { strictExplicit: false });
    return {
        ...job,
        categoryId: resolved.categoryId,
        subcategoryId: resolved.subcategoryId,
        legacyCategory: job.legacyCategory ?? resolved.legacyCategory,
        legacyFallbackLabel: resolved.isLegacyFallback ? 'Legacy' : null,
    };
}
/**
 * Strictly validates explicit categoryId/subcategoryId on incoming write payloads
 * and populates canonical off-chain taxonomy fields without altering legacy keys.
 */
export function validateAndPrepareIncomingJobs(jobs) {
    const prepared = [];
    for (const job of jobs || []) {
        if (!job || typeof job !== 'object')
            continue;
        const resolved = validateAndResolveJobCategories({
            categoryId: job.categoryId,
            subcategoryId: job.subcategoryId,
            category: job.category,
            subcategory: job.subcategory,
        }, { strictExplicit: true });
        if (!resolved.valid) {
            return {
                ok: false,
                jobs: [],
                error: resolved.errorMessage || 'Invalid category taxonomy selection',
                code: resolved.errorCode || 'INVALID_CATEGORY',
                jobId: job.id ? String(job.id) : null,
            };
        }
        prepared.push({
            ...job,
            categoryId: resolved.categoryId,
            subcategoryId: resolved.subcategoryId,
            legacyCategory: job.legacyCategory ?? resolved.legacyCategory,
        });
    }
    return { ok: true, jobs: prepared };
}
/**
 * Computes real open-job counts per taxonomy category plus legacy fallback count.
 */
export function computeCategoryOpenJobCounts(jobs) {
    const startNs = process.hrtime.bigint();
    const countsByCategoryId = {};
    for (const cat of TAXONOMY_CATEGORIES) {
        countsByCategoryId[cat.id] = 0;
    }
    let legacyUnmappedCount = 0;
    const closedStatuses = new Set(['completed', 'cancelled', 'canceled', 'closed', 'refunded', 'resolved']);
    for (const job of jobs || []) {
        if (!job)
            continue;
        const status = String(job.status || 'open').toLowerCase().trim();
        if (closedStatuses.has(status))
            continue;
        const resolved = validateAndResolveJobCategories({
            categoryId: job.categoryId,
            subcategoryId: job.subcategoryId,
            category: job.category,
            subcategory: job.subcategory,
        }, { strictExplicit: false });
        if (resolved.categoryId && countsByCategoryId[resolved.categoryId] !== undefined) {
            countsByCategoryId[resolved.categoryId] += 1;
        }
        else if (resolved.isLegacyFallback) {
            legacyUnmappedCount += 1;
        }
    }
    const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1e6;
    return {
        countsByCategoryId,
        legacyUnmappedCount,
        queryMs: Number(elapsedMs.toFixed(3)),
    };
}
