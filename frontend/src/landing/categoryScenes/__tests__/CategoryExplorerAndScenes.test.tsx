import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getCategories } from '../../../utils/taxonomy';
import {
  resolveCategoryScene,
  ALL_SCENE_DESCRIPTORS,
} from '../index';
import { GenericScene } from '../GenericScene';
import { Web3Scene } from '../Web3Scene';
import { FrontendScene } from '../FrontendScene';
import { BackendScene } from '../BackendScene';
import { MobileScene } from '../MobileScene';
import { LandingCategoriesSection } from '../../../components/landing/LandingCategoriesSection';
import { setMotionMode } from '../../../media/useDataSaver';
import type { Job } from '../../../types';

describe('Category Scenes & Animated Explorer', () => {
  beforeEach(() => {
    setMotionMode('system');
  });

  it('maps every category in taxonomy.json to a non-fallback scene automatically', () => {
    const categories = getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(10);

    for (const cat of categories) {
      const resolved = resolveCategoryScene(cat);
      expect(resolved.key).not.toBe('generic');
      expect(resolved.durationMs).toBeGreaterThanOrEqual(3000);
      expect(resolved.durationMs).toBeLessThanOrEqual(5000);
    }
  });

  it('matches new future categories via keyword rules without code changes', () => {
    expect(resolveCategoryScene({ slug: 'rust-backend', name: 'Rust APIs', skills: ['Node.js', 'Postgres'] }).key).toBe('backend');
    expect(resolveCategoryScene({ slug: 'flutter-apps', name: 'Mobile Engineering', skills: ['Flutter', 'iOS'] }).key).toBe('mobile');
    expect(resolveCategoryScene({ slug: 'k8s-infra', name: 'Cloud Ops', skills: ['Kubernetes', 'Terraform'] }).key).toBe('devops');
    expect(resolveCategoryScene({ slug: 'pentest', name: 'Smart Contract Security', skills: ['Slither', 'Audit'] }).key).toBe('security');
    expect(resolveCategoryScene({ slug: 'e2e-qa', name: 'Quality Assurance', skills: ['Playwright', 'Cypress'] }).key).toBe('qa');
  });

  it('falls back to GenericScene and warns in dev when an unknown category is encountered', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const resolved = resolveCategoryScene({
      slug: 'quantum-gastronomy-unknown',
      name: 'Quantum Gastronomy',
      skills: ['Cryo Plating', 'Aroma Sync', 'Precision'],
    });
    expect(resolved.key).toBe('generic');
    expect(resolved.matchedBy).toBe('fallback');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Quantum Gastronomy'));
    warnSpy.mockRestore();
  });

  it('renders scenes strictly aria-hidden with 16:10 stage, light theme, and <= 60 animated elements', () => {
    const { container } = render(
      <div>
        <Web3Scene categoryName="Web3" categorySlug="web3" />
        <FrontendScene categoryName="Frontend" categorySlug="frontend" skills={['React', 'TypeScript']} />
        <BackendScene categoryName="Backend" categorySlug="backend" />
        <MobileScene categoryName="Mobile" categorySlug="mobile" />
        <GenericScene categoryName="Unknown" categorySlug="unknown" skills={['Alpha', 'Beta', 'Gamma']} />
      </div>
    );

    const svgs = container.querySelectorAll('svg[viewBox="0 0 640 400"]');
    expect(svgs.length).toBe(5);
    svgs.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.getAttribute('viewBox')).toBe('0 0 640 400');
      expect(svg.outerHTML.length).toBeLessThan(8192);
      const animNodes = svg.querySelectorAll('.pl-anim');
      expect(animNodes.length).toBeLessThan(60);
    });
  });

  it('honors Settings > Appearance reduced motion override immediately', () => {
    setMotionMode('reduced');
    const { container } = render(
      <Web3Scene categoryName="Web3" categorySlug="web3" />
    );
    const root = container.querySelector('[data-scene-state]');
    expect(root?.getAttribute('data-scene-state')).toBe('reduced');
  });

  it('renders Category Explorer with ARIA tabs, pill switching, and no invented open-job counts', async () => {
    render(
      <MemoryRouter>
        <LandingCategoriesSection jobs={[]} profiles={{}} />
      </MemoryRouter>
    );

    const tablist = screen.getByRole('tablist', { name: 'Work categories' });
    expect(tablist).toBeDefined();

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(getCategories().length);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');

    // Open-job counts must remain hidden when 0
    expect(screen.queryByText(/\d+ open job/i)).toBeNull();
    expect(screen.getAllByText(/Web Development/i).length).toBeGreaterThanOrEqual(1);

    // Every subcategory across all categories maps cleanly to a unique asset slug
    const allSubSlugs = getCategories().flatMap((c) => c.subcategories.map((s) => s.slug));
    expect(new Set(allSubSlugs).size).toBe(allSubSlugs.length);

    // Clicking second tab switches active category cleanly
    fireEvent.click(tabs[1]);
    await waitFor(() => {
      expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    });
  });

  it('displays real open jobs when > 0 without invented data', async () => {
    const realJobs: Job[] = [
      {
        id: 'job-real-101',
        title: 'Build Foundry Escrow Router',
        description: 'Architect non-custodial escrow contract.',
        category: 'web3-blockchain',
        skillsRequired: ['Solidity', 'Foundry'],
        amountEth: '450',
        amountUsdc: '450',
        paymentTokenSymbol: 'USDC',
        status: 'Open',
        client: '0x1111111111111111111111111111111111111111',
        createdAt: Date.now() - 3600_000,
        applications: [],
        milestones: [],
      } as unknown as Job,
    ];

    render(
      <MemoryRouter>
        <LandingCategoriesSection jobs={realJobs} profiles={{}} />
      </MemoryRouter>
    );

    const web3Tab = screen.getByRole('tab', { name: /Web3 & Blockchain/i });
    fireEvent.click(web3Tab);

    await waitFor(() => {
      expect(screen.getAllByText(/Build Foundry Escrow Router/i).length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getAllByText(/1 open job/i).length).toBeGreaterThanOrEqual(1);
  });

  it('verifies all descriptors in ALL_SCENE_DESCRIPTORS resolve cleanly', async () => {
    expect(ALL_SCENE_DESCRIPTORS.length).toBeGreaterThanOrEqual(16);
    for (const desc of ALL_SCENE_DESCRIPTORS) {
      const mod = await desc.load();
      expect(mod.default).toBeDefined();
    }
  });
});
