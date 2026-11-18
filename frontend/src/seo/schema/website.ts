import { SITE_NAME, SITE_URL } from '../site.config';

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Decentralized freelance marketplace with Polygon smart contract escrow.',
    publisher: {
      '@id': `${SITE_URL}/#organization`
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/find-jobs?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}
