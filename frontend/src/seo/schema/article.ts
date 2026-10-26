import { SITE_NAME, SITE_URL } from '../site.config';

export interface ArticleInput {
  title: string;
  description: string;
  slug: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  heroImage?: string;
}

export function buildArticleSchema(article: ArticleInput) {
  const url = `${SITE_URL}/blog/${article.slug}`;
  const image = article.heroImage || `${SITE_URL}/assets/og-image.png`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    headline: article.title,
    description: article.description,
    image: image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.author
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/assets/logo.png`
      }
    }
  };
}
