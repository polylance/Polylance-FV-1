/**
 * PolyLance Blog Studio — Strict Server-Side HTML Sanitizer
 * Allowlist-based XSS defense protecting published articles and preview feeds.
 */

import sanitizeHtml from 'sanitize-html';

export const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'blockquote', 'figure', 'figcaption',
  'ul', 'ol', 'li',
  'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'a', 'strong', 'em', 'del', 'hr', 'mark',
  'img', 'span', 'div', 'aside',
  'iframe', // Only allowlisted video domains
];

export const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'name', 'target', 'rel', 'title', 'id'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'id'],
  iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title'],
  '*': ['id', 'class', 'data-type', 'data-callout', 'tabindex', 'aria-label', 'aria-hidden'],
};

export const ALLOWED_IFRAME_HOSTNAMES = [
  'www.youtube-nocookie.com',
  'player.vimeo.com',
];

/**
 * Sanitizes arbitrary HTML input from editors or markdown renderers.
 * Neutralizes:
 * - <script> tags and svg onload vectors
 * - All inline javascript: or data: URIs
 * - Any event handlers (onclick, onerror, onload, onmouseover, etc.)
 * - Inline style attributes (CSS injection defense)
 * - Unauthorized iframes
 * Forces:
 * - rel="noopener noreferrer" on external links
 * - target="_blank" for external links
 */
export function sanitizeBlogHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';

  return sanitizeHtml(dirtyHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedIframeHostnames: ALLOWED_IFRAME_HOSTNAMES,
    allowedSchemes: ['http', 'https', 'mailto', 'ipfs'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'ipfs'],
      a: ['http', 'https', 'mailto'],
    },
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || '';
        const isExternal = href.startsWith('http://') || href.startsWith('https://');
        if (isExternal) {
          return {
            tagName: 'a',
            attribs: {
              ...attribs,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          };
        }
        return { tagName: 'a', attribs };
      },
      img: (tagName, attribs) => {
        return {
          tagName: 'img',
          attribs: {
            ...attribs,
            loading: 'lazy',
          },
        };
      },
    },
  });
}
