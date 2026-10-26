import { describe, it, expect } from 'vitest';
import { countWords, calculateReadingTime, formatReadingTime } from '../readingTime';

describe('Reading Time Utility Invariants', () => {
  it('handles empty or whitespace-only content with minimum 1 min read', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   \n\n\t  ')).toBe(0);
    expect(calculateReadingTime('')).toBe(1);
    expect(calculateReadingTime('   ')).toBe(1);
    expect(formatReadingTime(calculateReadingTime(''))).toBe('1 min read');
  });

  it('handles short content (under 200 words) with minimum 1 min read', () => {
    const text = 'PolyLance provides smart contract escrow for Web3 freelancers on Polygon.';
    expect(countWords(text)).toBe(10);
    expect(calculateReadingTime(text)).toBe(1);
    expect(formatReadingTime(calculateReadingTime(text))).toBe('1 min read');
  });

  it('rounds UP correctly for partial minutes', () => {
    // 201 words at 200 wpm -> 1.005 minutes -> rounds up to 2 min
    const words201 = Array(201).fill('word').join(' ');
    expect(countWords(words201)).toBe(201);
    expect(calculateReadingTime(words201)).toBe(2);

    // 400 words -> exactly 2 min
    const words400 = Array(400).fill('word').join(' ');
    expect(calculateReadingTime(words400)).toBe(2);

    // 405 words -> rounds up to 3 min
    const words405 = Array(405).fill('word').join(' ');
    expect(calculateReadingTime(words405)).toBe(3);
  });

  it('cleans markdown syntax (code blocks, links, images, tables) before counting words', () => {
    const md = `
# Heading One
Here is a [link](https://polylance.codes) and an image ![alt text](https://example.com/pic.png).

\`\`\`javascript
const code = "should be excluded from prose reading time";
console.log(code);
\`\`\`

| Col A | Col B |
| :--- | :--- |
| Item 1 | Item 2 |
    `.trim();

    const count = countWords(md);
    // Should count prose words: Heading, One, Here, is, a, link, and, an, image, Item, 1, Item, 2
    expect(count).toBeGreaterThan(5);
    expect(count).toBeLessThan(25);
    expect(calculateReadingTime(md)).toBe(1);
  });

  it('calculates long authority articles (1,200 to 5,000 words) accurately', () => {
    const words1400 = Array(1400).fill('blockchain').join(' ');
    expect(calculateReadingTime(words1400)).toBe(7);
    expect(formatReadingTime(calculateReadingTime(words1400))).toBe('7 min read');

    const words5000 = Array(5000).fill('escrow').join(' ');
    expect(calculateReadingTime(words5000)).toBe(25);
    expect(formatReadingTime(calculateReadingTime(words5000))).toBe('25 min read');
  });
});
