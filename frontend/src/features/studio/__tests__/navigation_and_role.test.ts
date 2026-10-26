import { describe, it, expect } from 'vitest';
import { MORE_MENU_GROUPS } from '../../../config/navigation';

describe('Shared Navigation Config (MORE_MENU_GROUPS)', () => {
  it('has exactly 3 groups in the strictly specified order', () => {
    expect(MORE_MENU_GROUPS).toHaveLength(3);
    expect(MORE_MENU_GROUPS[0].title).toBe('Reputation & Governance');
    expect(MORE_MENU_GROUPS[1].title).toBe('Protocol');
    expect(MORE_MENU_GROUPS[2].title).toBe('Legal & Compliance');
  });

  it('Group 1 (Reputation & Governance) has correct items in order', () => {
    const items = MORE_MENU_GROUPS[0].items;
    expect(items).toHaveLength(4);
    expect(items[0]).toMatchObject({ label: 'Leaderboard & Reputation', to: '/reputation' });
    expect(items[1]).toMatchObject({ label: 'Attestation Reports', to: '/attestation' });
    expect(items[2]).toMatchObject({ label: 'DAO Governance', to: '/dao' });
    expect(items[3]).toMatchObject({ label: 'Judge Panel', to: '/judge' });
  });

  it('Group 2 (Protocol) has correct items in order', () => {
    const items = MORE_MENU_GROUPS[1].items;
    expect(items).toHaveLength(5);
    expect(items[0]).toMatchObject({ label: 'How It Works', to: '/how-it-works' });
    expect(items[1]).toMatchObject({ label: 'Fee Schedule', to: '/fees' });
    expect(items[2]).toMatchObject({ label: 'Security Architecture', to: '/security' });
    expect(items[3]).toMatchObject({ label: 'AuditX Security', to: '/auditx' });
    expect(items[4]).toMatchObject({ label: 'FAQ Hub', to: '/faq' });
  });

  it('Group 3 (Legal & Compliance) has correct items including Risk Notice at /disclaimer', () => {
    const items = MORE_MENU_GROUPS[2].items;
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ label: 'Terms of Service', to: '/terms' });
    expect(items[1]).toMatchObject({ label: 'Privacy Policy', to: '/privacy' });
    expect(items[2]).toMatchObject({ label: 'Risk Notice', to: '/disclaimer' });
  });

  it('excludes any internal/private studio or admin routes', () => {
    const allRoutes = MORE_MENU_GROUPS.flatMap((g) => g.items.map((i) => i.to));
    expect(allRoutes.some((r) => r.startsWith('/studio'))).toBe(false);
    expect(allRoutes.some((r) => r.startsWith('/admin'))).toBe(false);
  });
});
