import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { SkillCategory } from '../types';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { FeeBreakdown } from '../components/common/FeeBreakdown';
import { Amount } from '../components/common/Amount';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { TagInput } from '../components/common/FormControls';
import { WatchButton, VideoModal, useVideoModal } from '../components/video';
import { CATEGORIES } from '../utils/formatters';
import { resolveDomainId, DOMAIN_BY_ID } from '../utils/domainMapping';
import { useLiveCurrencyRates, convertCryptoToFiat, useGlobalFiat } from '../utils/currency';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Bold,
  List,
  Code,
  Eye,
  RefreshCw,
  Wallet,
  ArrowRight,
  Bookmark,
  AlertTriangle,
} from 'lucide-react';
import { FormattedJobDescription } from '../components/FormattedJobDescription';
import { PolyLanceSelect, SelectOption } from '../components/PolyLanceSelect';

const CATEGORY_OPTIONS: SelectOption[] = CATEGORIES.map((cat) => ({
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

export const PostJob: React.FC = () => {
  const {
    address,
    isConnected,
    connectWallet,
    balanceNative,
    balanceUsdc,
    balanceUsdt,
    isWrongNetwork,
    targetChainName,
    switchToTargetNetwork,
  } = useWeb3();
  const { postJob } = usePolyLanceData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form State
  const initialDomain = resolveDomainId(searchParams.get('domain') || searchParams.get('category'));
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [category, setCategory] = useState<SkillCategory>((initialDomain as SkillCategory) || 'web3');
  const [skills, setSkills] = useState<string[]>(
    initialDomain && DOMAIN_BY_ID[initialDomain]
      ? DOMAIN_BY_ID[initialDomain].skills.slice(0, 2)
      : ['Solidity', 'Smart Contracts']
  );
  const [description, setDescription] = useState('');
  const [descTouched, setDescTouched] = useState(false);
  const [showDescPreview, setShowDescPreview] = useState(false);

  // Sync category & skills when domain search param changes
  useEffect(() => {
    const rawParam = searchParams.get('domain') || searchParams.get('category');
    const resolved = resolveDomainId(rawParam);
    if (resolved) {
      setCategory(resolved as SkillCategory);
      const domConfig = DOMAIN_BY_ID[resolved];
      if (domConfig && domConfig.skills.length > 0) {
        setSkills(domConfig.skills.slice(0, 2));
      }
    }
  }, [searchParams]);

  // Budget
  const [selectedToken, setSelectedToken] = useState<'POL' | 'USDC' | 'USDT'>('POL');
  const [amount, setAmount] = useState('50');
  const [reviewPeriodDays, setReviewPeriodDays] = useState('7');
  const { activeVideoId, isOpen, openVideo, closeVideo, triggerRef } = useVideoModal();
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachmentInput, setAttachmentInput] = useState('');

  // Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedFiat] = useGlobalFiat();
  const rates = useLiveCurrencyRates();

  // Load draft from localStorage on mount
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

  // Validation
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

  // Wallet balance for selected token
  const walletBalance = useMemo(() => {
    if (selectedToken === 'POL') return parseFloat(balanceNative || '0');
    if (selectedToken === 'USDC') return parseFloat(balanceUsdc || '0');
    return parseFloat(balanceUsdt || '0');
  }, [selectedToken, balanceNative, balanceUsdc, balanceUsdt]);

  const hasSufficientBalance = walletBalance >= parsedAmount * 1.025; // includes 2.5% client fee

  // Markdown toolbar insertion
  const insertMarkdown = (syntax: 'bold' | 'list' | 'code') => {
    if (syntax === 'bold') {
      setDescription((prev) => `${prev} **bold text** `);
    } else if (syntax === 'list') {
      setDescription((prev) => `${prev}\n- Item 1\n- Item 2\n`);
    } else if (syntax === 'code') {
      setDescription((prev) => `${prev}\n\`\`\`solidity\n// code here\n\`\`\`\n`);
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
          amountUsdc: usdEquivalent,
          amountEth: isNativeToken ? amount : undefined,
          paymentTokenSymbol: selectedToken,
          reviewPeriodDays: parseInt(reviewPeriodDays) || 7,
        },
        address
      );

      // Clear draft
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

  return (
    <PageContainer className="py-8">
      {/* Page Title & Subtitle */}
      <PageHeader
        title="Post a job"
        subtitle="Create a verified milestone escrow contract. Funds remain safely locked until deliverables are approved."
        badge={
          <WatchButton
            id="task-post-job"
            label="Watch how to post (35s)"
            onOpen={openVideo}
          />
        }
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Numbered Sections (1 to 6) */}
        <div className="lg:col-span-8 space-y-8">
          {/* SECTION 1: Basics */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
              <span className="w-6 h-6 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-xs font-semibold">
                1
              </span>
              <h2 className="text-base font-semibold text-[#0B0B0F]">Basics</h2>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                Job title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setTitleTouched(true)}
                placeholder="e.g. Build an Escrow Staking Smart Contract in Foundry"
                className={`w-full bg-white border rounded-[8px] px-3.5 py-2.5 text-sm text-[#0B0B0F] focus:outline-none focus:ring-2 focus:ring-[#0047AB] ${
                  titleTouched && !isTitleValid ? 'border-[#EF4444]' : 'border-[#E5E7EB]'
                }`}
              />
              <div className="flex items-center justify-between mt-1 text-xs">
                {titleTouched && !isTitleValid ? (
                  <span className="text-[#DC2626]">Title must be at least 5 characters</span>
                ) : (
                  <span className="text-[#6B7280]">Write a descriptive, outcome-focused title</span>
                )}
                <span className="text-[#6B7280]">{title.length}/100</span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                Category
              </label>
              <PolyLanceSelect
                value={category}
                onChange={(val) => setCategory(val as SkillCategory)}
                options={CATEGORY_OPTIONS}
                size="md"
              />
            </div>

            {/* Skills */}
            <TagInput
              label="Required skills"
              tags={skills}
              onChange={setSkills}
              placeholder="e.g. Solidity, React, Hardhat..."
            />
          </Card>

          {/* SECTION 2: Description */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <h2 className="text-base font-semibold text-[#0B0B0F]">Description</h2>
              </div>
              {/* Markdown controls & Preview Toggle */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertMarkdown('bold')}
                  className="p-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#4B5563]"
                  title="Bold"
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('list')}
                  className="p-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#4B5563]"
                  title="List"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('code')}
                  className="p-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#4B5563]"
                  title="Code snippet"
                >
                  <Code size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowDescPreview(!showDescPreview)}
                  className={`ml-2 px-2.5 py-1 rounded-[6px] text-xs font-medium border flex items-center gap-1 ${
                    showDescPreview
                      ? 'bg-[#EFF6FF] text-[#0047AB] border-[#BFDBFE]'
                      : 'bg-white text-[#4B5563] border-[#E5E7EB]'
                  }`}
                >
                  <Eye size={13} />
                  <span>{showDescPreview ? 'Edit' : 'Preview'}</span>
                </button>
              </div>
            </div>

            {showDescPreview ? (
              <div className="p-4 bg-[#F6F7F9] rounded-[8px] min-h-[160px] text-sm text-[#0B0B0F] max-w-none">
                <FormattedJobDescription description={description || '_No description provided yet._'} />
              </div>
            ) : (
              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => setDescTouched(true)}
                  rows={6}
                  maxLength={5000}
                  placeholder="Detail the deliverables, acceptance criteria, and technical stack required..."
                  className={`w-full bg-white border rounded-[8px] p-3 text-sm text-[#0B0B0F] focus:outline-none focus:ring-2 focus:ring-[#0047AB] ${
                    descTouched && !isDescValid ? 'border-[#EF4444]' : 'border-[#E5E7EB]'
                  }`}
                />
                <div className="flex items-center justify-between mt-1 text-xs">
                  {descTouched && !isDescValid ? (
                    <span className="text-[#DC2626]">
                      Description must be at least 20 characters
                    </span>
                  ) : (
                    <span className="text-[#6B7280]">Markdown formatting supported</span>
                  )}
                  <span className="text-[#6B7280]">{description.length}/5000</span>
                </div>
              </div>
            )}
          </Card>

          {/* SECTION 3: Budget and payment */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
              <span className="w-6 h-6 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-xs font-semibold">
                3
              </span>
              <h2 className="text-base font-semibold text-[#0B0B0F]">Budget and payment</h2>
            </div>

            {/* Token Selector Cards */}
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-2">
                Escrow settlement token
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['POL', 'USDC', 'USDT'] as const).map((tok) => {
                  const isSelected = selectedToken === tok;
                  const price = rates.cryptoPrices[tok] || (tok === 'POL' ? 0.45 : 1.0);
                  return (
                    <div
                      key={tok}
                      onClick={() => setSelectedToken(tok)}
                      className={`p-3.5 rounded-[8px] border cursor-pointer transition-colors text-left ${
                        isSelected
                          ? 'border-[#0047AB] bg-[#EFF6FF]'
                          : 'border-[#E5E7EB] bg-white hover:border-[#9CA3AF]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#0B0B0F]">{tok}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#0047AB]" />
                        )}
                      </div>
                      <span className={`text-xs block mt-1 ${isSelected ? 'text-[#0047AB] font-medium' : 'text-[#4B5563]'}`}>
                        ~ ${price.toFixed(2)} USD
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Amount input & presets */}
            <div>
              <label htmlFor="principal-amount" className="block text-xs font-medium text-[#4B5563] mb-1.5">
                Principal amount ({selectedToken})
              </label>
              <div className="flex gap-2">
                <input
                  id="principal-amount"
                  aria-label={`Principal amount in ${selectedToken}`}
                  type="number"
                  step="any"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-white border border-[#E5E7EB] rounded-[8px] px-3.5 py-2.5 text-sm text-[#0B0B0F] focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
                />
              </div>

              {/* Presets */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-[#6B7280]">Presets:</span>
                {[10, 50, 100, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toString())}
                    className="px-2.5 py-1 rounded-[6px] bg-[#F6F7F9] border border-[#E5E7EB] text-xs font-medium text-[#0B0B0F] hover:bg-white"
                  >
                    {preset} {selectedToken}
                  </button>
                ))}
              </div>

              {/* Plain language milestone note */}
              <p className="mt-2.5 text-xs text-[#6B7280]">
                You'll agree on milestones with the freelancer before funding.
              </p>
            </div>
          </Card>

          {/* SECTION 4: Timeline and review */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
              <span className="w-6 h-6 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-xs font-semibold">
                4
              </span>
              <h2 className="text-base font-semibold text-[#0B0B0F]">Timeline and review</h2>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                Review window (days)
              </label>
              <PolyLanceSelect
                value={reviewPeriodDays}
                onChange={setReviewPeriodDays}
                options={REVIEW_PERIOD_OPTIONS}
                size="md"
              />
              <p className="mt-1.5 text-xs text-[#4B5563]">
                After work is submitted, the client has {reviewPeriodDays} days to approve or dispute before funds auto-release.
              </p>
            </div>
          </Card>

          {/* SECTION 5: Attachments */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
              <span className="w-6 h-6 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-xs font-semibold">
                5
              </span>
              <h2 className="text-base font-semibold text-[#0B0B0F]">Attachments & specs (optional)</h2>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add specification link or IPFS CID..."
                value={attachmentInput}
                onChange={(e) => setAttachmentInput(e.target.value)}
                className="flex-1 bg-white border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-xs text-[#0B0B0F] focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
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

            {attachments.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="p-2 bg-[#F6F7F9] rounded-[8px] border border-[#E5E7EB] flex items-center justify-between text-xs"
                  >
                    <span className="truncate max-w-md text-[#0B0B0F]">{att}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                      className="text-[#DC2626] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* SECTION 6: Review and post */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
              <span className="w-6 h-6 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-xs font-semibold">
                6
              </span>
              <h2 className="text-base font-semibold text-[#0B0B0F]">Review and post</h2>
            </div>

            {/* Validation Feedback */}
            {!isFormValid && (
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-[8px] text-xs text-[#92400E] space-y-1">
                <span className="font-semibold block">Complete the following to publish:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {missingFields.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                icon={<Bookmark size={15} />}
              >
                Save draft
              </Button>

              <Button
                variant="primary"
                disabled={!isFormValid}
                onClick={handleOpenConfirm}
              >
                Review and post job
              </Button>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: ONE Sticky Summary */}
        <div className="lg:col-span-4 sticky top-24 space-y-6">
          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-semibold text-[#0B0B0F]">Escrow breakdown</h3>

            {/* Reused Single FeeBreakdown */}
            <FeeBreakdown budget={parsedAmount} token={selectedToken} />

            {/* Guarantees */}
            <div className="pt-3 border-t border-[#E5E7EB] space-y-2 text-xs text-[#4B5563]">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#166534] shrink-0 mt-0.5" />
                <span>100% on-chain smart contract escrow deposit</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#166534] shrink-0 mt-0.5" />
                <span>Arbitration rights protected by DAO Judge Panel</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#166534] shrink-0 mt-0.5" />
                <span>Automatic Soulbound work certificate minted</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* CONFIRMATION & FUNDING MODAL */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm escrow job"
        description="Verify deposit breakdown before deploying contract"
        maxWidth="md"
      >
        <div className="space-y-5">
          {errorMessage && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] text-xs text-[#991B1B]">
              {errorMessage}
            </div>
          )}

          {/* Job summary recap */}
          <div className="p-3 bg-[#F6F7F9] rounded-[8px] border border-[#E5E7EB] space-y-1">
            <span className="text-xs text-[#6B7280] block">Job title</span>
            <span className="text-sm font-semibold text-[#0B0B0F]">{title}</span>
          </div>

          <FeeBreakdown budget={parsedAmount} token={selectedToken} />

          {/* Wallet Balance check */}
          <div className="p-3 bg-white border border-[#E5E7EB] rounded-[8px] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[#4B5563]">
              <Wallet size={14} />
              <span>Available balance:</span>
            </div>
            <span className="font-semibold text-[#0B0B0F]">
              {walletBalance.toFixed(3)} {selectedToken}
            </span>
          </div>

          {!hasSufficientBalance && (
            <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-[8px] text-xs text-[#92400E] flex items-center justify-between">
              <span>Insufficient {selectedToken} balance for deposit and gas.</span>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-[#0047AB] font-semibold hover:underline"
              >
                Top-up
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
            <Button
              variant="ghost"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isSubmitting}
            >
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

      {/* Global Video Modal */}
      <VideoModal
        id={activeVideoId}
        isOpen={isOpen}
        onClose={closeVideo}
        triggerRef={triggerRef}
      />
    </PageContainer>
  );
};

export default PostJob;
