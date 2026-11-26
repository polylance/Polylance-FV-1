export type CategoryThemeColor = 'cobalt' | 'orange' | 'yellow' | 'red';

export interface Subcategory {
  id: string;
  slug: string;
  name: string;
  skills: string[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  themeColor: CategoryThemeColor;
  accentColor: string;
  subcategories: Subcategory[];
}

export interface TaxonomyData {
  version: string;
  categories: Category[];
}

export interface CreatorDeliverable {
  deliverable: string;
  priceUsdc: number;
}

export interface CreatorPlatformProfile {
  platform: 'youtube' | 'instagram' | 'tiktok' | 'podcast';
  handleOrUrl: string;
  audienceCount: number;
  niche: string;
  rateCard: CreatorDeliverable[];
  mediaKitUrl?: string;
  verified: boolean; // false = self-reported
}

export interface SpecializedCategoryData {
  // Cat 1 & 2: Dev & IT / AI & Automation
  githubUsername?: string;
  techStack?: string[];
  liveProjectUrls?: string[];
  deployedModelUrls?: string[];

  // Cat 3: Web3
  contractAddressesVerified?: string[];
  polygonscanProfiles?: string[];

  // Cat 4: Design
  portfolioUrl?: string;
  designTools?: string[];

  // Cat 5: Video & Audio
  showreelUrl?: string;
  productionTools?: string[];

  // Cat 6: Creators
  creatorProfiles?: CreatorPlatformProfile[];

  // Cat 7: Marketing
  caseStudyUrls?: string[];
  specialties?: string[];

  // Cat 8: Writing
  writingSampleUrls?: string[];
  languagePairs?: Array<{ from: string; to: string }>;

  // Cat 9: Data & Analytics
  dashboardSampleUrls?: string[];
  analyticalStack?: string[];

  // Cat 10: Admin & Support
  toolProficiencies?: string[];
  timezoneOffset?: number;
}

