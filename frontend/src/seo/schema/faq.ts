import { FaqItem } from '../types';

export function buildFaqSchema(faqs: FaqItem[]) {
  const eligibleFaqs = faqs.filter((f) => f.schemaEligible && !f.needsReview);
  if (eligibleFaqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: eligibleFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}
