import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  PlusCircle,
  ArrowRight,
  Lock,
  CheckCircle2,
  ExternalLink,
  Code2,
  Globe,
  Server,
  Smartphone,
  Scale,
  ChevronDown,
  Award,
  MessageSquare,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  Check
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { VideoSlot, DeviceFrame } from '../components/video';
import { ProductPreview } from '../components/ProductPreview';
import { Button } from '../components/common/Button';
import { Reveal, CountUp } from '../components/common/MotionPrimitives';
import { CATEGORIES } from '../utils/formatters';
import { CategoriesSection } from '../components/category';
import { SecurityShowcase } from '../components/escrow';
import { HeroVideoFrame } from '../components/hero';
import { CtaSection } from '../components/cta';
import { getVideo } from '../media';
import { useReducedMotion } from '../media/useDataSaver';

interface LandingVisitorProps {
  jobs: any[];
  profiles: Record<string, any>;
}

export const LandingVisitor: React.FC<LandingVisitorProps> = ({ jobs, profiles }) => {
  const reducedMotion = useReducedMotion();

  // ── 1. STATS (Real numbers only, never fabricated) ──
  const validJobs = (jobs || []).filter((j) => !j.isDemo);
  const completedJobs = validJobs.filter((j) => j.status === 'Completed').length;
  const verifiedProfiles = Object.keys(profiles || {}).length;
  const totalEscrowUsdc = Math.round(
    validJobs.reduce((acc, j) => acc + (parseFloat(j.amountUsdc || '0') || 0), 0)
  );

  // ── 2. HERO STATUS CHIPS STAGGER ──
  const [chipsVisible, setChipsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) {
      setChipsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setChipsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [reducedMotion]);

  // ── 4. CONDITIONAL PEOPLE SECTION ──
  const founderVideo = getVideo('founder-intro');
  const storyFreelancerVideo = getVideo('story-freelancer');
  const hasReadyPeople = Boolean(
    (founderVideo?.status === 'ready' && (founderVideo.sources?.webm || founderVideo.sources?.mp4)) ||
    (storyFreelancerVideo?.status === 'ready' && (storyFreelancerVideo.sources?.webm || storyFreelancerVideo.sources?.mp4))
  );

  // ── 5. FAQ ACCORDION ──
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const faqs = [
    {
      q: 'How does smart contract escrow protect clients and freelancers?',
      a: 'Funds are locked in a smart contract on Polygon before project work begins. The client is protected because funds are not released until deliverables are reviewed and approved. The freelancer is protected because funds are deposited in advance and cannot be unilaterally pulled back.',
    },
    {
      q: 'What is the platform fee?',
      a: 'PolyLance charges a flat 2.5% platform fee on milestone release to cover decentralized arbitration and protocol infrastructure. Client deposits include 2.5% and freelancers receive milestone funds net of 2.5%. There are zero withdrawal fees and zero monthly subscription charges.',
    },
    {
      q: 'What are verified work certificates?',
      a: 'When an escrow milestone is approved and released, a non-transferable ERC-721 certificate is minted directly to the freelancer’s connected wallet. It serves as permanent, verifiable on-chain proof of your delivered work and client rating.',
    },
    {
      q: 'How are disputes resolved?',
      a: 'If an issue arises that cannot be resolved directly, either party can trigger the dispute arbitration window. Independent peer judges review contract deliverables, specifications, and records to issue an on-chain verdict.',
    },
    {
      q: 'Which currencies are supported?',
      a: 'PolyLance operates on Polygon with fast, sub-cent transaction fees. Milestone budgets can be funded in native POL or dollar-pegged USDC.',
    },
  ];

  return (
    <div className="w-full text-[#0B0B0F] font-sans">

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. HERO (White Band) */}
      {/* ────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="w-full bg-white py-16 sm:py-20 lg:py-24 border-b border-[#E5E7EB]">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Eyebrow */}
              <div className="text-eyebrow">
                Escrow-protected freelancing on Polygon
              </div>

              {/* Display Headline */}
              <h1 className="text-display text-[#0B0B0F]">
                Get paid safely for every milestone.
              </h1>

              {/* Lead Paragraph */}
              <p className="text-lead">
                PolyLance locks project funds in escrow smart contracts on Polygon. Clients review work before releasing payment, and freelancers receive funds directly to their wallet with verified completion certificates.
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Button
                  as="Link"
                  to="/jobs"
                  variant="primary"
                  size="lg"
                  leadingIcon={<Search size={18} strokeWidth={2.5} />}
                  trailingIcon={<ArrowRight size={18} strokeWidth={2.5} />}
                  className="w-full sm:w-auto"
                >
                  Find work
                </Button>

                <Button
                  as="Link"
                  to="/jobs/post"
                  variant="secondary"
                  size="lg"
                  leadingIcon={<PlusCircle size={18} strokeWidth={2} className="text-[#0047AB]" />}
                  className="w-full sm:w-auto"
                >
                  Hire talent
                </Button>

                <Button
                  as="Link"
                  to="/demo"
                  variant="ghost"
                  size="lg"
                  trailingIcon={<ArrowRight size={18} />}
                  className="px-2 py-3 text-center sm:text-left"
                >
                  Try the demo
                </Button>
              </div>

              {/* Microcopy row */}
              <div className="pt-2 text-xs text-[#4B5563] flex items-center flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#0B0B0F]">
                  <ShieldCheck size={14} className="text-[#0047AB]" />
                  Escrow-protected
                </span>
                <span>•</span>
                <span>Platform fee 2.5%</span>
                <span>•</span>
                <span>Built on Polygon</span>
              </div>
            </div>

            {/* Right Column: Hero Media & 3 Slogan Video Acts */}
            <div className="lg:col-span-5">
              <HeroVideoFrame />
            </div>

          </div>
        </PageContainer>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. PROOF STRIP (Light Gray Band #F6F7F9) */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="w-full bg-[#F6F7F9] py-14 border-b border-[#E5E7EB]">
        <PageContainer>
          <Reveal>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E7EB]">

                {/* Stat 1 */}
                <div className="text-center sm:text-left sm:pr-6 space-y-1">
                  <div className="stat-numeral text-[#0B0B0F]">
                    <CountUp value={verifiedProfiles} durationMs={1200} />
                  </div>
                  <div className="text-sm font-semibold text-[#0B0B0F]">Verified Profiles</div>
                  <div className="text-xs text-[#4B5563]">Registered freelancers & clients on Polygon</div>
                </div>

                {/* Stat 2 */}
                <div className="text-center sm:text-left sm:px-6 pt-6 sm:pt-0 space-y-1">
                  <div className="stat-numeral text-[#0B0B0F]">
                    <CountUp value={completedJobs} durationMs={1200} />
                  </div>
                  <div className="text-sm font-semibold text-[#0B0B0F]">Completed Projects</div>
                  <div className="text-xs text-[#4B5563]">Milestones delivered and approved</div>
                </div>

                {/* Stat 3 */}
                <div className="text-center sm:text-left sm:pl-6 pt-6 sm:pt-0 space-y-1">
                  <div className="stat-numeral text-[#0B0B0F]">
                    $<CountUp value={totalEscrowUsdc} durationMs={1400} />
                  </div>
                  <div className="text-sm font-semibold text-[#0B0B0F]">Total Value Settled</div>
                  <div className="text-xs text-[#4B5563]">Escrow volume transacted on Polygon Mainnet</div>
                </div>

              </div>

              {/* As of date and verification link */}
              <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#4B5563]">
                <div>As of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • Direct smart contract queries</div>
                <a
                  href="https://polygonscan.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0047AB] hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <span>Verify on Polygonscan</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </Reveal>
        </PageContainer>
      </section>



      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. FEATURES, BENTO GRID (Light Gray Band #F6F7F9) */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="w-full bg-[#F6F7F9] py-20 sm:py-24 border-b border-[#E5E7EB]">
        <PageContainer>
          <div className="space-y-12">

            <Reveal>
              <div className="max-w-2xl space-y-3 text-left">
                <div className="text-eyebrow">Features</div>
                <h2 className="text-landing-h2 text-[#0B0B0F]">
                  Built for clarity, speed and security.
                </h2>
                <p className="text-lead">
                  Transparent platform fee, non-custodial milestone smart contracts, and direct peer settlements on Polygon.
                </p>
              </div>
            </Reveal>

            {/* 6-Tile Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">

              {/* Tile 1: Escrow vault */}
              <Reveal delay={50}>
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 flex flex-col justify-between space-y-5 h-full">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-[4px] bg-[#F3F4F6] text-[#4B5563]">
                        Smart Contract
                      </span>
                      <Lock size={16} className="text-[#0047AB]" />
                    </div>
                    <h3 className="text-landing-h3 text-[#0B0B0F]">Escrow vault</h3>
                    <p className="text-sm text-[#4B5563]">
                      Milestone funds are locked in isolated smart contracts on Polygon until approved.
                    </p>
                  </div>
                  {/* Mini UI Snippet */}
                  <div className="p-3 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] space-y-1.5 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-[#4B5563]">Escrow balance</span>
                      <span className="font-semibold text-[#0B0B0F] tabular-nums">2,500 USDC</span>
                    </div>
                    <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#0047AB] h-full w-3/5" />
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Tile 2: Verified work certificates */}
              <Reveal delay={100}>
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 flex flex-col justify-between space-y-5 h-full">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-[4px] bg-[#F3F4F6] text-[#4B5563]">
                        Reputation
                      </span>
                      <Award size={16} className="text-[#0047AB]" />
                    </div>
                    <h3 className="text-landing-h3 text-[#0B0B0F]">Verified work certificates</h3>
                    <p className="text-sm text-[#4B5563]">
                      Every completed contract issues a tamper-proof certificate directly to your wallet.
                    </p>
                  </div>
                  {/* Mini UI Snippet */}
                  <div className="p-3 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#10B981]" />
                      <span className="font-medium text-[#0B0B0F]">Certificate #3821</span>
                    </div>
                    <span className="font-mono text-[#0047AB] text-[11px]">Polygon PoS</span>
                  </div>
                </div>
              </Reveal>

              {/* Tile 3: Dispute resolution */}
              <Reveal delay={150}>
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 flex flex-col justify-between space-y-5 h-full">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-[4px] bg-[#F3F4F6] text-[#4B5563]">
                        Arbitration
                      </span>
                      <Scale size={16} className="text-[#0047AB]" />
                    </div>
                    <h3 className="text-landing-h3 text-[#0B0B0F]">Dispute resolution</h3>
                    <p className="text-sm text-[#4B5563]">
                      Independent peer judges evaluate specifications and deliverables if terms are contested.
                    </p>
                  </div>
                  {/* Mini UI Snippet */}
                  <div className="p-3 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#4B5563]">Peer review panel</span>
                      <span className="font-semibold text-[#0B0B0F]">3 of 3 consensus</span>
                    </div>
                    <div className="text-[11px] text-[#166534] font-medium">Objective verdict delivered</div>
                  </div>
                </div>
              </Reveal>

              {/* Tile 4: Your reputation is yours */}
              <Reveal delay={200}>
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 flex flex-col justify-between space-y-5 h-full">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-[4px] bg-[#F3F4F6] text-[#4B5563]">
                        Portability
                      </span>
                      <ShieldCheck size={16} className="text-[#0047AB]" />
                    </div>
                    <h3 className="text-landing-h3 text-[#0B0B0F]">Your reputation is yours</h3>
                    <p className="text-sm text-[#4B5563]">
                      No closed database lock-in. Your ratings, skills, and history remain in your wallet forever.
                    </p>
                  </div>
                  {/* Mini UI Snippet */}
                  <div className="p-3 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#4B5563] block text-[11px]">Rating Score</span>
                      <span className="font-bold text-sm text-[#0B0B0F]">4.95 / 5.0</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#4B5563] block text-[11px]">Completed</span>
                      <span className="font-bold text-sm text-[#0047AB] tabular-nums">28 Jobs</span>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Tile 5: Encrypted messaging */}
              <Reveal delay={250}>
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 flex flex-col justify-between space-y-5 h-full">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-[4px] bg-[#F3F4F6] text-[#4B5563]">
                        Privacy
                      </span>
                      <MessageSquare size={16} className="text-[#0047AB]" />
                    </div>
                    <h3 className="text-landing-h3 text-[#0B0B0F]">Encrypted messaging</h3>
                    <p className="text-sm text-[#4B5563]">
                      Wallet-to-wallet secure communications keep client specs and proposals confidential.
                    </p>
                  </div>
                  {/* Mini UI Snippet */}
                  <div className="p-3 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-[#166534] font-medium text-[11px]">
                      <Lock size={12} /> End-to-end encrypted
                    </div>
                    <p className="text-[#4B5563] truncate">Deliverables posted for Milestone 2...</p>
                  </div>
                </div>
              </Reveal>

              {/* Tile 6: Transparent fees */}
              <Reveal delay={300}>
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 flex flex-col justify-between space-y-5 h-full">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-[4px] bg-[#F3F4F6] text-[#4B5563]">
                        Pricing
                      </span>
                      <DollarSign size={16} className="text-[#0047AB]" />
                    </div>
                    <h3 className="text-landing-h3 text-[#0B0B0F]">Transparent fees</h3>
                    <p className="text-sm text-[#4B5563]">
                      Simple flat 2.5% platform fee on milestone release. Zero surprises and no payment delays.
                    </p>
                  </div>
                  {/* Mini UI Snippet */}
                  <div className="p-3 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] flex items-center justify-between text-xs">
                    <span className="text-[#4B5563]">Platform fee</span>
                    <span className="font-bold text-[#0B0B0F] tabular-nums">2.5% flat</span>
                  </div>
                </div>
              </Reveal>

            </div>

          </div>
        </PageContainer>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. TWO AUDIENCES (White Band) */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="w-full bg-white py-20 sm:py-24 border-b border-[#E5E7EB]">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 text-left">

            {/* For Freelancers */}
            <Reveal delay={50}>
              <div className="bg-[#F6F7F9] border border-[#E5E7EB] rounded-[12px] p-7 sm:p-8 flex flex-col justify-between space-y-6 h-full">
                <div className="space-y-4">
                  <div className="text-eyebrow">For freelancers</div>
                  <h3 className="text-landing-h2 text-[#0B0B0F]">
                    Work with payment confidence.
                  </h3>

                  <ul className="space-y-3 pt-2 text-sm text-[#374151]">
                    <li className="flex items-start gap-2.5">
                      <Check size={18} className="text-[#0047AB] shrink-0 mt-0.5" />
                      <span>Funds deposited in escrow before you start development</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check size={18} className="text-[#0047AB] shrink-0 mt-0.5" />
                      <span>Direct wallet payouts on milestone approval with low Polygon gas fees</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check size={18} className="text-[#0047AB] shrink-0 mt-0.5" />
                      <span>Verifiable work history certificates minted to your wallet</span>
                    </li>
                  </ul>

                  {/* Media preview */}
                  <div className="pt-2">
                    <ProductPreview variant="work" />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    as="Link"
                    to="/jobs"
                    variant="primary"
                    size="lg"
                    trailingIcon={<ArrowRight size={16} />}
                    className="w-full sm:w-auto"
                  >
                    Find freelance jobs
                  </Button>
                </div>
              </div>
            </Reveal>

            {/* For Clients */}
            <Reveal delay={150}>
              <div className="bg-[#F6F7F9] border border-[#E5E7EB] rounded-[12px] p-7 sm:p-8 flex flex-col justify-between space-y-6 h-full">
                <div className="space-y-4">
                  <div className="text-eyebrow">For clients</div>
                  <h3 className="text-landing-h2 text-[#0B0B0F]">
                    Hire verified talent on your terms.
                  </h3>

                  <ul className="space-y-3 pt-2 text-sm text-[#374151]">
                    <li className="flex items-start gap-2.5">
                      <Check size={18} className="text-[#0047AB] shrink-0 mt-0.5" />
                      <span>Release funds only when delivered code meets specifications</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check size={18} className="text-[#0047AB] shrink-0 mt-0.5" />
                      <span>Inspect GitHub commit hashes and work attestations directly</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check size={18} className="text-[#0047AB] shrink-0 mt-0.5" />
                      <span>Transparent 2.5% protocol fee with no hidden transaction spreads</span>
                    </li>
                  </ul>

                  {/* Media preview */}
                  <div className="pt-2">
                    <ProductPreview variant="hire" />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    as="Link"
                    to="/jobs/post"
                    variant="secondary"
                    size="lg"
                    leadingIcon={<PlusCircle size={16} className="text-[#0047AB]" />}
                    className="w-full sm:w-auto"
                  >
                    Post a freelance project
                  </Button>
                </div>
              </div>
            </Reveal>

          </div>
        </PageContainer>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 6. CATEGORIES (White Band, Outline Icons) */}
      {/* ────────────────────────────────────────────────────────── */}
      <CategoriesSection />

      {/* ────────────────────────────────────────────────────────── */}
      {/* 7. SAFE BY DESIGN (The ONE Near-Black Band #0B0B0F) */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="w-full bg-[#0B0B0F] text-white py-20 sm:py-24 border-b border-black">
        <PageContainer>
          <SecurityShowcase />
        </PageContainer>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 8. PEOPLE (White Band - Rendered ONLY if ready) */}
      {/* ────────────────────────────────────────────────────────── */}
      {hasReadyPeople && (
        <section className="w-full bg-white py-16 border-b border-[#E5E7EB]">
          <PageContainer>
            <div className="max-w-2xl text-left space-y-3">
              <div className="text-eyebrow">Community & Stories</div>
              <h2 className="text-landing-h2 text-[#0B0B0F]">
                Built by developers for developers.
              </h2>
              <p className="text-lead">
                Hear directly from the team and verified contributors building on Polygon.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <VideoSlot id="founder-intro" />
              <VideoSlot id="story-freelancer" />
            </div>
          </PageContainer>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 9. FAQ (Light Gray Band #F6F7F9, 720px wide accordion) */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="w-full bg-[#F6F7F9] py-20 sm:py-24 border-b border-[#E5E7EB]">
        <PageContainer>
          <div className="max-w-[720px] mx-auto text-left space-y-10">

            <Reveal>
              <div className="space-y-3 text-center sm:text-left">
                <div className="text-eyebrow">Frequently asked questions</div>
                <h2 className="text-landing-h2 text-[#0B0B0F]">
                  Everything you need to know.
                </h2>
              </div>
            </Reveal>

            {/* Accordion with Smooth Grid Template Rows */}
            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;

                return (
                  <Reveal key={faq.q} delay={idx * 40}>
                    <div
                      className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-[#0B0B0F] hover:text-[#0047AB] transition-colors cursor-pointer select-none"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          size={18}
                          className={`text-[#4B5563] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#0047AB]' : ''
                            }`}
                        />
                      </button>

                      <div
                        className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                          }`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-5 pb-5 text-sm text-[#4B5563] leading-relaxed border-t border-[#F3F4F6] pt-3">
                            {faq.a}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

          </div>
        </PageContainer>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 10. FINAL CTA (Rich Cobalt Gradient Band) */}
      {/* ────────────────────────────────────────────────────────── */}
      <CtaSection />

      {/* ────────────────────────────────────────────────────────── */}
      {/* 11. FOOTER (Near-Black, Flat #0B0B0F) */}
      {/* ────────────────────────────────────────────────────────── */}
      <footer className="w-full bg-[#0B0B0F] text-white py-16 border-t border-black">
        <PageContainer>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left text-xs">

            {/* Col 1 */}
            <div className="space-y-3">
              <div className="font-semibold text-white text-sm">Product</div>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/jobs" className="hover:text-white transition-colors">Find Jobs</Link></li>
                <li><Link to="/jobs/post" className="hover:text-white transition-colors">Post a Job</Link></li>
                <li><Link to="/workspace" className="hover:text-white transition-colors">Workspace</Link></li>
                <li><Link to="/demo" className="hover:text-white transition-colors">Try Demo</Link></li>
              </ul>
            </div>

            {/* Col 2 */}
            <div className="space-y-3">
              <div className="font-semibold text-white text-sm">Protocol</div>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/reputation" className="hover:text-white transition-colors">Reputation</Link></li>
                <li><Link to="/judge" className="hover:text-white transition-colors">Judge Panel</Link></li>
                <li><Link to="/dao" className="hover:text-white transition-colors">Governance</Link></li>
                <li><Link to="/treasury" className="hover:text-white transition-colors">Treasury</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-3">
              <div className="font-semibold text-white text-sm">Resources</div>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/audit" className="hover:text-white transition-colors">Audit Report</Link></li>
                <li><Link to="/attestation" className="hover:text-white transition-colors">Job Attestations</Link></li>
                <li><Link to="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-3">
              <div className="font-semibold text-white text-sm">Legal</div>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
                <li><span className="text-gray-400">© {new Date().getFullYear()} PolyLance</span></li>
              </ul>
            </div>

          </div>
        </PageContainer>
      </footer>

    </div>
  );
};
