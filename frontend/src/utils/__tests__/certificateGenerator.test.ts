import { describe, it, expect } from 'vitest';
import {
  renderCertificate,
  buildJobRecordPreimage,
  computeRecordHash,
  buildProofPack,
  CertificateData,
} from '../certificateGenerator';

describe('Canonical SBT Certificate Generator (A4 Landscape)', () => {
  const mockWorkCert: CertificateData = {
    tokenId: 9805,
    variant: 'work',
    jobId: 'job-9805',
    jobTitle: 'Enhance Polylance UI design',
    category: 'Decentralized Escrow',
    recipientAddress: '0xb30F9C7f8841098B12f45c90812e34D567a81aB1',
    recipientName: 'stevenson20',
    clientAddress: '0xB8aa567675D3b08e2fE7bE309c647b7Fa5D09Dd',
    clientName: 'Sunny Pasumarthi',
    amount: '10.00',
    tokenSymbol: 'POL',
    completedAt: 1760611200000,
    contractAddress: '0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879',
    escrowAddress: '0x88dd19df1b6dBA8D2c53b3976f4ec39B75f17FbB',
    releaseTxHash: '0x7a89b3f12c98d45e76a1098b12f45c90812e34d567a89b012c34d56e78f901ab',
    milestoneCount: 2,
    salt: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  };

  const mockPatronageCert: CertificateData = {
    ...mockWorkCert,
    variant: 'patronage',
    recipientAddress: '0xB8aa567675D3b08e2fE7bE309c647b7Fa5D09Dd',
    recipientName: 'Sunny Pasumarthi',
  };

  it('generates deterministic SVG output for identical input data', () => {
    const svg1 = renderCertificate(mockWorkCert);
    const svg2 = renderCertificate(mockWorkCert);
    expect(svg1).toBe(svg2);
  });

  it('strictly adheres to A4 landscape viewBox (1414x1000, 1.414:1)', () => {
    const svg = renderCertificate(mockWorkCert);
    expect(svg).toContain('viewBox="0 0 1414 1000"');
    expect(svg).toContain('width="1414"');
    expect(svg).toContain('height="1000"');
  });

  it('aligns the Oracle seal and script wordmark directly on the horizontal center axis (x = 707)', () => {
    const svg = renderCertificate(mockWorkCert);
    // PolyLance Oracle Seal centered at x = 707, y = 308 (below pill badge)
    expect(svg).toContain('transform="translate(707, 308)"');
    // PolyLance script wordmark centered at x = 707, y = 412 (directly below seal)
    expect(svg).toContain('transform="translate(707, 412)"');
    // No logo lockup group above the seal
    expect(svg).not.toContain('id="polylance-logo-lockup"');
  });

  it('uses the official PolyLance palette: cobalt blue (#0047FF) and electric blue (#00D2FF), with no gold tones', () => {
    const svg = renderCertificate(mockWorkCert);
    expect(svg).toContain('#0047FF'); // Cobalt blue primary
    expect(svg).toContain('#00D2FF'); // Electric blue highlight
    expect(svg).not.toContain('#D4AF37'); // No metallic gold
    expect(svg).not.toContain('#B8860B'); // No dark goldenrod
    expect(svg).not.toContain('#F3E5AB'); // No vanilla/champagne gold
    expect(svg).not.toContain('#996515'); // No golden brown
  });

  it('renders official Polygon logo with "Secured on Polygon PoS"', () => {
    const svg = renderCertificate(mockWorkCert);
    expect(svg).toContain('Secured on Polygon PoS');
    // Verifies official polygon vector path coordinates
    expect(svg).toContain('M384.58,136.59');
  });

  it('modulates guilloche border uniquely based on record hash seed', () => {
    const cert1 = renderCertificate(mockWorkCert);
    const cert2 = renderCertificate({
      ...mockWorkCert,
      tokenId: 9806,
      jobId: 'job-9806',
      salt: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    });
    // Both SVGs are valid
    expect(cert1).toContain('id="seeded-guilloche-band"');
    expect(cert2).toContain('id="seeded-guilloche-band"');
    // But have different path coordinates due to different PRNG seeds
    expect(cert1).not.toBe(cert2);
  });

  it('embeds continuous public-safe microtext around border', () => {
    const svg = renderCertificate(mockWorkCert);
    expect(svg).toContain('PL-SBT #9805');
    expect(svg).toContain('CHAIN 137');
    expect(svg).toContain('SBT ');
    expect(svg).toContain('ESCROW ');
  });

  it('enforces privacy denylist: no sensitive private fields in artwork or microtext', () => {
    const svg = renderCertificate(mockWorkCert);
    // Denylist check
    expect(svg).not.toMatch(/@([a-zA-Z0-9._-]+)\.[a-zA-Z]{2,}/i); // No emails
    expect(svg).not.toContain('password');
    expect(svg).not.toContain('rating');
    expect(svg).not.toContain('review');
    expect(svg).not.toContain('https://github.com/private');
    expect(svg).not.toContain('deliverable_download');
  });

  it('correctly distinguishes Freelancer and Patronage titles', () => {
    const freelancerSvg = renderCertificate(mockWorkCert);
    expect(freelancerSvg).toContain('Certificate of Verified Work');
    expect(freelancerSvg).toContain('Awarded to (Freelancer)');

    const patronageSvg = renderCertificate(mockPatronageCert);
    expect(patronageSvg).toContain('Certificate of Patronage');
    expect(patronageSvg).toContain('Awarded to (Client / Patron)');
  });

  it('computes deterministic keccak256 hash commitment and validates ProofPack', () => {
    const proofPack = buildProofPack(mockWorkCert);
    expect(proofPack.schemaVersion).toBe('1.0');
    expect(proofPack.recordHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    // Recomputed hash from preimage matches
    const recomputed = computeRecordHash(proofPack.preimage);
    expect(recomputed).toBe(proofPack.recordHash);

    // Tampered preimage produces a mismatch
    const tamperedPreimage = {
      ...proofPack.preimage,
      budget: '999999.00',
    };
    const tamperedHash = computeRecordHash(tamperedPreimage);
    expect(tamperedHash).not.toBe(proofPack.recordHash);
  });
});
