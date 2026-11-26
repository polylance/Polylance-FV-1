import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  isDualVerified,
  classifyJobVerificationTrack,
} from '../../../utils/portfolioPlatforms';
import { VerificationCredentialsHub } from '../VerificationCredentialsHub';
import { WhatIsPolyLanceSection } from '../../landing/BuiltOnPolyLanceSection';
import type { UserProfile } from '../../../types';

describe('Cross-Skill Verification & Kinetic Explainer', () => {
  it('detects Dual Verified status only when both GitHub and verified portfolio links exist', () => {
    expect(isDualVerified(null)).toBe(false);
    expect(isDualVerified({ githubVerified: true, portfolioVerified: false, portfolioLinks: [] })).toBe(false);
    expect(
      isDualVerified({
        githubVerified: true,
        portfolioVerified: true,
        portfolioLinks: [{ url: 'https://dribbble.com/demo' }],
      })
    ).toBe(true);
  });

  it('classifies Tech vs Non-Tech contracts accurately across disciplines', () => {
    expect(classifyJobVerificationTrack('Web3 & Blockchain', ['Solidity'])).toBe('tech');
    expect(classifyJobVerificationTrack('Development & IT', ['React'])).toBe('tech');
    expect(classifyJobVerificationTrack('Design & Creative', ['Figma'])).toBe('non-tech');
    expect(classifyJobVerificationTrack('Video, Audio & Animation', ['After Effects'])).toBe('non-tech');
    expect(classifyJobVerificationTrack('Marketing', ['SEO'])).toBe('non-tech');
  });

  it('renders both GitHub and Portfolio verification tracks side-by-side and shows Dual Verified badge', () => {
    const dualProfile: UserProfile = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      displayName: 'Alex Studio',
      skills: ['Solidity', 'UI/UX'],
      githubVerified: true,
      githubUsername: 'alexstudio',
      primaryScore: 840,
      portfolioVerified: true,
      portfolioLinks: [
        {
          id: 'pf1',
          url: 'https://figma.com/file/demo',
          title: 'Design System',
          platform: 'Figma',
        },
      ],
    };

    const onConnectGithub = vi.fn();
    render(
      <VerificationCredentialsHub
        profile={dualProfile}
        isOwner={true}
        onConnectGithub={onConnectGithub}
        onSavePortfolio={vi.fn()}
      />
    );

    expect(screen.getByText(/Dual Verified • Tech & Creative/i)).toBeTruthy();
    expect(screen.getByText(/Developer & Tech Verification/i)).toBeTruthy();
    expect(screen.getByText(/Creative & Portfolio Verification/i)).toBeTruthy();
    expect(screen.getByText(/1 Portfolio Link Verified/i)).toBeTruthy();
  });

  it('allows non-tech freelancers to connect GitHub and plays all 4 explainer videos sequentially without chrome clutter', async () => {
    const nonTechProfile: UserProfile = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      displayName: 'Mia Creative',
      skills: ['Motion Graphics'],
      freelancerTrack: 'non-tech',
      githubVerified: false,
      portfolioVerified: false,
    };

    const onConnectGithub = vi.fn();
    const { container } = render(
      <>
        <VerificationCredentialsHub
          profile={nonTechProfile}
          isOwner={true}
          onConnectGithub={onConnectGithub}
          onSavePortfolio={vi.fn()}
        />
        <WhatIsPolyLanceSection />
      </>
    );

    fireEvent.click(screen.getByRole('button', { name: /Connect GitHub Account/i }));
    expect(onConnectGithub).toHaveBeenCalledTimes(1);

    expect(screen.getByText(/Built to fix broken freelancing\./i)).toBeTruthy();
    expect(screen.queryByText(/Interactive Protocol Film/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Pause/i })).toBeNull();
    expect(screen.queryByText(/SCENE 01/i)).toBeNull();

    // Verify Scene 1 -> 2 -> 3 -> 4 -> 1 sequential playback onEnded without skipping scenes
    expect(screen.getByText(/20% fees\. 30-day holds\. Unpaid revisions\./i)).toBeTruthy();
    expect(container.querySelector('video')?.getAttribute('src')).toBe('/videos/explainer/scene-01-problem.mp4');

    fireEvent.ended(container.querySelector('video')!);
    expect(await screen.findByText(/Meet PolyLance\. Smart-contract escrow on Polygon\./i)).toBeTruthy();
    expect(container.querySelector('video')?.getAttribute('src')).toBe('/videos/explainer/scene-02-escrow.mp4');

    fireEvent.ended(container.querySelector('video')!);
    expect(await screen.findByText(/For developers, designers, editors & creators\./i)).toBeTruthy();
    expect(container.querySelector('video')?.getAttribute('src')).toBe('/videos/explainer/scene-03-talent.mp4');

    fireEvent.ended(container.querySelector('video')!);
    expect(await screen.findByText(/Approve work\. Settle in ~2 seconds\. 5% flat fee\./i)).toBeTruthy();
    expect(container.querySelector('video')?.getAttribute('src')).toBe('/videos/explainer/scene-04-settlement.mp4');
  });
});
