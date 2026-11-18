/**
 * PolyLance SEO Public Module
 * All external components and build scripts import exclusively from here.
 */

import { RouteSeoConfig } from './types';
import { PAGES_SEO, getRouteSeo } from './pages.seo';
import { SITE_URL, SITE } from './site.config';
import { getFaqsForPage } from './faq.data';
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildJobPostingSchema,
  buildFaqSchema,
  buildBreadcrumbSchema,
  buildArticleSchema,
  buildProfileSchema,
  buildWebApplicationSchema
} from './schema';

export * from './types';
export * from './site.config';
export * from './keywords';
export * from './pages.seo';
export * from './templates';
export * from './faq.data';
export * from './blog.data';
export * from './schema';
export * from './validate';

/**
 * Returns the RouteSeoConfig for any given path, falling back safely if unknown.
 */
export function getSeoForRoute(pathname: string): RouteSeoConfig {
  const matched = getRouteSeo(pathname);
  if (matched) return matched;

  // Unknown route fallback: noindex to prevent indexing soft 404s
  return {
    path: pathname,
    title: 'Page Not Found | PolyLance',
    description: 'The requested page could not be located on PolyLance.',
    canonicalPath: '/find-jobs',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  };
}

/**
 * Builds the array of JSON-LD schema objects corresponding to a RouteSeoConfig.
 */
export function buildJsonLd(config: RouteSeoConfig, extraData?: {
  job?: any;
  article?: any;
  profile?: any;
}): any[] {
  const schemas: any[] = [];

  for (const type of config.jsonLdTypes) {
    switch (type) {
      case 'Organization':
        schemas.push(buildOrganizationSchema());
        break;
      case 'WebSite':
        schemas.push(buildWebSiteSchema());
        break;
      case 'SoftwareApplication':
      case 'WebApplication':
        schemas.push(buildWebApplicationSchema());
        break;
      case 'BreadcrumbList':
        if (config.breadcrumbs && config.breadcrumbs.length > 0) {
          const bc = buildBreadcrumbSchema(config.breadcrumbs);
          if (bc) schemas.push(bc);
        }
        break;
      case 'FAQPage': {
        const pageFaqs = getFaqsForPage(config.path);
        const faqSchema = buildFaqSchema(pageFaqs);
        if (faqSchema) schemas.push(faqSchema);
        break;
      }
      case 'JobPosting':
        if (extraData?.job) {
          schemas.push(buildJobPostingSchema(extraData.job));
        }
        break;
      case 'Article':
      case 'BlogPosting':
        if (extraData?.article) {
          schemas.push(buildArticleSchema(extraData.article));
        }
        break;
      case 'ProfilePage':
      case 'Person':
        if (extraData?.profile) {
          schemas.push(buildProfileSchema(extraData.profile));
        }
        break;
    }
  }

  return schemas;
}
