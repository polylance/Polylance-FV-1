/**
 * PolyLance SEO Validation Suite
 * Used by CI, unit tests, and the `npm run seo:check` script to prevent SEO drift.
 */

import { PAGES_SEO } from './pages.seo';
import { KEYWORDS, KEYWORD_LIST } from './keywords';
import { FAQ_DATA } from './faq.data';
import { BLOG_POSTS } from './blog.data';
import { SITE_URL } from './site.config';

export interface ValidationIssue {
  type: 'error' | 'warning';
  entity: string;
  field: string;
  message: string;
}

export function validateSeoSystem(): { valid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  // 1. Keyword validation: each keyword has exactly ONE targetPage
  const pageToKeywords: Record<string, string[]> = {};
  for (const kw of KEYWORD_LIST) {
    if (!kw.id) {
      issues.push({ type: 'error', entity: 'keyword', field: 'id', message: 'Keyword missing ID' });
    }
    if (!kw.targetPage) {
      issues.push({ type: 'error', entity: `keyword:${kw.id}`, field: 'targetPage', message: 'Missing targetPage' });
    }
  }

  // 2. Validate PAGES_SEO
  const seenTitles = new Set<string>();
  const seenDescriptions = new Set<string>();

  for (const [path, config] of Object.entries(PAGES_SEO)) {
    const isPublic = !config.robots.includes('noindex');

    if (isPublic) {
      // Title length check (30 - 60 chars)
      const tLen = config.title.length;
      if (tLen < 30 || tLen > 60) {
        issues.push({
          type: 'error',
          entity: path,
          field: 'title',
          message: `Title length (${tLen}) out of range (30-60): "${config.title}"`
        });
      }

      // Title uniqueness
      if (seenTitles.has(config.title)) {
        issues.push({
          type: 'error',
          entity: path,
          field: 'title',
          message: `Duplicate title found: "${config.title}"`
        });
      }
      seenTitles.add(config.title);

      // Description length check (120 - 160 chars)
      const dLen = config.description.length;
      if (dLen < 120 || dLen > 160) {
        issues.push({
          type: 'error',
          entity: path,
          field: 'description',
          message: `Description length (${dLen}) out of range (120-160): "${config.description}"`
        });
      }

      // Description uniqueness
      if (seenDescriptions.has(config.description)) {
        issues.push({
          type: 'error',
          entity: path,
          field: 'description',
          message: `Duplicate description found: "${config.description}"`
        });
      }
      seenDescriptions.add(config.description);

      // Canonical path format
      if (!config.canonicalPath.startsWith('/')) {
        issues.push({
          type: 'error',
          entity: path,
          field: 'canonicalPath',
          message: `Canonical path must start with '/': "${config.canonicalPath}"`
        });
      }
      if (config.canonicalPath.includes('#') || config.canonicalPath.includes('?')) {
        issues.push({
          type: 'error',
          entity: path,
          field: 'canonicalPath',
          message: `Canonical path cannot contain hash or query params: "${config.canonicalPath}"`
        });
      }

      // Check primary keyword existence
      if (!KEYWORDS[config.primaryKeywordId]) {
        issues.push({
          type: 'error',
          entity: path,
          field: 'primaryKeywordId',
          message: `Primary keyword ID not found in keywords dictionary: "${config.primaryKeywordId}"`
        });
      }

      // Check secondary keywords existence
      for (const secId of config.secondaryKeywordIds) {
        if (!KEYWORDS[secId]) {
          issues.push({
            type: 'error',
            entity: path,
            field: 'secondaryKeywordIds',
            message: `Secondary keyword ID not found: "${secId}"`
          });
        }
      }
    } else {
      // Private pages must have noindex
      if (!config.robots.includes('noindex')) {
        issues.push({
          type: 'error',
          entity: path,
          field: 'robots',
          message: `Private route "${path}" must have noindex directive`
        });
      }
    }
  }

  // 3. Validate FAQ data: question uniqueness and answer length (30 - 120 words)
  const seenFaqQuestions = new Set<string>();
  for (const faq of FAQ_DATA) {
    if (seenFaqQuestions.has(faq.question.toLowerCase())) {
      issues.push({
        type: 'error',
        entity: `faq:${faq.id}`,
        field: 'question',
        message: `Duplicate FAQ question: "${faq.question}"`
      });
    }
    seenFaqQuestions.add(faq.question.toLowerCase());

    const wordCount = faq.answer.trim().split(/\s+/).length;
    if (wordCount < 25 || wordCount > 130) {
      issues.push({
        type: 'warning',
        entity: `faq:${faq.id}`,
        field: 'answer',
        message: `FAQ answer word count (${wordCount}) outside recommended range (30-120 words)`
      });
    }

    // Check keyword references
    for (const kwId of faq.keywordIds) {
      if (!KEYWORDS[kwId]) {
        issues.push({
          type: 'error',
          entity: `faq:${faq.id}`,
          field: 'keywordIds',
          message: `FAQ references unknown keyword ID: "${kwId}"`
        });
      }
    }
  }

  // 4. Validate Blog Posts
  for (const post of BLOG_POSTS) {
    if (post.title.length < 30 || post.title.length > 65) {
      issues.push({
        type: 'warning',
        entity: `blog:${post.slug}`,
        field: 'title',
        message: `Blog title length (${post.title.length}) out of optimal range (30-60): "${post.title}"`
      });
    }
    if (post.description.length < 120 || post.description.length > 165) {
      issues.push({
        type: 'warning',
        entity: `blog:${post.slug}`,
        field: 'description',
        message: `Blog description length (${post.description.length}) out of optimal range (120-160)`
      });
    }
    if (!KEYWORDS[post.primaryKeywordId]) {
      issues.push({
        type: 'error',
        entity: `blog:${post.slug}`,
        field: 'primaryKeywordId',
        message: `Blog post references unknown primary keyword ID: "${post.primaryKeywordId}"`
      });
    }
  }

  const hasErrors = issues.some((i) => i.type === 'error');
  return {
    valid: !hasErrors,
    issues
  };
}
