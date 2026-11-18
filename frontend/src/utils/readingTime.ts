/**
 * PolyLance Shared Reading Time Calculation
 *
 * Requirements:
 * - Computes reading time from rendered word count.
 * - Standard 200 words per minute rate.
 * - Minimum 1 minute.
 * - Rounded UP (Math.ceil).
 * - Shared across Studio Editor live preview, checklist, save payload, and public blog pages.
 */

export function countWords(content: string): number {
  if (!content) return 0;

  // Clean common markdown syntax to count actual prose words
  const clean = content
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, ' ')
    // Remove inline code
    .replace(/`.*?`/g, ' ')
    // Remove image syntax ![alt](url)
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    // Remove links [text](url) -> text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Remove markdown heading marks, bold/italic, blockquotes
    .replace(/[#*_~>|]/g, ' ')
    // Remove table alignment dashes
    .replace(/-{3,}/g, ' ')
    .trim();

  const words = clean.split(/\s+/).filter(Boolean);
  return words.length;
}

export function calculateReadingTime(content: string, wordsPerMinute = 200): number {
  const words = countWords(content);
  if (words <= 0) return 1;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function formatReadingTime(minutes: number): string {
  const safeMinutes = Math.max(1, Math.round(minutes) || 1);
  return `${safeMinutes} min read`;
}
