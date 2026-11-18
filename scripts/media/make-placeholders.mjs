import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../..');
const manifestPath = path.join(rootDir, 'frontend/public/media/manifest.json');
const postersDir = path.join(rootDir, 'frontend/public/media/posters');

if (!fs.existsSync(postersDir)) {
  fs.mkdirSync(postersDir, { recursive: true });
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

console.log(`Generating SVG placeholder posters for ${manifest.length} videos...`);

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

for (const entry of manifest) {
  const isVertical = entry.aspect === '9:16';
  const width = isVertical ? 900 : 1600;
  const height = isVertical ? 1600 : 900;
  
  const title = escapeXml(entry.title || entry.id);
  const summary = escapeXml(entry.summary || '');
  const duration = entry.durationSeconds ? `${entry.durationSeconds}s` : '';
  const typeTag = (entry.type || 'standard').toUpperCase();

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .bg { fill: #F6F7F9; }
      .border { stroke: #E5E7EB; stroke-width: 2; fill: none; }
      .brand { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: ${isVertical ? '28px' : '24px'}; font-weight: 700; fill: #0B0B0F; letter-spacing: -0.5px; }
      .tag { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: ${isVertical ? '20px' : '18px'}; font-weight: 600; fill: #0047AB; }
      .title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: ${isVertical ? '44px' : '48px'}; font-weight: 600; fill: #0B0B0F; }
      .summary { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: ${isVertical ? '24px' : '22px'}; font-weight: 400; fill: #4B5563; }
      .badge-bg { fill: #E7EEF9; }
      .chip-bg { fill: #FFFFFF; stroke: #E5E7EB; stroke-width: 1.5; }
      .chip-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: ${isVertical ? '22px' : '20px'}; font-weight: 600; fill: #0B0B0F; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" class="bg" />
  <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="12" class="border" />

  <!-- Top bar info -->
  <g transform="translate(60, 70)">
    <circle cx="10" cy="10" r="8" fill="#0047AB" />
    <text x="30" y="16" class="brand">PolyLance</text>
    <rect x="${width - 260}" y="-10" width="140" height="40" rx="8" class="badge-bg" />
    <text x="${width - 190}" y="16" text-anchor="middle" class="tag">Coming Soon</text>
  </g>

  <!-- Center Content -->
  <g transform="translate(${width / 2}, ${height / 2 - 30})" text-anchor="middle">
    <!-- Play Icon Placeholder -->
    <circle cx="0" cy="-60" r="50" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2" />
    <polygon points="-8,-75 -8,-45 16,-60" fill="#0047AB" />

    <text y="40" class="title">${title}</text>
    <text y="85" class="summary">${summary}</text>

    <!-- Chips row -->
    <g transform="translate(0, 130)">
      ${duration ? `
      <rect x="-110" y="0" width="100" height="38" rx="8" class="chip-bg" />
      <text x="-60" y="25" text-anchor="middle" class="chip-text">${duration}</text>
      ` : ''}
      <rect x="10" y="0" width="100" height="38" rx="8" class="chip-bg" />
      <text x="60" y="25" text-anchor="middle" class="chip-text">${typeTag}</text>
    </g>
  </g>
</svg>`;

  const svgPath = path.join(postersDir, `${entry.id}.svg`);
  fs.writeFileSync(svgPath, svgContent, 'utf8');
}

console.log('✓ Successfully generated all SVG placeholder posters in frontend/public/media/posters/');
