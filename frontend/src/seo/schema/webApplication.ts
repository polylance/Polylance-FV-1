import { SITE_NAME, SITE_URL } from '../site.config';

export function buildWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    description: 'Decentralized freelance escrow marketplace on Polygon blockchain.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };
}
