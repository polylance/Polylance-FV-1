import { SITE_NAME, SITE_URL, CONTACT_EMAIL, TWITTER_HANDLE, GITHUB_URL } from '../site.config';

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/assets/logo.png`,
    sameAs: [
      `https://twitter.com/${TWITTER_HANDLE.replace('@', '')}`,
      GITHUB_URL
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: CONTACT_EMAIL,
      contactType: 'customer support',
      availableLanguage: ['English']
    }
  };
}
