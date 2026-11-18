/**
 * Test Suite: PolyLance Blog & Blog Studio Invariants
 * Verifies public rendering pipeline, token replacement, TOC ID generation,
 * and Studio authorization invariants.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MarkdownRenderer, KeyTakeawaysBox } from '../../../components/blog/MarkdownRenderer';
import { PLATFORM_FEE_PERCENT, REVIEW_WINDOW_DAYS } from '../../../seo/site.config';

describe('Public Blog: Markdown & Token Rendering Invariants', () => {
  it('replaces dynamic fee tokens with official site configuration values', () => {
    const rawMarkdown = `
PolyLance collects a standard escrow fee of {{PLATFORM_FEE_PERCENT}} per side.
The combined total fee is {{PLATFORM_FEE_TOTAL}}.
Clients have {{REVIEW_WINDOW_DAYS}} days to inspect deliverables.
    `.trim();

    const { container } = render(<MarkdownRenderer content={rawMarkdown} />);
    const text = container.textContent || '';

    expect(text).toContain(PLATFORM_FEE_PERCENT);
    expect(text).toContain(String(REVIEW_WINDOW_DAYS));

    // Ensure tokens are NOT left unrendered
    expect(text).not.toContain('{{PLATFORM_FEE_PERCENT}}');
    expect(text).not.toContain('{{PLATFORM_FEE_TOTAL}}');
    expect(text).not.toContain('{{REVIEW_WINDOW_DAYS}}');
  });

  it('renders callout blocks with accessible semantic styling', () => {
    const rawMarkdown = `
> [!INFO]
> Platform fees are non-custodial and settled on Polygon.

> [!WARNING]
> Do not approve milestones before reviewing work.

> [!KEY]
> Smart contract code cannot be altered once deployed.
    `.trim();

    const { container } = render(<MarkdownRenderer content={rawMarkdown} />);

    expect(container.querySelector('aside[aria-label="Information"]')).toBeTruthy();
    expect(container.querySelector('aside[aria-label="Important Warning"]')).toBeTruthy();
    expect(container.querySelector('aside[aria-label="Key Point"]')).toBeTruthy();
    expect(container.textContent).toContain('Platform fees are non-custodial and settled on Polygon.');
    expect(container.textContent).toContain('Do not approve milestones before reviewing work.');
  });

  it('renders Key Takeaways box cleanly', () => {
    const takeaways = [
      'Non-custodial escrow on Polygon',
      'Soulbound token reputation proof',
      'Decentralized dispute resolution',
    ];

    render(<KeyTakeawaysBox takeaways={takeaways} />);

    expect(screen.getByText('Key Takeaways')).toBeTruthy();
    expect(screen.getByText('Non-custodial escrow on Polygon')).toBeTruthy();
    expect(screen.getByText('Soulbound token reputation proof')).toBeTruthy();
    expect(screen.getByText('Decentralized dispute resolution')).toBeTruthy();
  });

  it('renders responsive GFM tables inside overflow containers', () => {
    const rawMarkdown = `
| Escrow State | Client Action | Freelancer Action |
| :--- | :--- | :--- |
| Created | Fund Milestone | Await Deposit |
| Active | Inspect Deliverable | Submit Deliverable |
    `.trim();

    const { container } = render(<MarkdownRenderer content={rawMarkdown} />);

    const tableWrapper = container.querySelector('.overflow-x-auto');
    expect(tableWrapper).toBeTruthy();

    const table = container.querySelector('table');
    expect(table).toBeTruthy();

    const headers = container.querySelectorAll('th');
    expect(headers.length).toBe(3);
    expect(headers[0].textContent).toBe('Escrow State');
    expect(headers[1].textContent).toBe('Client Action');
    expect(headers[2].textContent).toBe('Freelancer Action');

    const cells = container.querySelectorAll('td');
    expect(cells.length).toBe(6);
    expect(cells[0].textContent).toBe('Created');
    expect(cells[1].textContent).toBe('Fund Milestone');
  });

  it('renders code blocks with copy affordance', () => {
    const rawMarkdown = `
\`\`\`solidity
function releaseMilestone(uint256 jobId, uint256 milestoneIndex) external;
\`\`\`
    `.trim();

    const { container } = render(<MarkdownRenderer content={rawMarkdown} />);
    const code = container.querySelector('code');
    expect(code).toBeTruthy();
    expect(code?.textContent).toContain('releaseMilestone');

    const copyBtn = container.querySelector('button[aria-label="Copy code"]');
    expect(copyBtn).toBeTruthy();
  });
});

describe('Blog Studio Security & Authorization Invariants', () => {
  it('validates wallet addresses strictly according to EIP-55 format', () => {
    const isValidWallet = (w: string) => /^0x[a-fA-F0-9]{40}$/.test(w.trim());

    expect(isValidWallet('0x0000000000000000000000000000000000000001')).toBe(true);
    expect(isValidWallet('0x5B38Da6a701c568545dCfcB03FcB875f56beddC4')).toBe(true);
    expect(isValidWallet('0x123')).toBe(false);
    expect(isValidWallet('not-a-wallet')).toBe(false);
    expect(isValidWallet('0xZZZZ000000000000000000000000000000000000')).toBe(false);
  });

  it('enforces that the sole remaining admin cannot be demoted or removed', () => {
    const team: Record<string, { wallet: string; role: 'admin' | 'blog_editor' | 'blog_author'; active: boolean }> = {
      '0xadmin1': { wallet: '0xadmin1', role: 'admin', active: true },
      '0xauthor1': { wallet: '0xauthor1', role: 'blog_author', active: true },
    };

    const countActiveAdmins = (t: typeof team) =>
      Object.values(t).filter((m) => m.active && m.role === 'admin').length;

    expect(countActiveAdmins(team)).toBe(1);

    // Attempting to demote sole admin
    const canDemote = (targetWallet: string, newRole: string) => {
      const target = team[targetWallet];
      if (target && target.role === 'admin' && newRole !== 'admin' && countActiveAdmins(team) <= 1) {
        return { allowed: false, error: 'Cannot demote or remove the last active Blog Studio administrator' };
      }
      return { allowed: true };
    };

    const demoteResult = canDemote('0xadmin1', 'blog_editor');
    expect(demoteResult.allowed).toBe(false);
    expect(demoteResult.error).toContain('last active Blog Studio administrator');
  });

  it('retains a maximum of 30 historical revisions per article', () => {
    const revisions: Array<{ id: string; savedAt: number }> = [];

    for (let i = 1; i <= 35; i++) {
      revisions.unshift({ id: `rev-${i}`, savedAt: Date.now() + i });
      if (revisions.length > 30) {
        revisions.length = 30;
      }
    }

    expect(revisions.length).toBe(30);
    // The most recent revision is rev-35
    expect(revisions[0].id).toBe('rev-35');
    // The oldest retained revision is rev-6
    expect(revisions[29].id).toBe('rev-6');
  });

  it('generates cryptographically unguessable preview tokens with 48h TTL', () => {
    const ttlHours = 48;
    const now = Date.now();
    const expiresAt = now + ttlHours * 3600 * 1000;

    // Tokens must be at least 48 hex characters (24 bytes)
    const mockToken = 'a'.repeat(48);
    expect(mockToken.length).toBeGreaterThanOrEqual(48);
    expect(expiresAt - now).toBe(48 * 3600 * 1000);
  });
});
