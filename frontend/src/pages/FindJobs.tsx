import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePolyLanceData, isDemoOrMockJob } from '../context/PolyLanceDataContext';
import { useAccountMode } from '../hooks/useAccountMode';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { TokenAmount } from '../components/common/TokenAmount';
import { getJobAmounts } from '../lib/amounts/getJobAmounts';
import { calculateFeeBreakdownFromString } from '../utils/fees';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { ClientTrustBadge } from '../components/common/ClientTrustBadge';
import {
  formatTimeAgo,
  getCanonicalCategory,
  toChecksumAddress,
} from '../utils/formatters';
import {
  DOMAINS,
  isJobOpen,
  isJobInDomain,
  resolveDomainId,
  DOMAIN_BY_ID,
} from '../utils/domainMapping';
import { normalizeTimestampMs } from '../types/lifecycle';
import { useGlobalFiat, SUPPORTED_FIAT } from '../utils/currency';
import { useDebounce } from '../hooks/useDebounce';
import {
  Search,
  Bookmark,
  Clock,
  X,
  SlidersHorizontal,
  RotateCcw,
  PlusCircle,
  ChevronDown,
  ShieldCheck,
  Code2,
  Cpu,
  Palette,
  Film,
  Sparkles,
  TrendingUp,
  FileText,
  BarChart3,
  Briefcase,
  Compass,
  Bell,
} from 'lucide-react';
import { Drawer } from '../components/mobile/Drawer';
import { useDemoMode } from '../context/DemoModeContext';
import { PolyLanceSelect, SelectOption } from '../components/PolyLanceSelect';
import { Seo } from '../components/seo/Seo';

const POSTED_OPTIONS: SelectOption[] = [
  { value: 'any', label: 'Any time' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

const MIN_REP_OPTIONS: SelectOption[] = [
  { value: '', label: 'No minimum threshold' },
  { value: '500', label: '500+ reputation' },
  { value: '700', label: '700+ reputation' },
  { value: '850', label: '850+ reputation' },
];

const APPLICANTS_OPTIONS: SelectOption[] = [
  { value: 'any', label: 'Any number of applicants' },
  { value: 'lt5', label: 'Fewer than 5 applicants' },
];

const SORT_OPTIONS: SelectOption[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'budget_desc', label: 'Budget: High to low' },
  { value: 'budget_asc', label: 'Budget: Low to high' },
  { value: 'applicants_asc', label: 'Fewest applicants' },
];

const FIAT_OPTIONS: SelectOption[] = SUPPORTED_FIAT.map((f) => ({
  value: f.code,
  label: `${f.code} (${f.symbol})`,
  flag: f.flag,
  sublabel: f.name,
}));

const BALANCED_DOMAIN_CARDS = [
  {
    title: 'Development & Web3',
    subtitle: 'Full-stack apps, smart contracts & cloud APIs',
    to: '/categories/development-it',
    icon: Code2,
  },
  {
    title: 'AI & Automation',
    subtitle: 'Autonomous agents, LLM workflows & RAG',
    to: '/categories/ai-automation',
    icon: Cpu,
  },
  {
    title: 'Design & UI/UX',
    subtitle: 'Product design systems, brand identity & 3D',
    to: '/categories/design-creative',
    icon: Palette,
  },
  {
    title: 'Video & Motion',
    subtitle: 'Editing, 2D/3D motion graphics & sound design',
    to: '/categories/video-audio-animation',
    icon: Film,
  },
  {
    title: 'Creators & UGC',
    subtitle: 'YouTube integrations, Reels & UGC campaigns',
    to: '/categories/creators-brand-collabs',
    icon: Sparkles,
  },
  {
    title: 'Marketing & Growth',
    subtitle: 'Technical SEO, paid acquisition & lifecycle',
    to: '/categories/marketing',
    icon: TrendingUp,
  },
  {
    title: 'Writing & Content',
    subtitle: 'Copywriting, technical docs & localization',
    to: '/categories/writing-content',
    icon: FileText,
  },
  {
    title: 'Data & Analytics',
    subtitle: 'BI dashboards, ETL pipelines & data science',
    to: '/categories/data-analytics',
    icon: BarChart3,
  },
  {
    title: 'Admin & Ops',
    subtitle: 'Executive assistance, PM & customer success',
    to: '/categories/admin-support',
    icon: Briefcase,
  },
];

const POPULAR_PLATFORM_SKILLS = [
  'Smart Contracts',
  'UI/UX Design',
  'Video Editing',
  'AI Agents',
  'React & Next.js',
  'Motion Graphics',
  'Copywriting',
  'SEO & Growth',
  'UGC & Creators',
  'Data Dashboards',
  'Virtual Assistance',
];

export const FindJobs: React.FC = () => {
  const { jobs, profiles } = usePolyLanceData();
  const { isClientAllowed } = useAccountMode();
  const { isDemoMode } = useDemoMode();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFiat, setSelectedFiat] = useGlobalFiat();

  const search = searchParams.get('search') || '';
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 300, 2);

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateParam('search', debouncedSearch.trim() || null);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const domainParam = searchParams.get('domain');
  const categoryParam = searchParams.get('category');
  const activeDomain = resolveDomainId(domainParam || (categoryParam && categoryParam !== 'All' ? categoryParam : null));
  const activeDomainConfig = activeDomain ? DOMAIN_BY_ID[activeDomain] : null;

  const skillParam = searchParams.get('skill');
  const rawSkillsParam = searchParams.get('skills');
  const skillsParam = useMemo(() => {
    const list: string[] = [];
    if (rawSkillsParam) {
      list.push(...rawSkillsParam.split(','));
    }
    if (skillParam && !list.includes(skillParam)) {
      list.push(skillParam);
    }
    return list;
  }, [rawSkillsParam, skillParam]);

  const minBudget = searchParams.get('minBudget') || '';
  const maxBudget = searchParams.get('maxBudget') || '';
  const posted = searchParams.get('posted') || 'any';
  const minRep = searchParams.get('minRep') || '';
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
  const applicants = searchParams.get('applicants') || 'any';
  const sort = searchParams.get('sort') || 'newest';
  const viewSaved = searchParams.get('view') === 'saved';

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skillAlertsSaved, setSkillAlertsSaved] = useState(false);
  const [openSections, setOpenSections] = useState({
    domain: true,
    skills: true,
    budget: true,
    advanced: true,
  });

  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('polylance_saved_jobs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleSaveJob = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedJobIds((prev) => {
      const updated = prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId];
      try {
        localStorage.setItem('polylance_saved_jobs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'any' || value === 'All' || value === 'false') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const handleDomainSelect = (dId: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete('category');
    if (!dId || dId === 'All') {
      next.delete('domain');
    } else {
      next.set('domain', dId);
    }
    setSearchParams(next, { replace: true });
  };

  const handleClearAll = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const addSkillFilter = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skillsParam.includes(trimmed)) {
      const updated = [...skillsParam, trimmed];
      updateParam('skills', updated.join(','));
    }
    setSkillInput('');
  };

  const removeSkillFilter = (skill: string) => {
    const next = new URLSearchParams(searchParams);
    if (skillParam === skill) {
      next.delete('skill');
    }
    const updated = skillsParam.filter((s) => s !== skill && s !== skillParam);
    if (updated.length > 0) {
      next.set('skills', updated.join(','));
    } else {
      next.delete('skills');
    }
    setSearchParams(next, { replace: true });
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (isDemoOrMockJob(job)) return false;
      if (!isJobOpen(job)) return false;
      if (viewSaved && !savedJobIds.includes(job.id)) return false;

      if (search) {
        const q = search.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesDesc = job.description.toLowerCase().includes(q);
        const matchesSkills = (job.skillsRequired || (job as any).skills || []).some((s: string) =>
          (s || '').toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesDesc && !matchesSkills) return false;
      }

      if (activeDomain && !isJobInDomain(job, activeDomain)) return false;

      if (skillsParam.length > 0) {
        const jobSkills = (job.skillsRequired || (job as any).skills || []).map((s: string) =>
          (s || '').toLowerCase()
        );
        const hasSkill = skillsParam.some((s) =>
          jobSkills.some((js: string) => js.includes(s.toLowerCase()) || s.toLowerCase().includes(js))
        );
        if (!hasSkill) return false;
      }

      const budgetVal = parseFloat(job.amountEth || job.amountUsdc || '0');
      if (minBudget && budgetVal < parseFloat(minBudget)) return false;
      if (maxBudget && budgetVal > parseFloat(maxBudget)) return false;

      if (posted !== 'any') {
        const now = Date.now();
        const jobTime = normalizeTimestampMs(job.createdAt || job.events?.[0]?.timestamp);
        const diffHours = (now - jobTime) / (1000 * 60 * 60);
        if (posted === '24h' && diffHours > 24) return false;
        if (posted === '7d' && diffHours > 24 * 7) return false;
        if (posted === '30d' && diffHours > 24 * 30) return false;
      }

      if (minRep && parseFloat(minRep) > 700) return false;
      if (applicants === 'lt5' && (job.applications?.length || 0) >= 5) return false;

      return true;
    });
  }, [jobs, viewSaved, savedJobIds, search, activeDomain, skillsParam, minBudget, maxBudget, posted, minRep, applicants, isDemoMode]);

  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      if (sort === 'budget_desc') {
        return parseFloat(b.amountEth || b.amountUsdc || '0') - parseFloat(a.amountEth || a.amountUsdc || '0');
      }
      if (sort === 'budget_asc') {
        return parseFloat(a.amountEth || a.amountUsdc || '0') - parseFloat(b.amountEth || b.amountUsdc || '0');
      }
      if (sort === 'applicants_asc') {
        return (a.applications?.length || 0) - (b.applications?.length || 0);
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [filteredJobs, sort]);

  const [visibleCount, setVisibleCount] = useState(12);

  const activeFilterCount =
    (activeDomain ? 1 : 0) +
    (skillsParam.length > 0 ? 1 : 0) +
    (minBudget ? 1 : 0) +
    (maxBudget ? 1 : 0) +
    (posted !== 'any' ? 1 : 0) +
    (minRep ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (applicants !== 'any' ? 1 : 0);

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderFilterPanel = () => (
    <div className="space-y-4 text-left">
      {/* Collapsible Domain Section */}
      <div className="border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={() => toggleSection('domain')}
          className="w-full flex items-center justify-between text-[11px] font-mono font-semibold text-slate-600 uppercase tracking-wider mb-2 cursor-pointer"
        >
          <span>Domain</span>
          <ChevronDown
            size={13}
            className={`transition-transform ${openSections.domain ? 'rotate-180' : ''}`}
          />
        </button>
        {openSections.domain && (
          <div
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            className="space-y-1 max-h-60 overflow-y-auto overscroll-contain pr-1 custom-scrollbar"
          >
            <button
              type="button"
              onClick={() => handleDomainSelect('All')}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                !activeDomain
                  ? 'bg-[#EFF6FF] text-[#0A52B8] font-semibold'
                  : 'text-slate-600 hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              All domains
            </button>
            {DOMAINS.map((dom) => (
              <button
                key={dom.id}
                type="button"
                onClick={() => handleDomainSelect(dom.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeDomain === dom.id
                    ? 'bg-[#EFF6FF] text-[#0A52B8] font-semibold'
                    : 'text-slate-600 hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                {dom.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible Skills Section — Overflow Fixed */}
      <div className="border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={() => toggleSection('skills')}
          className="w-full flex items-center justify-between text-[11px] font-mono font-semibold text-slate-600 uppercase tracking-wider mb-2 cursor-pointer"
        >
          <span>Skills</span>
          <ChevronDown
            size={13}
            className={`transition-transform ${openSections.skills ? 'rotate-180' : ''}`}
          />
        </button>
        {openSections.skills && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                placeholder="Add skill..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkillFilter(skillInput);
                  }
                }}
                className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A52B8]/20 focus:border-[#0A52B8]"
              />
              <button
                type="button"
                onClick={() => addSkillFilter(skillInput)}
                className="shrink-0 px-3 py-2 rounded-lg bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#0A52B8] border border-slate-200 hover:border-[#BFDBFE] text-xs font-semibold transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>

            {skillsParam.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skillsParam.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 bg-[#EFF6FF] text-[#0A52B8] text-[11px] font-medium px-2 py-0.5 rounded-md border border-[#BFDBFE]"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkillFilter(skill)}
                      className="text-[#0A52B8] hover:text-[#0F172A] cursor-pointer"
                      aria-label={`Remove ${skill}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Budget Range + Slider */}
      <div className="border-b border-slate-100 pb-3 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-600 uppercase tracking-wider">
          <span>Budget (POL)</span>
          <span className="text-[#0A52B8]">
            {minBudget || '0'}–{maxBudget || '5000+'}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={2500}
          step={25}
          value={Number(minBudget || 0)}
          onChange={(e) => updateParam('minBudget', Number(e.target.value) > 0 ? e.target.value : null)}
          aria-label="Minimum budget slider"
          className="w-full accent-[#0A52B8] cursor-pointer"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minBudget}
            onChange={(e) => updateParam('minBudget', e.target.value)}
            className="w-full min-w-0 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0A52B8]"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxBudget}
            onChange={(e) => updateParam('maxBudget', e.target.value)}
            className="w-full min-w-0 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0A52B8]"
          />
        </div>
      </div>

      {/* Posted / Rep / Applicants */}
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-mono font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Posted Date
          </label>
          <PolyLanceSelect
            value={posted}
            onChange={(val) => updateParam('posted', val)}
            options={POSTED_OPTIONS}
            size="sm"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Client Reputation
          </label>
          <PolyLanceSelect
            value={minRep}
            onChange={(val) => updateParam('minRep', val || null)}
            options={MIN_REP_OPTIONS}
            size="sm"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Applicants
          </label>
          <PolyLanceSelect
            value={applicants}
            onChange={(val) => updateParam('applicants', val)}
            options={APPLICANTS_OPTIONS}
            size="sm"
          />
        </div>
      </div>

      {/* Verified Clients Only Toggle */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          role="switch"
          aria-checked={verifiedOnly}
          onClick={() => updateParam('verifiedOnly', verifiedOnly ? null : 'true')}
          className="w-full flex items-center justify-between gap-2 text-xs font-medium text-[#0F172A] cursor-pointer py-1"
        >
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#0A52B8]" />
            <span>Verified Clients Only</span>
          </span>
          <span
            className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center ${
              verifiedOnly ? 'bg-[#0A52B8] justify-end' : 'bg-slate-200 justify-start'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
          </span>
        </button>
      </div>

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={handleClearAll}
          className="w-full text-xs text-rose-700 hover:underline flex items-center justify-center gap-1.5 pt-1 cursor-pointer font-medium"
        >
          <RotateCcw size={12} />
          <span>Clear all filters</span>
        </button>
      )}
    </div>
  );

  return (
    <PageContainer className="pt-8 pb-16">
      <Seo routeKey="/find-jobs" />

      <PageHeader
        title="Find jobs"
        subtitle="Explore verified freelance opportunities across engineering, design, AI, video, writing, and growth — protected by non-custodial escrow."
        actions={
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">Fiat:</span>
              <PolyLanceSelect
                value={selectedFiat}
                onChange={setSelectedFiat}
                options={FIAT_OPTIONS}
                size="sm"
                compactTrigger
                className="min-w-[110px]"
              />
            </div>

            <Button
              variant={viewSaved ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => updateParam('view', viewSaved ? null : 'saved')}
              icon={<Bookmark size={14} />}
            >
              Saved ({savedJobIds.length})
            </Button>
          </div>
        }
      />

      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-5">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search contracts by title, scope, or skills across all 10 disciplines..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A52B8]/20 focus:border-[#0A52B8]"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#0F172A] cursor-pointer"
          >
            <SlidersHorizontal size={13} />
            <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="hidden sm:inline">Sort:</span>
            <PolyLanceSelect
              value={sort}
              onChange={(val) => updateParam('sort', val)}
              options={SORT_OPTIONS}
              size="sm"
              className="w-40 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* Main Split: Elevated Sticky Sidebar + Redesigned Cards */}
      <div className="flex flex-col lg:flex-row gap-6 items-start text-left">
        <aside
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          className="hidden lg:block w-[272px] shrink-0 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs sticky top-24 max-h-[calc(100vh-112px)] overflow-y-auto overscroll-contain custom-scrollbar"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <span className="text-xs font-bold text-[#0F172A]">Filter Marketplace</span>
            {activeFilterCount > 0 && (
              <span className="text-[11px] text-[#0A52B8] font-semibold bg-[#EFF6FF] px-2 py-0.5 rounded-md border border-[#BFDBFE]">
                {activeFilterCount} active
              </span>
            )}
          </div>
          {renderFilterPanel()}
        </aside>

        <main className="flex-1 min-w-0 w-full">
          {/* Result Summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0F172A]">
                {activeDomainConfig
                  ? `Showing ${sortedJobs.length} ${activeDomainConfig.label} ${sortedJobs.length === 1 ? 'job' : 'jobs'}`
                  : `Showing ${Math.min(visibleCount, sortedJobs.length)} of ${sortedJobs.length} open jobs`}
              </span>
              {activeDomainConfig && (
                <button
                  type="button"
                  onClick={() => handleDomainSelect('All')}
                  className="text-xs text-[#0A52B8] hover:underline cursor-pointer"
                >
                  (Clear filter)
                </button>
              )}
            </div>
            {viewSaved && <span className="text-[#0A52B8] font-semibold">Viewing saved jobs</span>}
          </div>

          {sortedJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-10 text-center space-y-5 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#0A52B8] mx-auto flex items-center justify-center">
                <Compass size={26} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#0F172A]">
                  {viewSaved
                    ? 'No saved jobs yet'
                    : activeDomainConfig
                    ? `No open ${activeDomainConfig.label} jobs found`
                    : activeFilterCount > 0
                    ? 'No jobs match your filters'
                    : 'No open freelance contracts available right now'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  {viewSaved
                    ? 'Bookmark any interesting contract to track proposals and deadlines later.'
                    : isClientAllowed
                    ? 'Publish an on-chain milestone contract to reach verified tech engineers, designers, editors, and creators.'
                    : 'Try widening your filters, exploring another discipline below, or enabling skill alerts for new contracts.'}
                </p>
              </div>

              {/* Quick Category Filter Chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl mx-auto">
                {['development-it', 'ai-automation', 'design-creative', 'video-audio-animation', 'marketing', 'writing-content'].map((slug) => {
                  const dom = DOMAINS.find((d) => d.id === slug || (slug === 'video-audio-animation' && d.id === 'video-audio'));
                  if (!dom) return null;
                  return (
                    <button
                      key={dom.id}
                      type="button"
                      onClick={() => handleDomainSelect(dom.id)}
                      className="px-3 py-1 rounded-full bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-slate-200 hover:border-[#BFDBFE] text-xs font-medium text-slate-700 hover:text-[#0A52B8] transition-colors cursor-pointer"
                    >
                      {dom.label}
                    </button>
                  );
                })}
              </div>

              {/* Role-Aware Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                {isClientAllowed ? (
                  <Button
                    as="Link"
                    to={activeDomain ? `/jobs/post?domain=${activeDomain}` : '/jobs/post'}
                    variant="primary"
                    size="sm"
                    leadingIcon={<PlusCircle size={14} />}
                  >
                    Post a job
                  </Button>
                ) : (
                  <>
                    <Button
                      as="Link"
                      to="/categories"
                      variant="primary"
                      size="sm"
                      leadingIcon={<Compass size={14} />}
                    >
                      Explore All Categories
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSkillAlertsSaved(true)}
                      leadingIcon={<Bell size={14} />}
                    >
                      {skillAlertsSaved ? 'Skill Alerts Active ✓' : 'Update Skill Alerts'}
                    </Button>
                  </>
                )}

                {activeFilterCount > 0 && (
                  <Button variant="secondary" size="sm" onClick={handleClearAll}>
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedJobs.slice(0, visibleCount).map((job, idx) => {
                const isSaved = savedJobIds.includes(job.id);
                const jobAmounts = getJobAmounts(job, null, null, 'freelancer');
                const feeBreakdown = calculateFeeBreakdownFromString(
                  String(jobAmounts.effectiveAmount || '0'),
                  jobAmounts.token
                );
                const clientKey = Object.keys(profiles || {}).find(
                  (k) => job.client && k.toLowerCase() === job.client.toLowerCase()
                );
                const clientProfile = clientKey ? profiles[clientKey] : null;
                const skills = (job.skillsRequired || (job as any).skills || []).slice(0, 5);

                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.25) }}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="p-5 bg-white border border-slate-200/90 hover:border-[#0A52B8] hover:shadow-md rounded-2xl transition-all cursor-pointer group flex flex-col justify-between gap-3"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#0A52B8]">
                            {getCanonicalCategory(job.category).label}
                          </span>
                          <StatusBadge status={job.status} />
                          <ClientTrustBadge
                            compact
                            clientAddress={job.client}
                            jobs={jobs}
                            profile={clientProfile}
                          />
                        </div>

                        <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#0A52B8] transition-colors truncate">
                          {job.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="text-right">
                          <TokenAmount
                            amount={jobAmounts.effectiveAmount}
                            token={jobAmounts.token}
                            size="sm"
                          />
                          <span className="text-[10.5px] font-mono text-slate-500 block">
                            Net payout: {feeBreakdown.freelancerNetFormatted} {feeBreakdown.token}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleSaveJob(job.id, e)}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                            isSaved
                              ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0A52B8]'
                              : 'bg-[#F8FAFC] border-slate-200 text-slate-500 hover:text-[#0F172A]'
                          }`}
                          aria-label={isSaved ? 'Remove from saved' : 'Save job'}
                        >
                          <Bookmark size={14} className={isSaved ? 'fill-current' : ''} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-[13px] text-slate-600 line-clamp-2 leading-relaxed max-w-3xl">
                      {job.description}
                    </p>

                    {/* Footer: Skills + Proposals + Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {skills.map((sk: string) => (
                          <span
                            key={sk}
                            className="px-2.5 py-0.5 rounded-lg bg-[#F8FAFC] border border-slate-200/80 text-[11px] font-medium text-slate-700"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 shrink-0">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          <span>{formatTimeAgo(job.createdAt || Date.now())}</span>
                        </span>
                        <span>•</span>
                        <span>{job.applications?.length || 0} proposals</span>
                        <span className="text-[#0A52B8] font-sans font-semibold group-hover:translate-x-0.5 transition-transform">
                          View →
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {visibleCount < sortedJobs.length && (
                <div className="pt-3 text-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                  >
                    Load more jobs ({sortedJobs.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* BALANCED ALL-DISCIPLINES "BROWSE BY DOMAIN & SKILL" SECTION */}
      <section className="mt-14 pt-10 border-t border-slate-200 space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[#0A52B8]">
              Browse by Domain &amp; Skill
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight mt-1">
              Explore engineering, creative, video, marketing &amp; ops contracts
            </h2>
          </div>
          <Link to="/categories" className="text-xs font-semibold text-[#0A52B8] hover:underline">
            View all 10 categories →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {BALANCED_DOMAIN_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.to}
                className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-[#0A52B8] hover:shadow-sm transition-all flex items-start gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#0A52B8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#0F172A] group-hover:text-[#0A52B8] transition-colors">
                    {card.title}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-snug">{card.subtitle}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Balanced Popular Skills Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-mono font-semibold text-slate-500 mr-1">Popular skills:</span>
          {POPULAR_PLATFORM_SKILLS.map((sk) => (
            <Link
              key={sk}
              to={`/jobs?search=${encodeURIComponent(sk)}`}
              className="px-3 py-1.5 rounded-full bg-[#F8FAFC] hover:bg-[#EFF6FF] text-xs font-medium text-slate-700 hover:text-[#0A52B8] border border-slate-200 hover:border-[#BFDBFE] transition-colors"
            >
              {sk}
            </Link>
          ))}
        </div>
      </section>

      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Filter jobs"
        side="left"
      >
        <div className="p-4">{renderFilterPanel()}</div>
      </Drawer>
    </PageContainer>
  );
};

export default FindJobs;
