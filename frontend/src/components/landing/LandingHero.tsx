import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Search, ShieldCheck, Wallet, Zap } from 'lucide-react';

export type AudienceRole = 'freelancer' | 'client';

interface LandingHeroProps {
  audience?: AudienceRole;
  onAudienceChange?: (audience: AudienceRole) => void;
  onOpenVideo?: (videoId: string) => void;
}

const TRENDING_TAGS = [
  'Smart Contract Audits',
  'AI Agents',
  'Product Design',
  'Motion Graphics',
  'Full-Stack dApps',
];

const HERO_CARDS = [
  {
    title: 'Full-Stack dApps',
    tag: 'Polygon · Web3',
    image: '/images/showcase/fullstack-apps.webp',
    alt: 'Studio render of full-stack Web3 application dashboard',
  },
  {
    title: 'Smart Contracts',
    tag: 'Solidity · Verified',
    image: '/images/showcase/smart-contracts.webp',
    alt: 'Studio render of frosted glass and cobalt cryptographic cube',
  },
  {
    title: 'Motion Graphics',
    tag: '3D & Product Reels',
    image: '/images/showcase/motion-graphics.webp',
    alt: 'Studio render of sculpted cobalt and frosted glass motion ribbons',
  },
];

export const LandingHero: React.FC<LandingHeroProps> = ({ onOpenVideo }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/jobs?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/jobs');
    }
  };

  const handleTagClick = (tag: string) => {
    navigate(`/jobs?search=${encodeURIComponent(tag)}`);
  };

  return (
    <section aria-label="Hero" className="w-full bg-white pb-8 sm:pb-12">
      <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-10 pt-5 sm:pt-6">
        <div className="relative rounded-[28px] bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] border border-slate-200/80 overflow-hidden px-6 sm:px-10 lg:px-14 py-9 sm:py-12 lg:py-14">
          {/* Subtle Architectural Coordinate Grid */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(226, 232, 240, 0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(226, 232, 240, 0.45) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
              WebkitMaskImage:
                'radial-gradient(ellipse 85% 85% at 62% 50%, #000 35%, rgba(0,0,0,0.45) 75%, transparent 100%)',
              maskImage:
                'radial-gradient(ellipse 85% 85% at 62% 50%, #000 35%, rgba(0,0,0,0.45) 75%, transparent 100%)',
            }}
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* LEFT: Editorial Headline + Prominent Marketplace Search + Trending Pills + Trust Line */}
            <div className="lg:col-span-6 text-left space-y-5 sm:space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight text-[#0F172A] leading-[1.06]"
                style={{ textWrap: 'balance' }}
              >
                Find vetted builders &amp; creators{' '}
                <span className="text-[#0A52B8]">paid safely on-chain.</span>
              </motion.h1>

              {/* Prominent Hero Search Bar */}
              <motion.form
                onSubmit={handleSearch}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-xl bg-white border border-slate-200 shadow-sm p-1.5 flex items-center gap-2 max-w-xl"
              >
                <Search size={18} className="text-slate-400 ml-2.5 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Try smart contracts, UI design, AI agents..."
                  aria-label="Search marketplace services or jobs"
                  className="flex-1 min-w-0 bg-transparent px-2 py-2 text-[14px] sm:text-[15px] text-[#0F172A] placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#0A52B8] hover:bg-[#084298] text-white text-sm font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Search
                </button>
              </motion.form>

              {/* Quick Trending Filter Chips */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="text-xs font-mono text-slate-500 mr-1">Trending:</span>
                {TRENDING_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-[#0A52B8] hover:text-[#0A52B8] text-xs font-medium text-slate-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    {tag}
                  </button>
                ))}
              </motion.div>

              {/* Compact Trust Line + Optional 30s Overview Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-slate-200/80 text-xs font-mono text-slate-600"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#0A52B8] shrink-0" />
                  5% Flat Fee
                </span>
                <span className="hidden sm:inline text-slate-300" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Wallet size={14} className="text-[#0A52B8] shrink-0" />
                  Non-Custodial Polygon Escrow
                </span>
                <span className="hidden sm:inline text-slate-300" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap size={14} className="text-[#2563EB] shrink-0" />
                  Instant POL / USDC Settlement
                </span>
                {onOpenVideo && (
                  <button
                    type="button"
                    onClick={() => onOpenVideo('intro')}
                    className="inline-flex items-center gap-1 text-[#0A52B8] hover:underline font-sans font-semibold ml-auto cursor-pointer"
                  >
                    <Play size={12} className="fill-current" />
                    <span>Watch 30s overview</span>
                  </button>
                )}
              </motion.div>
            </div>

            {/* RIGHT: Curated Studio Artwork Collage (3 Staggered Floating Deliverable Cards) */}
            <div className="lg:col-span-6">
              <div className="grid grid-cols-12 gap-3.5 sm:gap-4 items-center">
                {/* Large Featured dApp Mockup Left */}
                <div className="col-span-7 space-y-3.5 sm:space-y-4">
                  <div className="pl-float-a group relative rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-[0_14px_38px_rgba(15,23,42,0.08)]">
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      <img
                        src={HERO_CARDS[0].image}
                        alt={HERO_CARDS[0].alt}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="px-3.5 py-2.5 flex items-center justify-between bg-white border-t border-slate-100">
                      <span className="text-xs font-semibold text-[#0F172A]">{HERO_CARDS[0].title}</span>
                      <span className="text-[10.5px] font-mono text-[#0A52B8] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
                        {HERO_CARDS[0].tag}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Two Stacked Right Studio Cards */}
                <div className="col-span-5 space-y-3.5 sm:space-y-4 pt-3 sm:pt-5">
                  <div
                    className="pl-float-b group relative rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-[0_12px_32px_rgba(10,82,184,0.08)]"
                    style={{ animationDelay: '0.4s' }}
                  >
                    <div className="aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={HERO_CARDS[1].image}
                        alt={HERO_CARDS[1].alt}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="px-3 py-2 flex items-center justify-between bg-white border-t border-slate-100">
                      <span className="text-[11.5px] font-semibold text-[#0F172A] truncate">{HERO_CARDS[1].title}</span>
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" />
                    </div>
                  </div>

                  <div
                    className="pl-float-a group relative rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-[0_12px_32px_rgba(15,23,42,0.07)]"
                    style={{ animationDelay: '0.9s' }}
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={HERO_CARDS[2].image}
                        alt={HERO_CARDS[2].alt}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="px-3 py-2 flex items-center justify-between bg-white border-t border-slate-100">
                      <span className="text-[11.5px] font-semibold text-[#0F172A] truncate">{HERO_CARDS[2].title}</span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">Studio 3D</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
