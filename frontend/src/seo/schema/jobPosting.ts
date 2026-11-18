import { SITE_NAME, SITE_URL } from '../site.config';

export interface JobPostingInput {
  id: string;
  title: string;
  description: string;
  amountUsdc?: string;
  amountEth?: string;
  paymentTokenSymbol?: string;
  createdAt?: number | string;
  client?: string;
}

export function buildJobPostingSchema(job: JobPostingInput) {
  const token = (job.paymentTokenSymbol || 'USDC').toUpperCase();
  const value = parseFloat(job.amountUsdc || job.amountEth || '0');
  const postedDate = job.createdAt
    ? new Date(Number(job.createdAt)).toISOString()
    : new Date().toISOString();
  
  // Default job expiration to 30 days after posting
  const validUntil = new Date(new Date(postedDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    identifier: {
      '@type': 'PropertyValue',
      name: SITE_NAME,
      value: job.id
    },
    datePosted: postedDate,
    validThrough: validUntil,
    employmentType: 'CONTRACTOR',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.client ? `Client (${job.client.slice(0, 6)}...${job.client.slice(-4)})` : 'PolyLance Client',
      sameAs: SITE_URL
    },
    jobLocationType: 'TELECOMMUTE',
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'Worldwide'
    },
    baseSalary: value > 0 ? {
      '@type': 'MonetaryAmount',
      currency: token === 'POL' || token === 'MATIC' ? 'POL' : 'USD',
      value: {
        '@type': 'QuantitativeValue',
        value: value,
        unitText: 'PROJECT'
      }
    } : undefined
  };
}
