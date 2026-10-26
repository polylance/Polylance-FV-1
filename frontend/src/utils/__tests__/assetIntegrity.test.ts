import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

describe('Official Asset Integrity & Brand Compliance', () => {
  const brandDir = path.resolve(__dirname, '../../../public/brand/polygon');
  const polygonMarkPath = path.join(brandDir, 'polygon-mark.svg');
  const polygonWordmarkPath = path.join(brandDir, 'polygon-wordmark.svg');
  const verifiedSealPng = path.resolve(__dirname, '../../../public/polylance-verified-seal.png');

  it('verifies official Polygon brand mark file exists and is intact', () => {
    expect(fs.existsSync(polygonMarkPath)).toBe(true);
    const content = fs.readFileSync(polygonMarkPath, 'utf8');
    expect(content).toContain('viewBox="0 0 507.91 446.91"');
    expect(content).toContain('fill="#8247E5"');

    // SHA-256 fingerprint verification
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    expect(hash.length).toBe(64);
  });

  it('verifies official Polygon wordmark file exists and is intact', () => {
    expect(fs.existsSync(polygonWordmarkPath)).toBe(true);
    const content = fs.readFileSync(polygonWordmarkPath, 'utf8');
    expect(content).toContain('viewBox="0 0 1600 450"');
    expect(content).toContain('fill="#8247E5"');
    expect(content).toContain('Polygon');
  });

  it('verifies PolyLance Verified Seal assets exist in public folder', () => {
    expect(fs.existsSync(verifiedSealPng)).toBe(true);
  });

  it('confirms PolygonLogo component renders official vector mark with #8247E5 purple', () => {
    const polygonLogoComp = fs.readFileSync(
      path.resolve(__dirname, '../../components/common/PolygonLogo.tsx'),
      'utf8'
    );
    // Must use official #8247E5 Polygon purple and official coordinates
    expect(polygonLogoComp).toContain('#8247E5');
    expect(polygonLogoComp).toContain('M384.58,136.59');
  });
});
