import React, { useState } from 'react';
import { CheckCircle2, Github, Palette, ShieldCheck, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { PortfolioLinkItem, UserProfile } from '../../types';
import { isDualVerified } from '../../utils/portfolioPlatforms';
import { PortfolioPreviewGrid } from '../common/PortfolioPreviewGrid';
import { PortfolioVerifierForm } from './PortfolioVerifierForm';
import { Button } from '../common/Button';

interface VerificationCredentialsHubProps {
  profile: UserProfile | null | undefined;
  isOwner?: boolean;
  onConnectGithub?: () => void;
  onSavePortfolio?: (data: {
    portfolioLinks: PortfolioLinkItem[];
    primaryDiscipline: string;
    portfolioVerified: boolean;
  }) => Promise<void> | void;
}

export const VerificationCredentialsHub: React.FC<VerificationCredentialsHubProps> = ({
  profile,
  isOwner = false,
  onConnectGithub,
  onSavePortfolio,
}) => {
  const portfolioCount = profile?.portfolioLinks?.length ?? 0;
  const isGithubVerified = Boolean(profile?.githubVerified);
  const isPortfolioVerified = Boolean(profile?.portfolioVerified && portfolioCount > 0);
  const dualVerified = isDualVerified(profile);

  const [isPortfolioEditorOpen, setIsPortfolioEditorOpen] = useState(false);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-5 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#0A52B8]">
            Verification &amp; Credentials
          </p>
          <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
            Cross-Skill Verification Tracks
          </h3>
          <p className="text-xs text-slate-600">
            Verify technical skills via GitHub and creative/non-tech expertise via external portfolio links under one profile.
          </p>
        </div>

        {dualVerified ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A52B8] text-white text-xs font-semibold shadow-2xs">
            <Sparkles size={13} />
            <span>Dual Verified • Tech &amp; Creative</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#0A52B8] border border-[#BFDBFE] text-[11px] font-semibold">
            <ShieldCheck size={13} />
            <span>{isGithubVerified || isPortfolioVerified ? '1 Track Verified' : 'Optional Track Proof'}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {/* Track 1: Developer & Tech Verification (GitHub) */}
        <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-white flex items-center justify-center shrink-0">
                  <Github size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block">
                    Developer &amp; Tech Verification
                  </span>
                  <span className="text-[11px] text-slate-500">GitHub Commit &amp; Repo Proof</span>
                </div>
              </div>

              {isGithubVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#0A52B8] border border-[#BFDBFE] text-[11px] font-semibold shrink-0">
                  <CheckCircle2 size={11} />
                  <span>Connected ✓</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200 text-[11px] font-medium shrink-0">
                  Not Connected
                </span>
              )}
            </div>

            {isGithubVerified && profile?.githubUsername ? (
              <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">GitHub Profile</span>
                  <a
                    href={`https://github.com/${profile.githubUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#0A52B8] hover:underline"
                  >
                    @{profile.githubUsername}
                  </a>
                </div>
                {typeof profile.primaryScore === 'number' && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Developer Score</span>
                    <span className="font-mono font-bold text-[#0F172A]">
                      {profile.primaryScore} / 1000
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Recommended for Development, Smart Contracts, AI Engineering, and Data contracts. Any freelancer can connect GitHub to unlock technical verification.
              </p>
            )}
          </div>

          {isOwner && !isGithubVerified && onConnectGithub && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onConnectGithub}
              icon={<Github size={14} />}
              className="w-full"
            >
              Connect GitHub Account
            </Button>
          )}
        </div>

        {/* Track 2: Creative & Portfolio Verification */}
        <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#0A52B8] text-white flex items-center justify-center shrink-0">
                  <Palette size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block">
                    Creative &amp; Portfolio Verification
                  </span>
                  <span className="text-[11px] text-slate-500">Behance · Dribbble · Figma · YouTube · Web</span>
                </div>
              </div>

              {isPortfolioVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#0A52B8] border border-[#BFDBFE] text-[11px] font-semibold shrink-0">
                  <CheckCircle2 size={11} />
                  <span>{portfolioCount} Portfolio {portfolioCount === 1 ? 'Link' : 'Links'} Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200 text-[11px] font-medium shrink-0">
                  Add Portfolio
                </span>
              )}
            </div>

            {portfolioCount > 0 ? (
              <div className="rounded-xl bg-white border border-slate-200 p-2.5">
                <PortfolioPreviewGrid
                  items={profile?.portfolioLinks}
                  discipline={profile?.primaryDiscipline}
                  verified={isPortfolioVerified}
                />
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Recommended for UI/UX Design, Video Editing, Creators, Marketing, and Writing contracts. Add up to 5 external portfolio showcase links.
              </p>
            )}
          </div>

          {isOwner && onSavePortfolio && (
            <Button
              variant={isPortfolioVerified ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setIsPortfolioEditorOpen((v) => !v)}
              icon={isPortfolioEditorOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              className="w-full"
            >
              {isPortfolioEditorOpen
                ? 'Hide Portfolio Editor'
                : isPortfolioVerified
                ? 'Manage Portfolio Links'
                : 'Connect Portfolio Links'}
            </Button>
          )}
        </div>
      </div>

      {isOwner && onSavePortfolio && isPortfolioEditorOpen && (
        <div className="pt-4 border-t border-slate-200">
          <PortfolioVerifierForm
            initialLinks={profile?.portfolioLinks || []}
            initialDiscipline={profile?.primaryDiscipline}
            submitLabel="Save & Verify Portfolio"
            onSave={async (data) => {
              await onSavePortfolio(data);
              setIsPortfolioEditorOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};
