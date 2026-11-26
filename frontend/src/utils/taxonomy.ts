import taxonomyJson from '../data/taxonomy.json';
import { Category, Subcategory, TaxonomyData } from '../types/taxonomy';

const taxonomy = taxonomyJson as TaxonomyData;

export function getCategories(): Category[] {
  return taxonomy.categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return taxonomy.categories.find((c) => c.slug === slug || c.id === slug);
}

export function getSubcategoryBySlug(categorySlug: string, subcategorySlug: string): Subcategory | undefined {
  const cat = getCategoryBySlug(categorySlug);
  if (!cat) return undefined;
  return cat.subcategories.find((s) => s.slug === subcategorySlug || s.id === subcategorySlug);
}

export function getAllSkillsForCategory(categorySlug: string): string[] {
  const cat = getCategoryBySlug(categorySlug);
  if (!cat) return [];
  const set = new Set<string>();
  cat.subcategories.forEach((sub) => {
    sub.skills.forEach((skill) => set.add(skill));
  });
  return Array.from(set);
}

export function searchSkills(query: string, categorySlug?: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const pool = categorySlug
    ? getAllSkillsForCategory(categorySlug)
    : Array.from(new Set(taxonomy.categories.flatMap((c) => c.subcategories.flatMap((s) => s.skills))));

  return pool.filter((skill) => skill.toLowerCase().includes(q)).slice(0, 15);
}

export function getCategoryThemeStyles(color: string) {
  switch (color) {
    case 'yellow':
    case 'orange':
    case 'red':
    case 'cobalt':
    default:
      return {
        bg: 'bg-[#EFF6FF]',
        text: 'text-[#0A52B8]',
        border: 'border-[#BFDBFE]',
        dot: 'bg-[#2563EB]',
        accent: '#0A52B8',
      };
  }
}

