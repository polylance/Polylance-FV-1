import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { SkillCategory } from '../types';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { FeeBreakdown } from '../components/common/FeeBreakdown';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { SkillAutocomplete } from '../components/common/FormControls';
import { WatchButton, VideoModal, useVideoModal } from '../components/video';
import { ClientTrustBadge } from '../components/common/ClientTrustBadge';
import { CATEGORIES } from '../utils/formatters';
import { resolveDomainId, DOMAIN_BY_ID } from '../utils/domainMapping';
import { getCategories } from '../utils/taxonomy';
import { calculateFeeBreakdownFromString } from '../utils/fees';
import { useLiveCurrencyRates, convertCryptoToFiat, useGlobalFiat } from '../utils/currency';
import { useAccountMode } from '../hooks/useAccountMode';
import {
  ShieldCheck,
  CheckCircle2,
  Bold,
  List,
  Code,
  Eye,
  Wallet,
  Bookmark,
  Briefcase,
  Github,
  Palette,
  Sparkles,
  Plus,
  Trash2,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { FormattedJobDescription } from '../components/FormattedJobDescription';
import { PolyLanceSelect, SelectOption } from '../components/PolyLanceSelect';

const CATEGORY_OPTIONS: SelectOption[] = CATEGORIES.slice(0, 10).map((cat) => ({
  value: cat.id,
  label: cat.label,
  sublabel: cat.description,
}));

const REVIEW_PERIOD_OPTIONS: SelectOption[] = [
  { value: '3', label: '3 days' },
  { value: '5', label: '5 days' },
  { value: '7', label: '7 days (Standard)' },
  { value: '14', label: '14 days' },
];

type VerificationPref = 'any' | 'github' | 'portfolio';

interface MilestoneRow {
  id: string;
  title: string;
  amount: string;
}

export const PostJob: React.FC = () => {
  const {
    address,
    isConnected,
    connectWallet,
    balanceNative,
    balanceUsdc,
    balanceUsdt,
    isWrongNetwork,
    switchToTargetNetwork,
    currentRole,
    setRole,
  } = useWeb3();
  const { jobs, profiles, postJob } = usePolyLanceData();
  const { accountMode, setAccountMode, isClientAllowed } = useAccountMode();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialDomain = resolveDomainId(searchParams.get('domain') || searchParams.get('category'));
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [category, setCategory] = useState<SkillCategory>((initialDomain as SkillCategory) || 'web3-blockchain');
  const [subcategory, setSubcategory] = useState<string>('');
  const [verificationPreference, setVerificationPreference] = useState<VerificationPref>('any');
  const [skills, setSkills] = useState<string[]>(
    initialDomain && DOMAIN_BY_ID[initialDomain]
      ? DOMAIN_BY_ID[initialDomain].skills.slice(0, 3)
      : ['Solidity', 'Smart Contracts']
  );
  const [description, setDescription] = useState('');
  const [descTouched, setDescTouched] = useState(false);
  const [showDescPreview, setShowDescPreview] = useState(false);

  // Milestones & Budget
  const [selectedToken, setSelectedToken] = useState<'POL' | 'USDC' | 'USDT'>('POL');
  const [amount, setAmount] = useState('50');
  const [milestones, setMilestones] = useState<MilestoneRow[]>([
    { id: 'ms-1', title: 'Initial Architecture & Core Delivery', amount: '50' },
  ]);
  const [reviewPeriodDays, setReviewPeriodDays] = useState('7');
  const { activeVideoId, isOpen, openVideo, closeVideo, triggerRef } = useVideoModal();
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachmentInput, setAttachmentInput] = useState('');

  const taxonomyCategories = useMemo(() => getCategories(), []);
  const activeTaxonomyCat = useMemo(
    () =>
      taxonomyCategories.find(
        (c) => c.slug === category || c.slug === resolveDomainId(category)
      ) || taxonomyCategories[0],
    [taxonomyCategories, category]
  );

  useEffect(() => {
    const rawParam = searchParams.get('domain') || searchParams.get('category');
    const resolved = resolveDomainId(rawParam);
    if (resolved) {
      setCategory(resolved as SkillCategory);
      const domConfig = DOMAIN_BY_ID[resolved];
      if (domConfig && domConfig.skills.length > 0) {
        setSkills(domConfig.skills.slice(0, 3));
      }
    }
  }, [searchParams]);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedFiat] = useGlobalFiat();
  const rates = useLiveCurrencyRates();

  // Keep principal synced with milestones total if user edits milestones
  const updateMilestone = (id: string, patch: Partial<MilestoneRow>) => {
    const next = milestones.map((m) => (m.id === id ? { ...m, ...patch } : m));
    setMilestones(next);
    const total = next.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
    if (total > 0) setAmount(String(total));
  };

  const addMilestone = () => {
    const next = [
      ...milestones,
      { id: `ms-${Date.now()}`, title: `Milestone ${milestones.length + 1}`, amount: '25' },
    ];
    setMilestones(next);
    const total = next.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
    if (total > 0) setAmount(String(total));
  };

  const removeMilestone = (id: string) => {
    if (milestones.length <= 1) return;
    const next = milestones.filter((m) => m.id !== id);
    setMilestones(next);
    const total = next.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
    if (total > 0) setAmount(String(total));
  };

  useEffect(() => {
    try {
      const draft = localStorage.getItem('polylance_job_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.skills) setSkills(parsed.skills);
        if (parsed.amount) setAmount(parsed.amount);
      }
    } catch {}
  }, []);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(
        'polylance_job_draft',
        JSON.stringify({ title, description, skills, amount, category })
      );
      alert('Draft saved to browser storage.');
    } catch {}
  };

  const parsedAmount = parseFloat(amount) || 0;
  const isTitleValid = title.trim().length >= 5;
  const isDescValid = description.trim().length >= 20;
  const isAmountValid = parsedAmount > 0;
  const isPeriodValid = parseInt(reviewPeriodDays) > 0;

  const missingFields: string[] = [];
  if (!isTitleValid) missingFields.push('Job title (at least 5 characters)');
  if (!isDescValid) missingFields.push('Description (at least 20 characters)');
  if (!isAmountValid) missingFields.push('Escrow budget amount');
  if (!isPeriodValid) missingFields.push('Review period in days');

  const isFormValid = missingFields.length === 0;

  const walletBalance = useMemo(() => {
    if (selectedToken === 'POL') return parseFloat(balanceNative || '0');
    if (selectedToken === 'USDC') return parseFloat(balanceUsdc || '0');
    return parseFloat(balanceUsdt || '0');
  }, [selectedToken, balanceNative, balanceUsdc, balanceUsdt]);

  const hasSufficientBalance = useMemo(() => {
    if (parsedAmount <= 0) return true;
    const fb = calculateFeeBreakdownFromString(amount, selectedToken);
    return walletBalance >= parseFloat(fb.clientDepositFormatted);
  }, [parsedAmount, amount, selectedToken, walletBalance]);

  // Strict Freelancer Role Guard (friendly light-mode notice)
  const isFreelancerOnlyBlocked = accountMode === 'freelancer' || (!isClientAllowed && currentRole === 'freelancer');
  if (isFreelancerOnlyBlocked) {
    return (
      <PageContainer className="pt-10 pb-20">
        <div className="max-w-xl mx-auto rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-10 text-center shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#0A52B8] mx-auto flex items-center justify-center">
            <Briefcase size={26} />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest font-semibold text-[#0A52B8]">
              Client Account Required
            </span>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              Posting jobs requires a Client account
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your wallet is currently registered in <strong>Freelancer</strong> mode. Keep roles cleanly separated—either browse active contracts or switch/register a Client account to fund new escrows.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button as="Link" to="/jobs" variant="primary" size="md" leadingIcon={<ArrowRight size={15} />}>
              Browse Open Jobs
            </Button>
            <Button
              variant="secondary"
              size="md"
              loading={isSwitchingRole}
              onClick={async () => {
                setIsSwitchingRole(true);
                setRole('client');
                await setAccountMode('client');
                setIsSwitchingRole(false);
              }}
            >
              Switch to Client Account
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const insertMarkdown = (syntax: 'bold' | 'list' | 'code') => {
    if (syntax === 'bold') {
      setDescription((prev) => `${prev} **bold text** `);
    } else if (syntax === 'list') {
      setDescription((prev) => `${prev}\n- Deliverable 1\n- Deliverable 2\n`);
    } else if (syntax === 'code') {
      setDescription((prev) => `${prev}\n\`\`\`solidity\n// specification\n\`\`\`\n`);
    }
  };

  const handleOpenConfirm = () => {
    setTitleTouched(true);
    setDescTouched(true);
    if (isFormValid) {
      setIsConfirmModalOpen(true);
    }
  };

  const handleFinalSubmit = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    if (isWrongNetwork) {
      await switchToTargetNetwork();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const isNativeToken = selectedToken === 'POL';
    const tokenPriceUsd = rates.cryptoPrices[selectedToken] || 1.0;
    const usdEquivalent = (parsedAmount * tokenPriceUsd).toFixed(2);

    try {
      const newJob = await postJob(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          skillsRequired: skills,
          milestones,
          amountUsdc: usdEquivalent,
          amountEth: isNativeToken ? amount : undefined,
          paymentTokenSymbol: selectedToken,
          reviewPeriodDays: parseInt(reviewPeriodDays) || 7,
        } as any,
        address
      );

      try {
        localStorage.removeItem('polylance_job_draft');
      } catch {}

      confetti({ particleCount: 100, spread: 70 });
      setIsConfirmModalOpen(false);
      navigate(`/jobs/${newJob.id}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to deploy escrow job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentClientProfile = address
    ? profiles[Object.keys(profiles).find((k) => k.toLowerCase() === address.toLowerCase()) || '']
    : null;
  const previewBreakdown = calculateFeeBreakdownFromString(amount || '0', selectedToken);

  return (
    <PageContainer className="pt-8 pb-20">
      <PageHeader
        title="Post a job"
        subtitle="Create a non-custodial milestone contract. Escrow locks cleanly on Polygon PoS and releases upon client approval."
        actions={<WatchButton id="task-post-job" label="Watch how to post (35s)" onOpen={openVideo} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start text-left">
        {/* LEFT COLUMN (lg:col-span-7): Guided 4-Step Job Composer */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Category & Subcategory */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Card className="p-6 rounded-2xl border-slate-200/90 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-[#0A52B8] text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h2 className="text-base font-bold text-[#0F172A]">Category &amp; Subcategory</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {taxonomyCategories.map((cat) => {
                  const active = category === cat.slug || resolveDomainId(category) === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.slug as SkillCategory);
                        setSubcategory(cat.subcategories[0]?.slug || '');
                        const resolved = resolveDomainId(cat.slug);
                        const dom = resolved ? DOMAIN_BY_ID[resolved] : null;
                        if (dom && dom.skills.length > 0) setSkills(dom.skills.slice(0, 3));
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-[#EFF6FF] border-[#0A52B8] text-[#0A52B8] font-semibold'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-[#0F172A]'
                      }`}
                    >
                      <span className="text-xs leading-tight block line-clamp-2">{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Primary Discipline</label>
                  <PolyLanceSelect
                    value={category}
                    onChange={(val) => {
                      setCategory(val as SkillCategory);
                      const resolved = resolveDomainId(val);
                      const domConfig = resolved ? DOMAIN_BY_ID[resolved] : null;
                      if (domConfig && domConfig.skills.length > 0) {
                        setSkills(domConfig.skills.slice(0, 3));
                      }
                    }}
                    options={CATEGORY_OPTIONS}
                    size="md"
                  />
                </div>
                {activeTaxonomyCat && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subcategory Focus</label>
                    <PolyLanceSelect
                      value={subcategory || activeTaxonomyCat.subcategories[0]?.slug || ''}
                      onChange={setSubcategory}
                      options={activeTaxonomyCat.subcategories.map((s) => ({
                        value: s.slug,
                        label: s.name,
                      }))}
                      size="md"
                    />
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* STEP 2: Job Details & Required Skills */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
            <Card className="p-6 rounded-2xl border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#0A52B8] text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <h2 className="text-base font-bold text-[#0F172A]">Job Details &amp; Required Skills</h2>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => insertMarkdown('bold')} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600" title="Bold">
                    <Bold size={14} />
                  </button>
                  <button type="button" onClick={() => insertMarkdown('list')} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600" title="List">
                    <List size={14} />
                  </button>
                  <button type="button" onClick={() => insertMarkdown('code')} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600" title="Code">
                    <Code size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDescPreview(!showDescPreview)}
                    className={`ml-2 px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer ${
                      showDescPreview ? 'bg-[#EFF6FF] text-[#0A52B8] border-[#BFDBFE]' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Eye size={13} />
                    <span>{showDescPreview ? 'Edit' : 'Preview'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Job title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setTitleTouched(true)}
                  placeholder="e.g. Build an Escrow Staking Smart Contract in Foundry"
                  className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0A52B8]/25 focus:border-[#0A52B8] ${
                    titleTouched && !isTitleValid ? 'border-rose-500' : 'border-slate-200'
                  }`}
                />
                <div className="flex items-center justify-between mt-1 text-xs">
                  {titleTouched && !isTitleValid ? (
                    <span className="text-rose-600">Title must be at least 5 characters</span>
                  ) : (
                    <span className="text-slate-500">Clear, outcome-focused title</span>
                  )}
                  <span className="text-slate-500 font-mono">{title.length}/100</span>
                </div>
              </div>

              {showDescPreview ? (
                <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl min-h-[140px] text-sm text-[#0F172A]">
                  <FormattedJobDescription description={description || '_No description added yet._'} />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Scope &amp; Acceptance Criteria</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => setDescTouched(true)}
                    rows={5}
                    maxLength={5000}
                    placeholder="Detail deliverables, timeline expectations, and acceptance criteria..."
                    className={`w-full bg-white border rounded-xl p-3.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0A52B8]/25 focus:border-[#0A52B8] ${
                      descTouched && !isDescValid ? 'border-rose-500' : 'border-slate-200'
                    }`}
                  />
                  {descTouched && !isDescValid && (
                    <span className="text-xs text-rose-600 mt-1 block">Description must be at least 20 characters</span>
                  )}
                </div>
              )}

              <SkillAutocomplete
                label="Required skills"
                skills={skills}
                onChange={setSkills}
                selectedCategory={category}
                placeholder="e.g. Solidity, Figma, Video Editing..."
              />
            </Card>
          </motion.div>

          {/* STEP 3: Freelancer Verification Preference */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
            <Card className="p-6 rounded-2xl border-slate-200/90 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-[#0A52B8] text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <h2 className="text-base font-bold text-[#0F172A]">Freelancer Verification Preference</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'any' as VerificationPref,
                    label: 'Any Verified',
                    desc: 'Open to both GitHub & Portfolio verified talent',
                    icon: Sparkles,
                  },
                  {
                    id: 'github' as VerificationPref,
                    label: 'GitHub Verified',
                    desc: 'Best for Engineering, Smart Contracts & AI roles',
                    icon: Github,
                  },
                  {
                    id: 'portfolio' as VerificationPref,
                    label: 'Portfolio Verified',
                    desc: 'Best for Design, Video, Creators & Marketing roles',
                    icon: Palette,
                  },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = verificationPreference === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVerificationPreference(opt.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                        active
                          ? 'bg-[#EFF6FF] border-[#0A52B8] ring-1 ring-[#0A52B8]/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
                        <Icon size={14} className="text-[#0A52B8]" />
                        <span>{opt.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* STEP 4: Milestone & Escrow Budget */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }}>
            <Card className="p-6 rounded-2xl border-slate-200/90 space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-[#0A52B8] text-white flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <h2 className="text-base font-bold text-[#0F172A]">Milestone &amp; Escrow Budget</h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['POL', 'USDC', 'USDT'] as const).map((tok) => {
                  const isSelected = selectedToken === tok;
                  const price = rates.cryptoPrices[tok] || (tok === 'POL' ? 0.089 : 1.0);
                  return (
                    <button
                      key={tok}
                      type="button"
                      onClick={() => setSelectedToken(tok)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all text-left ${
                        isSelected
                          ? 'border-[#0A52B8] bg-[#EFF6FF]'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#0F172A]">{tok}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#0A52B8]" />}
                      </div>
                      <span className={`text-xs block mt-1 ${isSelected ? 'text-[#0A52B8] font-medium' : 'text-slate-500'}`}>
                        ~${price < 0.1 ? price.toFixed(4) : price.toFixed(2)} USD
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Principal Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="principal-amount" className="text-xs font-semibold text-slate-700">
                      Total Principal ({selectedToken})
                    </label>
                    {parsedAmount > 0 && (
                      <span className="text-xs text-slate-500 tabular-nums">
                        {convertCryptoToFiat(parsedAmount, selectedToken, selectedFiat).formatted}
                      </span>
                    )}
                  </div>
                  <input
                    id="principal-amount"
                    aria-label={`Principal amount in ${selectedToken}`}
                    type="number"
                    step="any"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0A52B8]/25 focus:border-[#0A52B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Client Review SLA Window
                  </label>
                  <PolyLanceSelect
                    value={reviewPeriodDays}
                    onChange={setReviewPeriodDays}
                    options={REVIEW_PERIOD_OPTIONS}
                    size="md"
                  />
                </div>
              </div>

              {/* Interactive Milestones List */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0F172A]">
                    Escrow Milestones ({milestones.length})
                  </span>
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="text-xs font-semibold text-[#0A52B8] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add milestone</span>
                  </button>
                </div>

                {milestones.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 w-5 shrink-0">0{i + 1}</span>
                    <input
                      type="text"
                      value={m.title}
                      onChange={(e) => updateMilestone(m.id, { title: e.target.value })}
                      placeholder="Milestone scope"
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A]"
                    />
                    <input
                      type="number"
                      min="1"
                      value={m.amount}
                      onChange={(e) => updateMilestone(m.id, { amount: e.target.value })}
                      className="w-24 shrink-0 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-[#0F172A]"
                    />
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(m.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                        aria-label="Remove milestone"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Optional Specs/Attachments */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">Spec Links / IPFS CIDs (Optional)</label>
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    placeholder="Add Figma link, GitHub spec, or IPFS CID..."
                    value={attachmentInput}
                    onChange={(e) => setAttachmentInput(e.target.value)}
                    className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F172A]"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (attachmentInput.trim()) {
                        setAttachments([...attachments, attachmentInput.trim()]);
                        setAttachmentInput('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {!isFormValid && (
                <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                  <span className="font-semibold text-[#0F172A] block">Required to publish:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {missingFields.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <Button variant="secondary" onClick={handleSaveDraft} icon={<Bookmark size={15} />}>
                  Save draft
                </Button>
                <Button variant="primary" disabled={!isFormValid} onClick={handleOpenConfirm}>
                  Review and post job
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* RIGHT COLUMN (lg:col-span-5): Sticky Live Job Preview + Smart Contract Escrow Summary */}
        <div className="lg:col-span-5 sticky top-[88px] space-y-5">
          {/* Live Job Card Preview */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#0A52B8]">
                Live Freelancer Preview
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[10px] font-mono font-semibold text-[#0A52B8]">
                Escrow Draft
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#F8FAFC] border border-slate-200 text-[11px] font-semibold text-[#0F172A]">
                  {activeTaxonomyCat?.name || 'Category'}
                </span>
                {verificationPreference !== 'any' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#0A52B8]">
                    {verificationPreference === 'github' ? 'GitHub Verified Req.' : 'Portfolio Verified Req.'}
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-[#0F172A] leading-snug">
                {title.trim() || 'Your job title appears here'}
              </h3>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {description.trim() ||
                  'Add project scope and deliverables to preview how builders will evaluate this milestone contract.'}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {skills.slice(0, 5).map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-slate-200 text-[11px] text-slate-700"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <ClientTrustBadge
                  compact
                  clientAddress={address}
                  jobs={jobs}
                  profile={currentClientProfile}
                />
                <div className="text-right font-mono text-xs font-bold text-[#0F172A]">
                  {parsedAmount} {selectedToken}
                </div>
              </div>
            </div>
          </div>

          {/* Escrow Breakdown Summary */}
          <Card className="p-5 rounded-2xl border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">Smart Contract Escrow Summary</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#0A52B8]">
                <Lock size={12} />
                <span>Non-Custodial</span>
              </span>
            </div>

            <FeeBreakdown budget={parsedAmount} token={selectedToken} isClient={true} />

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Milestone Total</span>
                <span className="font-mono font-semibold text-[#0F172A]">
                  {previewBreakdown.budgetFormatted} {selectedToken}
                </span>
              </div>
              <div className="flex justify-between">
                <span>2.5% Protocol Fee</span>
                <span className="font-mono font-semibold text-[#0A52B8]">
                  {previewBreakdown.clientFeeFormatted} {selectedToken}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-[#0F172A]">
                <span>Total Escrow Lock</span>
                <span className="font-mono">
                  {previewBreakdown.clientDepositFormatted} {selectedToken}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#0A52B8] shrink-0" />
                <span>Isolated Polygon PoS escrow clone per job</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#0A52B8] shrink-0" />
                <span>Protected by JudgeDAO arbitration &amp; ERC-5192 SBTs</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm escrow job"
        description="Verify deposit breakdown before deploying contract"
        maxWidth="md"
      >
        <div className="space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
              {errorMessage}
            </div>
          )}

          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs text-slate-500 block">Job title</span>
            <span className="text-sm font-bold text-[#0F172A]">{title}</span>
          </div>

          <FeeBreakdown budget={parsedAmount} token={selectedToken} isClient={true} />

          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Wallet size={14} />
              <span>Available balance:</span>
            </div>
            <span className="font-semibold text-[#0F172A]">
              {walletBalance.toFixed(3)} {selectedToken}
            </span>
          </div>

          {!hasSufficientBalance && (
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-xs text-[#0A52B8] flex items-center justify-between">
              <span>Insufficient {selectedToken} balance for deposit and gas.</span>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="font-semibold hover:underline"
              >
                Top-up
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)} disabled={isSubmitting}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleFinalSubmit}
              disabled={isSubmitting || !hasSufficientBalance}
            >
              {isSubmitting ? 'Deploying escrow...' : 'Confirm and fund escrow'}
            </Button>
          </div>
        </div>
      </Modal>

      <VideoModal id={activeVideoId} isOpen={isOpen} onClose={closeVideo} triggerRef={triggerRef} />
    </PageContainer>
  );
};

export default PostJob;
