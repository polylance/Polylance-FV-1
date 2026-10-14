import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePolyLanceData, isDemoOrMockJob } from '../context/PolyLanceDataContext';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Amount } from '../components/common/Amount';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import {
  CATEGORIES,
  formatTimeAgo,
  getCanonicalCategory,
  toChecksumAddress,
} from '../utils/formatters';
import {
  DOMAINS,
  DomainId,
  isJobOpen,
  isJobInDomain,
  resolveDomainId,
  DOMAIN_BY_ID,
} from '../utils/domainMapping';
import { normalizeTimestampMs } from '../types/lifecycle';
import { useGlobalFiat, SUPPORTED_FIAT } from '../utils/currency';
import {
  Search,
  Bookmark,
  CheckCircle2,
  Clock,
  X,
  SlidersHorizontal,
  RotateCcw,
  PlusCircle,
} from 'lucide-react';
import { Drawer } from '../components/mobile/Drawer';
import { useDemoMode } from '../context/DemoModeContext';
import { PolyLanceSelect, SelectOption } from '../components/PolyLanceSelect';

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

export const FindJobs: React.FC = () => {
  const { jobs } = usePolyLanceData();
  const { isDemoMode } = useDemoMode();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFiat, setSelectedFiat] = useGlobalFiat();

  // URL synced filter states
  const search = searchParams.get('search') || '';
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
  const posted = searchParams.get('posted') || 'any'; // '24h' | '7d' | '30d' | 'any'
  const minRep = searchParams.get('minRep') || '';
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
  const applicants = searchParams.get('applicants') || 'any'; // 'lt5' | 'any'
  const sort = searchParams.get('sort') || 'newest'; // 'newest' | 'budget_desc' | 'budget_asc' | 'applicants_asc'
  const viewSaved = searchParams.get('view') === 'saved';

  // Mobile filters drawer
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  // Saved jobs persistence
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

  // Filter jobs
  const filteredJobs = useMemo(() => {
    const sourceJobs = jobs;
    return sourceJobs.filter((job) => {
      // Must not be expired, demo or mock job
      if (isDemoOrMockJob(job)) return false;

      // Status must be open
      if (!isJobOpen(job)) return false;

      // Saved view
      if (viewSaved && !savedJobIds.includes(job.id)) return false;

      // Keyword Search
      if (search) {
        const q = search.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesDesc = job.description.toLowerCase().includes(q);
        const matchesSkills = (job.skillsRequired || (job as any).skills || []).some((s: string) => (s || '').toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesSkills) return false;
      }

      // Domain filter (using single shared mapping)
      if (activeDomain) {
        if (!isJobInDomain(job, activeDomain)) return false;
      }

      // Skills filter
      if (skillsParam.length > 0) {
        const jobSkills = (job.skillsRequired || (job as any).skills || []).map((s: string) => (s || '').toLowerCase());
        const hasSkill = skillsParam.some((s) => jobSkills.some((js: string) => js.includes(s.toLowerCase()) || s.toLowerCase().includes(js)));
        if (!hasSkill) return false;
      }

      // Budget filter (in POL)
      const budgetVal = parseFloat(job.amountEth || job.amountUsdc || '0');
      if (minBudget && budgetVal < parseFloat(minBudget)) return false;
      if (maxBudget && budgetVal > parseFloat(maxBudget)) return false;

      // Posted date
      if (posted !== 'any') {
        const now = Date.now();
        const jobTime = normalizeTimestampMs(job.createdAt || job.events?.[0]?.timestamp);
        const diffHours = (now - jobTime) / (1000 * 60 * 60);
        if (posted === '24h' && diffHours > 24) return false;
        if (posted === '7d' && diffHours > 24 * 7) return false;
        if (posted === '30d' && diffHours > 24 * 30) return false;
      }

      // Minimum client reputation score
      if (minRep) {
        const reqScore = 700;
        if (parseFloat(minRep) > reqScore) return false;
      }

      // Applicants count
      if (applicants === 'lt5' && (job.applications?.length || 0) >= 5) return false;

      return true;
    });
  }, [jobs, viewSaved, savedJobIds, search, activeDomain, skillsParam, minBudget, maxBudget, posted, minRep, applicants, isDemoMode]);

  // Sort jobs
  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      if (sort === 'budget_desc') {
        const aVal = parseFloat(a.amountEth || a.amountUsdc || '0');
        const bVal = parseFloat(b.amountEth || b.amountUsdc || '0');
        return bVal - aVal;
      }
      if (sort === 'budget_asc') {
        const aVal = parseFloat(a.amountEth || a.amountUsdc || '0');
        const bVal = parseFloat(b.amountEth || b.amountUsdc || '0');
        return aVal - bVal;
      }
      if (sort === 'applicants_asc') {
        return (a.applications?.length || 0) - (b.applications?.length || 0);
      }
      // default: newest
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [filteredJobs, sort]);

  // Pagination / Load more
  const [visibleCount, setVisibleCount] = useState(12);

  // Active filter count
  const activeFilterCount =
    (activeDomain ? 1 : 0) +
    (skillsParam.length > 0 ? 1 : 0) +
    (minBudget ? 1 : 0) +
    (maxBudget ? 1 : 0) +
    (posted !== 'any' ? 1 : 0) +
    (minRep ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (applicants !== 'any' ? 1 : 0);

  // Render Sidebar Filters Content
  const renderFilterPanel = () => (
    <div className="space-y-4 text-left">
      {/* Domain */}
      <div>
        <label className="block text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">
          Domain
        </label>
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => handleDomainSelect('All')}
            className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
              !activeDomain
                ? 'bg-[#EFF6FF] text-[#0047AB] font-semibold'
                : 'text-[#4B5563] hover:bg-[#F6F7F9] hover:text-[#0B0B0F]'
            }`}
          >
            All domains
          </button>
          {DOMAINS.map((dom) => (
            <button
              key={dom.id}
              type="button"
              onClick={() => handleDomainSelect(dom.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
                activeDomain === dom.id
                  ? 'bg-[#EFF6FF] text-[#0047AB] font-semibold'
                  : 'text-[#4B5563] hover:bg-[#F6F7F9] hover:text-[#0B0B0F]'
              }`}
            >
              {dom.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Tag Input */}
      <div>
        <label className="block text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">
          Skills
        </label>
        <div className="flex gap-1.5 mb-1.5">
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
            className="flex-1 bg-white border border-[#E5E7EB] rounded-[6px] px-2.5 py-1 text-xs text-[#0B0B0F] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#0047AB]"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => addSkillFilter(skillInput)}
            className="py-1 min-h-[32px] text-xs"
          >
            Add
          </Button>
        </div>
        {skillsParam.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {skillsParam.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 bg-[#F6F7F9] text-[#0B0B0F] text-[11px] px-2 py-0.5 rounded-[6px] border border-[#E5E7EB]"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkillFilter(skill)}
                  className="text-[#6B7280] hover:text-[#0B0B0F] cursor-pointer"
                  aria-label={`Remove ${skill}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Budget Range (in POL) */}
      <div>
        <label className="block text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">
          Budget (POL)
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <input
            type="number"
            placeholder="Min"
            value={minBudget}
            onChange={(e) => updateParam('minBudget', e.target.value)}
            className="bg-white border border-[#E5E7EB] rounded-[6px] px-2.5 py-1 text-xs text-[#0B0B0F] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#0047AB]"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxBudget}
            onChange={(e) => updateParam('maxBudget', e.target.value)}
            className="bg-white border border-[#E5E7EB] rounded-[6px] px-2.5 py-1 text-xs text-[#0B0B0F] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#0047AB]"
          />
        </div>
      </div>

      {/* Posted Date */}
      <div>
        <label className="block text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">
          Posted Date
        </label>
        <PolyLanceSelect
          value={posted}
          onChange={(val) => updateParam('posted', val)}
          options={POSTED_OPTIONS}
          size="sm"
        />
      </div>

      {/* Minimum client reputation */}
      <div>
        <label className="block text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">
          Minimum reputation score
        </label>
        <PolyLanceSelect
          value={minRep}
          onChange={(val) => updateParam('minRep', val || null)}
          options={MIN_REP_OPTIONS}
          size="sm"
        />
      </div>

      {/* Applicants Count */}
      <div>
        <label className="block text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">
          Applicants
        </label>
        <PolyLanceSelect
          value={applicants}
          onChange={(val) => updateParam('applicants', val)}
          options={APPLICANTS_OPTIONS}
          size="sm"
        />
      </div>

      {/* Verified clients only */}
      <div className="pt-2 border-t border-[#E5E7EB]">
        <label className="flex items-center gap-2 text-xs text-[#0B0B0F] cursor-pointer">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => updateParam('verifiedOnly', e.target.checked ? 'true' : null)}
            className="rounded border-[#E5E7EB] text-[#0047AB] focus:ring-[#0047AB]"
          />
          <span>Verified clients only</span>
        </label>
      </div>

      {/* Clear all */}
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={handleClearAll}
          className="w-full text-xs text-[#991B1B] hover:underline flex items-center justify-center gap-1.5 pt-1 cursor-pointer"
        >
          <RotateCcw size={12} />
          <span>Clear all filters</span>
        </button>
      )}
    </div>
  );

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Find jobs"
        subtitle="Explore active on-chain freelance contracts with non-custodial milestone escrow."
        actions={
          <div className="flex items-center gap-2.5">
            {/* Currency selector controlling global fiat */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#6B7280]">Fiat:</span>
              <PolyLanceSelect
                value={selectedFiat}
                onChange={setSelectedFiat}
                options={FIAT_OPTIONS}
                size="sm"
                className="w-32"
              />
            </div>

            {/* Saved Jobs Toggle Button */}
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

      {/* Search & Top Controls - 24px rhythm */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between mb-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by keywords or required skills..."
            value={search}
            onChange={(e) => updateParam('search', e.target.value || null)}
            className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-9 pr-3 py-2 text-xs sm:text-sm text-[#0B0B0F] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#0047AB]"
          />
        </div>

        {/* Mobile filter button & Sort */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E5E7EB] rounded-[8px] text-xs font-medium text-[#0B0B0F] cursor-pointer"
          >
            <SlidersHorizontal size={13} />
            <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
          </button>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-[#4B5563]">
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

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5 text-left">
          <span className="text-xs text-[#6B7280]">Active:</span>
          {activeDomainConfig && (
            <span className="inline-flex items-center gap-1 bg-[#EFF6FF] text-[#0047AB] text-xs px-2 py-0.5 rounded-[6px] border border-[#BFDBFE]">
              <span>Domain: {activeDomainConfig.label}</span>
              <button onClick={() => handleDomainSelect('All')} className="cursor-pointer">
                <X size={11} />
              </button>
            </span>
          )}
          {skillsParam.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 bg-[#EFF6FF] text-[#0047AB] text-xs px-2 py-0.5 rounded-[6px] border border-[#BFDBFE]"
            >
              <span>Skill: {s}</span>
              <button onClick={() => removeSkillFilter(s)} className="cursor-pointer">
                <X size={11} />
              </button>
            </span>
          ))}
          {minBudget && (
            <span className="inline-flex items-center gap-1 bg-[#EFF6FF] text-[#0047AB] text-xs px-2 py-0.5 rounded-[6px] border border-[#BFDBFE]">
              <span>Min {minBudget} POL</span>
              <button onClick={() => updateParam('minBudget', null)} className="cursor-pointer">
                <X size={11} />
              </button>
            </span>
          )}
          {maxBudget && (
            <span className="inline-flex items-center gap-1 bg-[#EFF6FF] text-[#0047AB] text-xs px-2 py-0.5 rounded-[6px] border border-[#BFDBFE]">
              <span>Max {maxBudget} POL</span>
              <button onClick={() => updateParam('maxBudget', null)} className="cursor-pointer">
                <X size={11} />
              </button>
            </span>
          )}
          {posted !== 'any' && (
            <span className="inline-flex items-center gap-1 bg-[#EFF6FF] text-[#0047AB] text-xs px-2 py-0.5 rounded-[6px] border border-[#BFDBFE]">
              <span>Posted: {posted}</span>
              <button onClick={() => updateParam('posted', null)} className="cursor-pointer">
                <X size={11} />
              </button>
            </span>
          )}
          {minRep && (
            <span className="inline-flex items-center gap-1 bg-[#EFF6FF] text-[#0047AB] text-xs px-2 py-0.5 rounded-[6px] border border-[#BFDBFE]">
              <span>Rep: {minRep}+</span>
              <button onClick={() => updateParam('minRep', null)} className="cursor-pointer">
                <X size={11} />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-[#991B1B] hover:underline ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Layout: 260px Filter Sidebar on Left + Job Rows on Right */}
      <div className="flex flex-col lg:flex-row gap-6 items-start text-left">
        {/* Desktop Sidebar (260px, compact grouped card) */}
        <aside className="hidden lg:block w-[260px] shrink-0 bg-white border border-[#E5E7EB] rounded-[12px] p-4 shadow-xs sticky top-[88px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB] mb-3">
            <span className="text-xs font-semibold text-[#0B0B0F]">Filters</span>
            {activeFilterCount > 0 && (
              <span className="text-[11px] text-[#0047AB] font-semibold bg-[#EFF6FF] px-2 py-0.5 rounded-[4px] border border-[#BFDBFE]">
                {activeFilterCount} active
              </span>
            )}
          </div>
          {renderFilterPanel()}
        </aside>

        {/* Job Rows List */}
        <main className="flex-1 min-w-0 w-full">
          {/* Result count */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-[#6B7280]">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#0B0B0F]">
                {activeDomainConfig
                  ? `Showing ${sortedJobs.length} ${activeDomainConfig.label} ${sortedJobs.length === 1 ? 'job' : 'jobs'}`
                  : `Showing ${Math.min(visibleCount, sortedJobs.length)} of ${sortedJobs.length} jobs`}
              </span>
              {activeDomainConfig && (
                <button
                  type="button"
                  onClick={() => handleDomainSelect('All')}
                  className="text-xs text-[#0047AB] hover:underline flex items-center gap-0.5 ml-1 cursor-pointer"
                >
                  (Clear filter)
                </button>
              )}
            </div>
            {viewSaved && (
              <span className="text-[#0047AB] font-medium">Viewing saved jobs</span>
            )}
          </div>

          {/* List or Compact Empty State */}
          {sortedJobs.length === 0 ? (
            <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#0047AB] mx-auto flex items-center justify-center">
                <Search size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#0B0B0F]">
                  {viewSaved
                    ? 'No saved jobs'
                    : activeDomainConfig
                    ? `No open ${activeDomainConfig.label} jobs found`
                    : 'No jobs found matching your filters'}
                </h3>
                <p className="text-xs text-[#4B5563] max-w-sm mx-auto">
                  {viewSaved
                    ? 'Click the bookmark icon on any job to save it for later review.'
                    : 'Try loosening your filter criteria or searching for different keywords.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  as="Link"
                  to={activeDomain ? `/jobs/post?domain=${activeDomain}` : '/jobs/post'}
                  variant="primary"
                  size="sm"
                  leadingIcon={<PlusCircle size={13} />}
                >
                  Post a job
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClearAll}
                >
                  Clear all
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedJobs.slice(0, visibleCount).map((job) => {
                const isSaved = savedJobIds.includes(job.id);
                const tokenAmount = parseFloat(job.amountEth || job.amountUsdc || '0');
                const tokenSymbol = (job.paymentTokenSymbol || 'POL').toUpperCase();

                return (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="p-4 bg-white border border-[#E5E7EB] hover:border-[#0047AB] rounded-[10px] transition-all cursor-pointer shadow-xs group flex flex-col justify-between gap-2 min-h-[120px] max-h-[140px]"
                  >
                    {/* Line 1: Title + Budget + Bookmark */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors truncate">
                          {job.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <Amount
                            amount={tokenAmount}
                            token={tokenSymbol}
                            showFiat={true}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleSaveJob(job.id, e)}
                          className={`p-1.5 rounded-[6px] border transition-colors cursor-pointer ${
                            isSaved
                              ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0047AB]'
                              : 'bg-[#F6F7F9] border-[#E5E7EB] text-[#6B7280] hover:text-[#0B0B0F]'
                          }`}
                          aria-label={isSaved ? 'Remove from saved' : 'Save job'}
                        >
                          <Bookmark size={13} className={isSaved ? 'fill-current' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* Line 2: 1-2 lines description */}
                    <p className="text-xs text-[#4B5563] line-clamp-1 leading-normal max-w-[720px]">
                      {job.description}
                    </p>

                    {/* Line 3: Meta line */}
                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-[#6B7280] pt-1 border-t border-[#F3F4F6]">
                      <StatusBadge status={job.status} />
                      {job.status === 'Selected' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Offer in negotiation
                        </span>
                      )}
                      <span>•</span>
                      <span>{getCanonicalCategory(job.category).label}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        <span>{formatTimeAgo(job.createdAt || Date.now())}</span>
                      </span>
                      <span>•</span>
                      <span>{job.applications?.length || 0} proposals</span>
                    </div>
                  </div>
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

      {/* Mobile Filters Drawer */}
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
