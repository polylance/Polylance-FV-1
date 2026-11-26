import React, { useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Users,
  ChevronRight,
  PlusCircle,
  AlertCircle,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { getCategoryBySlug, getCategoryThemeStyles } from '../utils/taxonomy';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { formatAmount } from '../utils/formatAmount';
import { truncateAddress } from '../utils/formatters';
import { resolveCategoryScene, extractCategorySkills } from '../landing/categoryScenes';
import { LazyCategoryScene } from '../landing/categoryScenes/LazyCategoryScene';

export const CategoryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const subParam = searchParams.get('sub') || 'all';

  const category = useMemo(() => (slug ? getCategoryBySlug(slug) : undefined), [slug]);
  const { jobs, profiles } = usePolyLanceData();

  const [activeTab, setActiveTab] = useState<'jobs' | 'specialists'>('jobs');
  const [selectedSub, setSelectedSub] = useState<string>(subParam);
  const [tokenFilter, setTokenFilter] = useState<'ALL' | 'POL' | 'USDC'>('ALL');
  const [showBlueprint, setShowBlueprint] = useState<boolean>(false);

  if (!category) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-[#DC2626] mb-3" />
        <h1 className="text-xl font-bold text-[#0B0B0F]">Category Not Found</h1>
        <p className="text-sm text-[#6B7280] mt-1 max-w-md">
          The requested category &ldquo;{slug}&rdquo; does not exist in our 10-domain taxonomy.
        </p>
        <Link
          to="/categories"
          className="mt-4 px-4 py-2 bg-[#0047AB] text-white rounded-[8px] text-xs font-semibold hover:bg-[#00388A] active:scale-[0.98] transition-[transform,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:ring-offset-2"
        >
          View all 10 categories
        </Link>
      </div>
    );
  }

  const theme = getCategoryThemeStyles(category.themeColor);

  // Filter real jobs
  const categoryJobs = useMemo(() => {
    return (jobs || []).filter((j) => {
      const matchCat =
        j.category?.toLowerCase() === category.slug ||
        j.category?.toLowerCase() === category.name.toLowerCase() ||
        (j.skillsRequired &&
          category.subcategories.some((sub) =>
            sub.skills.some((s) => j.skillsRequired?.includes(s))
          ));

      if (!matchCat) return false;

      if (tokenFilter !== 'ALL') {
        const isUsdc = j.paymentTokenSymbol === 'USDC';
        if (tokenFilter === 'USDC' && !isUsdc) return false;
        if (tokenFilter === 'POL' && isUsdc) return false;
      }

      if (selectedSub !== 'all') {
        const sub = category.subcategories.find((s) => s.slug === selectedSub || s.id === selectedSub);
        if (sub) {
          const hasSkill = sub.skills.some((s) => j.skillsRequired?.includes(s));
          if (!hasSkill && (j as any).subcategory !== sub.slug) return false;
        }
      }

      return true;
    });
  }, [jobs, category, selectedSub, tokenFilter]);

  // Real specialists / profiles matching category
  const categorySpecialists = useMemo(() => {
    return Object.entries(profiles || {}).filter(([_, p]) => {
      if (p.primaryCategory === category.slug || p.primaryCategory === category.id) return true;
      if (p.skills && category.subcategories.some((sub) => sub.skills.some((s) => p.skills?.includes(s)))) {
        return true;
      }
      return false;
    });
  }, [profiles, category]);

  const handleSubChange = (newSub: string) => {
    setSelectedSub(newSub);
    if (newSub === 'all') {
      searchParams.delete('sub');
    } else {
      searchParams.set('sub', newSub);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#0B0B0F] pb-24">
      {/* Breadcrumb & Header Banner */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#6B7280]">
            <Link to="/" className="hover:text-[#0B0B0F] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0047AB] rounded">Home</Link>
            <ChevronRight size={12} />
            <Link to="/categories" className="hover:text-[#0B0B0F] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0047AB] rounded">Categories</Link>
            <ChevronRight size={12} />
            <span className="font-semibold text-[#0B0B0F]">{category.name}</span>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[6px] ${theme.bg} ${theme.text}`}>
                  Discipline Hub
                </span>
                <span className="text-xs text-[#6B7280]">Polygon Mainnet</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B0B0F]">
                {category.name}
              </h1>
              <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
                {category.description}
              </p>
              <div className="pt-1">
                <Link
                  to={`/jobs/post?category=${category.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#0047AB] hover:bg-[#00388A] text-white text-xs font-bold active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:ring-offset-2 transition-[transform,background-color] duration-150 shadow-xs"
                >
                  <PlusCircle size={15} />
                  <span>Post Job in this Category</span>
                </Link>
              </div>
            </div>

            {/* Category Scene Header Illustration (same playback rules) */}
            <div className="w-full max-w-[360px] shrink-0">
              <LazyCategoryScene
                descriptor={resolveCategoryScene(category)}
                categoryName={category.name}
                categorySlug={category.slug}
                skills={extractCategorySkills(category)}
                playbackMode="interactive"
                isActive={true}
              />
            </div>
          </div>

          {/* Subcategory Filter Pills */}
          <div className="mt-8 pt-4 border-t border-[#F3F4F6] overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 min-w-max pb-1">
              <button
                type="button"
                onClick={() => handleSubChange('all')}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-medium cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] transition-[transform,background-color,color] duration-100 ${
                  selectedSub === 'all'
                    ? 'bg-[#0B0B0F] text-white font-semibold shadow-xs'
                    : 'bg-[#F6F7F9] text-[#4B5563] hover:text-[#0B0B0F] border border-[#E5E7EB]'
                }`}
              >
                All Subcategories ({category.subcategories.length})
              </button>
              {category.subcategories.map((sub) => {
                const isSelected = selectedSub === sub.slug || selectedSub === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSubChange(sub.slug)}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-medium cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] transition-[transform,background-color,color] duration-100 ${
                      isSelected
                        ? 'bg-[#0047AB] text-white font-semibold shadow-xs'
                        : 'bg-[#F6F7F9] text-[#4B5563] hover:text-[#0B0B0F] border border-[#E5E7EB]'
                    }`}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation Tabs & Secondary Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className={`px-3.5 py-2 rounded-[8px] text-xs font-semibold flex items-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] transition-[transform,background-color,color] duration-150 ${
                activeTab === 'jobs'
                  ? 'bg-white text-[#0047AB] border border-[#E5E7EB] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#0B0B0F]'
              }`}
            >
              <Briefcase size={14} />
              <span>Available Jobs ({categoryJobs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specialists')}
              className={`px-3.5 py-2 rounded-[8px] text-xs font-semibold flex items-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] transition-[transform,background-color,color] duration-150 ${
                activeTab === 'specialists'
                  ? 'bg-white text-[#0047AB] border border-[#E5E7EB] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#0B0B0F]'
              }`}
            >
              <Users size={14} />
              <span>Specialists ({categorySpecialists.length})</span>
            </button>
          </div>

          {activeTab === 'jobs' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B7280] font-medium">Currency:</span>
              {(['ALL', 'USDC', 'POL'] as const).map((tok) => (
                <button
                  key={tok}
                  type="button"
                  onClick={() => setTokenFilter(tok)}
                  className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] transition-[transform,background-color,color] duration-100 ${
                    tokenFilter === tok
                      ? 'bg-[#0047AB] text-white border-[#0047AB]'
                      : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:text-[#0B0B0F]'
                  }`}
                >
                  {tok}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB 1: Real Jobs Listing */}
        {activeTab === 'jobs' && (
          <div className="mt-6">
            {categoryJobs.length === 0 ? (
              <div className="space-y-6">
                <div className="bg-white border border-[#E5E7EB] ring-1 ring-black/[0.03] rounded-[16px] p-10 text-center max-w-xl mx-auto shadow-xs space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#0047AB]/10 text-[#0047AB] flex items-center justify-center mx-auto">
                    <Briefcase size={22} />
                  </div>
                  <h3 className="text-base font-bold text-[#0B0B0F]">
                    No active jobs in this category yet
                  </h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    Every job on PolyLance is backed by a non-custodial smart contract escrow on Polygon.
                    Be the first client to publish an opportunity in <strong>{category.name}</strong>.
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      to={`/jobs/post?category=${category.slug}`}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0047AB] text-white text-xs font-semibold rounded-[8px] hover:bg-[#00388A] active:scale-[0.98] transition-[transform,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
                    >
                      <PlusCircle size={14} />
                      <span>Post the First Job</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowBlueprint(!showBlueprint)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#F6F7F9] hover:bg-[#E5E7EB] text-[#0B0B0F] border border-[#E5E7EB] text-xs font-semibold rounded-[8px] active:scale-[0.98] transition-[transform,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
                    >
                      <FileCode size={14} className="text-[#0047AB]" />
                      <span>{showBlueprint ? 'Hide Escrow Blueprint' : 'Inspect Sample Blueprint'}</span>
                    </button>
                  </div>
                </div>

                {/* Educational Blueprint Demonstration (100% Honest, No Fake Data) */}
                {showBlueprint && (
                  <div className="max-w-3xl mx-auto bg-white border-2 border-[#0047AB]/20 rounded-[16px] p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-[#0047AB]" />
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0047AB]">
                          Escrow Architecture Blueprint • {category.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#6B7280] bg-[#F6F7F9] px-2 py-0.5 rounded border border-[#E5E7EB]">
                        EDUCATIONAL DEMO
                      </span>
                    </div>

                    <p className="text-xs text-[#4B5563] leading-relaxed">
                      This blueprint demonstrates how contracts in <strong>{category.name}</strong> are executed on Polygon. Funds never touch a centralized company account; they reside in a sovereign clone contract with 7-day review windows.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 font-mono text-xs">
                      <div className="p-3 bg-[#FBFBFC] rounded-[8px] border border-[#E5E7EB] space-y-1">
                        <span className="text-[10px] text-[#0047AB] font-bold block">MILESTONE 01 (30%)</span>
                        <strong className="text-[#0B0B0F] block">Scope & Architecture</strong>
                        <span className="text-[11px] text-[#6B7280] block">Requirements validation, wireframe/spec approval.</span>
                      </div>
                      <div className="p-3 bg-[#FBFBFC] rounded-[8px] border border-[#E5E7EB] space-y-1">
                        <span className="text-[10px] text-[#0047AB] font-bold block">MILESTONE 02 (50%)</span>
                        <strong className="text-[#0B0B0F] block">Core Implementation</strong>
                        <span className="text-[11px] text-[#6B7280] block">Functional deliverable deployed on testnet/preview.</span>
                      </div>
                      <div className="p-3 bg-[#FBFBFC] rounded-[8px] border border-[#E5E7EB] space-y-1">
                        <span className="text-[10px] text-[#0047AB] font-bold block">MILESTONE 03 (20%)</span>
                        <strong className="text-[#0B0B0F] block">Final Sign-off & SBT</strong>
                        <span className="text-[11px] text-[#6B7280] block">Release remaining deposit, mint permanent ERC-5192 SBT.</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#F3F4F6] flex flex-wrap items-center justify-between text-xs text-[#6B7280] gap-2">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-[#0047AB]" />
                        Protocol Fee: 2.5% client + 2.5% freelancer = 5% total
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-[#0047AB]" />
                        7-Day Autonomous Review Timer
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-[#E5E7EB] ring-1 ring-black/[0.03] rounded-[12px] overflow-hidden shadow-xs divide-y divide-[#E5E7EB]">
                {categoryJobs.map((job) => {
                  const isUsdc = job.paymentTokenSymbol === 'USDC';
                  const symbol = isUsdc ? 'USDC' : 'POL';
                  const rawAmount = isUsdc ? (job.amountUsdc || '0') : (job.amountEth || '0');
                  const budgetFormatted = formatAmount(rawAmount, symbol).formatted;

                  return (
                    <div
                      key={job.id}
                      className="p-5 hover:bg-[#FBFBFC] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-[#0047AB] bg-[#EFF6FF] px-2 py-0.5 rounded-[4px]">
                            {job.category || category.name}
                          </span>
                          <span className="text-[11px] font-mono tabular-nums text-[#6B7280]">
                            Client: {truncateAddress(job.client)}
                          </span>
                          <span className="text-[11px] text-[#9CA3AF]">•</span>
                          <span className="text-[11px] font-mono tabular-nums text-[#6B7280]">
                            {job.milestones?.length || 1} {job.milestones?.length === 1 ? 'Milestone' : 'Milestones'}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors">
                          <Link to={`/jobs/${job.id}`} className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0047AB] rounded">{job.title}</Link>
                        </h3>

                        <p className="text-xs text-[#4B5563] line-clamp-2 max-w-3xl">
                          {job.description}
                        </p>

                        {/* Skill Badges */}
                        {job.skillsRequired && job.skillsRequired.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {job.skillsRequired.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[10px] font-medium bg-[#F6F7F9] text-[#4B5563] px-2 py-0.5 rounded-[4px] border border-[#E5E7EB]"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right budget & action */}
                      <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F3F4F6]">
                        <div className="text-left md:text-right">
                          <span className="text-base font-extrabold text-[#0B0B0F] font-mono tabular-nums">
                            {budgetFormatted}&nbsp;{symbol}
                          </span>
                          <span className="block text-[10px] text-[#6B7280] font-mono tabular-nums">
                            2.5% client + 2.5% freelancer fee
                          </span>
                        </div>

                        <Link
                          to={`/jobs/${job.id}`}
                          className="px-3.5 py-1.5 bg-[#0047AB] hover:bg-[#00388A] text-white text-xs font-semibold rounded-[6px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] transition-[transform,background-color] duration-150 shadow-xs"
                        >
                          View Job & Escrow
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Real Specialists */}
        {activeTab === 'specialists' && (
          <div className="mt-6">
            {categorySpecialists.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] ring-1 ring-black/[0.03] rounded-[16px] p-12 text-center max-w-xl mx-auto my-6 space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#FF6A1F]/10 text-[#FF6A1F] flex items-center justify-center mx-auto">
                  <Users size={22} />
                </div>
                <h3 className="text-base font-bold text-[#0B0B0F]">
                  No specialists listed under this category yet
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Join PolyLance to register your decentralized freelancer profile and accept
                  escrow-backed milestones on Polygon.
                </p>
                <div className="pt-2">
                  <Link
                    to="/welcome"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0047AB] text-white text-xs font-semibold rounded-[8px] hover:bg-[#00388A] active:scale-[0.98] transition-[transform,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
                  >
                    <PlusCircle size={14} />
                    <span>Complete Your Profile</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#E5E7EB] ring-1 ring-black/[0.03] rounded-[12px] overflow-hidden shadow-xs divide-y divide-[#E5E7EB]">
                {categorySpecialists.map(([wallet, profile]) => (
                  <div
                    key={wallet}
                    className="p-5 hover:bg-[#FBFBFC] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E5E7EB] overflow-hidden flex items-center justify-center text-xs font-bold text-[#6B7280] shrink-0">
                          {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            wallet.slice(2, 4).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors truncate">
                              <Link to={`/profile/${wallet}`} className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0047AB] rounded">
                                {profile.displayName || truncateAddress(wallet)}
                              </Link>
                            </h4>
                            <span className="text-[11px] font-mono tabular-nums text-[#6B7280]">
                              {truncateAddress(wallet)}
                            </span>
                            {profile.availability && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                                {profile.availability === 'full_time' ? 'Full-Time' : profile.availability === 'part_time' ? 'Part-Time' : 'Booked'}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#6B7280] truncate block mt-0.5">
                            {profile.headline || `${category.name} Specialist`}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#4B5563] line-clamp-2 max-w-3xl pl-13">
                        {profile.bio || 'Verified specialist with sovereign on-chain record on Polygon.'}
                      </p>

                      {profile.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pl-13 pt-0.5">
                          {profile.skills.slice(0, 5).map((s: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[10px] font-medium bg-[#F6F7F9] text-[#4B5563] px-2 py-0.5 rounded-[4px] border border-[#E5E7EB]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F3F4F6]">
                      <div className="text-left md:text-right">
                        <span className="text-base font-extrabold text-[#0B0B0F] font-mono tabular-nums">
                          {profile.hourlyRate ? `${profile.hourlyRate} ${profile.preferredToken || 'USDC'}/hr` : 'Negotiable'}
                        </span>
                        <span className="block text-[10px] text-[#6B7280]">
                          Sovereign Milestone Escrow
                        </span>
                      </div>

                      <Link
                        to={`/profile/${wallet}`}
                        className="px-3.5 py-1.5 bg-[#0047AB] hover:bg-[#00388A] text-white text-xs font-semibold rounded-[6px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] transition-[transform,background-color] duration-150 shadow-xs"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
