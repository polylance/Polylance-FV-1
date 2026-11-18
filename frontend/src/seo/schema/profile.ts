import { SITE_NAME, SITE_URL } from '../site.config';

export interface ProfileInput {
  address: string;
  displayName?: string;
  bio?: string;
  skills?: string[];
  avatarUrl?: string;
}

export function buildProfileSchema(profile: ProfileInput) {
  const name = profile.displayName || `Web3 Freelancer`;
  const url = `${SITE_URL}/profile/${profile.address}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: name,
      description: profile.bio || 'Web3 freelancer on PolyLance.',
      image: profile.avatarUrl || `${SITE_URL}/assets/avatar-placeholder.png`,
      url: url,
      knowsAbout: profile.skills || []
    }
  };
}
