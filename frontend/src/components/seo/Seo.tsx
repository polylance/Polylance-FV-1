import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { RouteSeoConfig } from '../../seo/types';
import { getSeoForRoute, buildJsonLd, SITE_URL, THEME_COLOR, SITE_NAME, TWITTER_HANDLE } from '../../seo';

export interface SeoProps {
  routeKey?: string;
  customConfig?: Partial<RouteSeoConfig>;
  extraData?: {
    job?: any;
    article?: any;
    profile?: any;
  };
}

export const Seo: React.FC<SeoProps> = ({ routeKey, customConfig, extraData }) => {
  const location = useLocation();
  const currentPath = routeKey || location.pathname;

  const baseConfig = getSeoForRoute(currentPath);
  const config: RouteSeoConfig = {
    ...baseConfig,
    ...customConfig,
  };

  const fullCanonicalUrl = config.canonicalPath.startsWith('http')
    ? config.canonicalPath
    : `${SITE_URL}${config.canonicalPath}`;

  const ogImage = config.ogImage || `${SITE_URL}/assets/og-image.png`;
  const schemas = buildJsonLd(config, extraData);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Document title
    document.title = config.title;

    // Helper to set or create meta tag
    const setMeta = (attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper to set or create link tag
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // 2. Standard Meta Tags
    setMeta('name', 'description', config.description);
    setMeta('name', 'robots', config.robots);
    setMeta('name', 'theme-color', THEME_COLOR);

    // 3. Canonical Link
    setLink('canonical', fullCanonicalUrl);

    // 4. Open Graph Meta Tags
    setMeta('property', 'og:title', config.title);
    setMeta('property', 'og:description', config.description);
    setMeta('property', 'og:url', fullCanonicalUrl);
    setMeta('property', 'og:type', config.ogType || 'website');
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:site_name', SITE_NAME);

    // 5. Twitter Card Meta Tags
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', config.title);
    setMeta('name', 'twitter:description', config.description);
    setMeta('name', 'twitter:image', ogImage);
    setMeta('name', 'twitter:site', TWITTER_HANDLE);

    // 6. JSON-LD Schemas in DOM
    // Remove previous dynamic JSON-LD scripts
    document.querySelectorAll('script[data-polylance-seo="json-ld"]').forEach((el) => el.remove());

    schemas.forEach((schemaObj, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-polylance-seo', 'json-ld');
      script.text = JSON.stringify(schemaObj);
      document.head.appendChild(script);
    });
  }, [config.title, config.description, config.robots, fullCanonicalUrl, ogImage, schemas]);

  // Also render direct script tags for SSR / Prerendering DOM capture
  return (
    <>
      {schemas.map((schemaObj, idx) => (
        <script
          key={`seo-schema-${idx}`}
          type="application/ld+json"
          data-polylance-seo="json-ld"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaObj) }}
        />
      ))}
    </>
  );
};
