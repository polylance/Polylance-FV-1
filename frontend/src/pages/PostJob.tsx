import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { SkillCategory } from '../types';
import { SuccessState } from '../components/UIStates';
import { PolyLanceAlertModal, AlertModalOptions } from '../components/PolyLanceAlertModal';
import { PolyLanceSelect, SelectOption } from '../components/PolyLanceSelect';
import { 
  DollarSign, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Briefcase, 
  Star, 
  Layers, 
  Code2, 
  Database, 
  Smartphone, 
  Rocket, 
  ShieldCheck, 
  Lock, 
  Zap,
  Wallet,
  Coins,
  CreditCard,
  Check,
  RefreshCw,
  ArrowRight,
  Search,
  Eye,
  Bold,
  List,
  Code,
  AlertTriangle,
  Award,
  Scale
} from 'lucide-react';
import { RocketIcon, RocketIconHandle } from '../components/RocketIcon';
import { generateIpfsCid } from '../utils/ipfs';
import { SUPPORTED_FIAT, SUPPORTED_CRYPTO, getActiveRates, useLiveCurrencyRates, fetchLiveExchangeRates } from '../utils/currency';
import { FormattedJobDescription } from '../components/FormattedJobDescription';
import { TokenIcon } from '../components/TokenIcon';

export const PostJob: React.FC = () => {
  const { 
    address, 
    isConnected, 
    connectWallet, 
    currentRole, 
    balanceNative, 
    balanceUsdc, 
    balanceUsdt, 
    isWrongNetwork, 
    targetChainName, 
    switchToTargetNetwork 
  } = useWeb3();
  const { postJob } = usePolyLanceData();
  const navigate = useNavigate();
  const rocketRef = useRef<RocketIconHandle>(null);


  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescPreview, setShowDescPreview] = useState(false);
  const [category, setCategory] = useState<SkillCategory>('web3');
  const [reviewPeriodDays, setReviewPeriodDays] = useState<number | string>(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [alertModalOptions, setAlertModalOptions] = useState<AlertModalOptions | null>(null);

  useEffect(() => {
    if (createdJobId) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    }
  }, [createdJobId]);

  // Advanced Multi-Currency & Interactive 3D Conversion State (Default: POL on Polygon)
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'USDT' | 'POL'>('POL');
  const [tokenAmount, setTokenAmount] = useState('0.05');
  const [selectedFiat, setSelectedFiat] = useState('INR');
  const [activeTab, setActiveTab] = useState<'crypto' | 'fiat'>('crypto');
  const [fiatInputVal, setFiatInputVal] = useState('208750');

  const fiatSelectOptions = useMemo<SelectOption<string>[]>(() => {
    return SUPPORTED_FIAT.map((fiat) => ({
      value: fiat.code,
      label: `${fiat.name}`,
      sublabel: `(${fiat.symbol} - ${fiat.code})`,
      flag: fiat.flag,
    }));
  }, []);

  const isFormValid = Boolean(
    title.trim() &&
    description.trim() &&
    (parseFloat(tokenAmount) > 0 || parseFloat(fiatInputVal) > 0) &&
    reviewPeriodDays !== '' &&
    Number(reviewPeriodDays) > 0
  );

  const rates = useLiveCurrencyRates();
  const tokenPriceUsd = rates.cryptoPrices[selectedToken] || 1.0;
  const fiatRateVsUsd = rates.fiatRates[selectedFiat] || 1.0;

  // 2-way reactive sync logic
  useEffect(() => {
    if (activeTab === 'crypto') {
      const cryptoVal = parseFloat(tokenAmount) || 0;
      const usdVal = cryptoVal * tokenPriceUsd;
      const fiatVal = usdVal * fiatRateVsUsd;
      setFiatInputVal(fiatVal.toFixed(2));
    }
  }, [tokenAmount, selectedToken, selectedFiat, activeTab, tokenPriceUsd, fiatRateVsUsd]);

  useEffect(() => {
    if (activeTab === 'fiat') {
      const fiatVal = parseFloat(fiatInputVal) || 0;
      const usdVal = fiatVal / fiatRateVsUsd;
      const cryptoVal = usdVal / tokenPriceUsd;
      setTokenAmount(cryptoVal.toFixed(selectedToken === 'POL' ? 4 : 2));
    }
  }, [fiatInputVal, selectedToken, selectedFiat, activeTab, tokenPriceUsd, fiatRateVsUsd]);

  const handleSelectToken = (tokenId: 'USDC' | 'USDT' | 'POL') => {
    if (tokenId === selectedToken) return;
    setSelectedToken(tokenId);
    if (tokenId === 'POL') {
      if (parseFloat(tokenAmount) >= 20 || !tokenAmount) {
        setTokenAmount('0.05');
      }
    } else if (tokenId === 'USDC' || tokenId === 'USDT') {
      if (parseFloat(tokenAmount) <= 2 || !tokenAmount) {
        setTokenAmount('50');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setAlertModalOptions({
        title: 'Missing Required Fields',
        message: 'Please provide both a Job Title and Detailed Scope Description before publishing your escrow job.',
        type: 'warning'
      });
      return;
    }
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (isConnected && isWrongNetwork) {
      try {
        await switchToTargetNetwork();
      } catch (err: any) {
        setAlertModalOptions({
          title: 'Switch Network Required',
          message: `Please switch your wallet network to ${targetChainName} to deploy this escrow job.`,
          type: 'warning',
        });
      }
      return;
    }

    const usdEquivalent = (parseFloat(tokenAmount) * tokenPriceUsd).toFixed(2);
    const parsedReviewPeriod = typeof reviewPeriodDays === 'number' ? reviewPeriodDays : (parseInt(reviewPeriodDays) || 7);
    const isNativeToken = (selectedToken as string) === 'POL' || (selectedToken as string) === 'MATIC';

    setIsSubmitting(true);
    try {
      const newJob = await postJob(
        {
          title,
          description,
          category,
          amountUsdc: usdEquivalent,
          amountEth: isNativeToken ? tokenAmount : undefined,
          paymentTokenSymbol: selectedToken as any,
          reviewPeriodDays: parsedReviewPeriod,
        },
        address
      );
      setIsSubmitting(false);
      setCreatedJobId(newJob.id);
    } catch (err: any) {
      console.error('Job submission failed:', err);
      setIsSubmitting(false);
      setAlertModalOptions({
        title: 'Post Job Failed',
        message: err?.message || 'Failed to post job. Please check your wallet connection and try again.',
        type: 'error',
      });
    }
  };

  if (createdJobId) {
    return (
      <div className="min-h-[80vh] py-16 px-4 bg-slate-50 flex items-center justify-center">
        <SuccessState
          title="Job Escrow Deployed On-Chain!"
          description="Your job escrow contract has been successfully cloned and deployed on-chain with sovereign oracle pricing."
          actionText="View Deployed Job"
          onAction={() => navigate(`/jobs/${createdJobId}`)}
        />
      </div>
    );
  }

  // Guard: Only Clients, Judges, and Admins can post jobs
  if (isConnected && currentRole === 'freelancer') {
    return (
      <div className="min-h-[70vh] py-16 px-4 max-w-xl mx-auto flex flex-col items-center justify-center text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs">
          <Briefcase size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-[#0B0B0C] tracking-tight">
            Job Posting is for Clients & Admins
          </h2>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Your connected wallet is active in <span className="font-bold text-[#0047AB] uppercase font-mono">Freelancer Mode</span>. Freelancers can apply to active smart contract escrow jobs, submit deliverables, and earn soulbound reputation tokens.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/jobs')}
            className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-6 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Search size={15} />
            Browse Open Jobs
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white hover:bg-slate-50 px-5 py-2.5 rounded-lg font-bold text-xs text-[#0B0B0C] border border-[#E2E6EC] shadow-2xs transition-colors cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 w-full text-[#0B0B0C] space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0B0B0C] tracking-tight leading-tight">
          Post an <span className="text-[#0047AB]">On-Chain</span> Escrow Job
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Create milestone-protected jobs with automated escrow and sovereign oracle pricing.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#0066FF]/25 shadow-xs text-slate-700 text-[11px] sm:text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#00D2FF] shadow-[0_0_8px_#00D2FF] shrink-0 animate-pulse" />
          <span><strong>2.5% Protocol Fee:</strong> Transparent on-chain escrow protection routed to protocol treasury.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xs border border-[#E2E6EC] p-6 sm:p-8 space-y-8 relative overflow-hidden">
        {/* Job Title Row */}
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-[#E2E6EC] flex items-center justify-center text-[#0047AB] shrink-0 mt-0.5">
            <Briefcase size={20} />
          </div>
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-bold text-[#0B0B0C] uppercase tracking-wider font-mono">
              Job Title <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Full-Stack Web3 Application with Smart Contract Integration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-[#E2E6EC] rounded-xl text-[#0B0B0C] text-sm font-medium focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Skill Category Selector */}
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-[#E2E6EC] flex items-center justify-center text-[#0047AB] shrink-0 mt-0.5">
            <Star size={20} />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-bold text-[#0B0B0C] uppercase tracking-wider font-mono">
                Primary Skill Category <span className="text-rose-600">*</span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { 
                  id: 'web3', 
                  label: 'Web3 / Solidity', 
                  desc: 'Solidity, Smart Contracts, DeFi',
                  icon: <Layers size={18} />,
                },
                { 
                  id: 'frontend', 
                  label: 'Frontend UI', 
                  desc: 'TypeScript, React, Next.js, CSS',
                  icon: <Code2 size={18} />,
                },
                { 
                  id: 'backend', 
                  label: 'Backend Systems', 
                  desc: 'Rust, Go, Python, APIs',
                  icon: <Database size={18} />,
                },
                { 
                  id: 'mobile', 
                  label: 'Mobile Apps', 
                  desc: 'Flutter, React Native, Swift',
                  icon: <Smartphone size={18} />,
                },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as SkillCategory)}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    category === cat.id
                      ? 'bg-gradient-to-r from-blue-50/70 to-cyan-50/40 border-2 border-[#0066FF] shadow-xs'
                      : 'bg-white border-[#E2E6EC] hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    category === cat.id 
                      ? 'bg-gradient-to-r from-[#0047AB] to-[#0066FF] text-white shadow-xs' 
                      : 'bg-slate-50 border border-[#E2E6EC] text-slate-700'
                  }`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#0B0B0C]">{cat.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{cat.desc}</div>
                  </div>
                  <div className="shrink-0 ml-auto">
                    {category === cat.id ? (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#0047AB] to-[#0066FF] text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 size={14} className="stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300 bg-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Token & Currency Escrow Settings */}
        <div className="border-t border-[#E2E6EC] pt-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-[#E2E6EC] text-[#0047AB] flex items-center justify-center">
              <Coins size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B0B0C] font-serif">Escrow Budget & Currency Configuration</h3>
              <p className="text-[10px] text-slate-500 font-mono">Live pricing and secure escrow deposits in standard stablecoins or native crypto</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Selection Column: Token & Rates Selector */}
            <div className="md:col-span-7 space-y-6">
              {/* 1. Token Payment Options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                  Select Payment Currency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SUPPORTED_CRYPTO.map((token) => (
                    <button
                      key={token.id}
                      type="button"
                      onClick={() => handleSelectToken(token.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 relative overflow-hidden cursor-pointer ${
                        selectedToken === token.id
                          ? 'bg-blue-50/40 border-2 border-[#0047AB] text-[#0047AB] font-bold shadow-xs'
                          : 'bg-white border-[#E2E6EC] hover:border-slate-300 text-slate-700 hover:text-[#0B0B0C] shadow-2xs'
                      }`}
                    >
                      <TokenIcon token={token.id} size={26} className="mb-1.5" />
                      <span className="text-xs font-mono font-bold">{token.symbol}</span>
                      <span className="text-[9px] font-medium text-slate-500 mt-0.5">${token.priceUsd}</span>
                      {selectedToken === token.id && (
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#0047AB]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Country Fiat Currency Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                  Local Currency Reference
                </label>
                <PolyLanceSelect
                  value={selectedFiat}
                  onChange={(val) => setSelectedFiat(val)}
                  options={fiatSelectOptions}
                  variant="standard"
                  placeholder="Select local currency..."
                />
              </div>

              {/* 3. Two-way Input Tab & Field */}
              <div className="space-y-2">
                <div className="flex border-b border-[#E2E6EC] pb-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('crypto')}
                    className={`pb-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'crypto'
                        ? 'bg-[#0047AB] text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-[#E2E6EC]'
                    }`}
                  >
                    Amount in {selectedToken}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('fiat')}
                    className={`pb-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'fiat'
                        ? 'bg-[#0047AB] text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-[#E2E6EC]'
                    }`}
                  >
                    Amount in {selectedFiat}
                  </button>
                </div>

                {activeTab === 'crypto' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-white border border-[#E2E6EC] focus-within:border-[#0047AB] focus-within:ring-1 focus-within:ring-[#0047AB] rounded-xl px-4 py-2.5">
                      <TokenIcon token={selectedToken} size={20} />
                      <input
                        type="number"
                        inputMode="decimal"
                        required
                        min="0"
                        step="any"
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(e.target.value)}
                        className="w-full bg-transparent border-none text-[#0B0B0C] font-mono font-bold outline-none text-sm focus:ring-0"
                      />
                      <span className="px-2.5 py-1 bg-slate-50 border border-[#E2E6EC] text-[#0047AB] rounded-lg text-xs font-bold font-mono">
                        {selectedToken}
                      </span>
                    </div>

                    {/* Quick Preset Amount Buttons & Live Wallet Balance */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-400 font-medium">Presets:</span>
                        {selectedToken === 'POL' ? (
                          ['0.02', '0.05', '0.1', '0.25', '0.5'].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setTokenAmount(amt)}
                              className={`px-2 py-0.5 rounded-md font-mono font-bold transition-all cursor-pointer ${
                                tokenAmount === amt
                                  ? 'bg-[#0047AB] text-white'
                                  : 'bg-white hover:bg-slate-50 border border-[#E2E6EC] text-slate-700'
                              }`}
                            >
                              {amt} {selectedToken}
                            </button>
                          ))
                        ) : (
                          ['50', '100', '250', '500', '1000'].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setTokenAmount(amt)}
                              className={`px-2 py-0.5 rounded-md font-mono font-bold transition-all cursor-pointer ${
                                tokenAmount === amt
                                  ? 'bg-[#0047AB] text-white'
                                  : 'bg-white hover:bg-slate-50 border border-[#E2E6EC] text-slate-700'
                              }`}
                            >
                              ${amt}
                            </button>
                          ))
                        )}
                      </div>

                      {isConnected && (
                        <div className="inline-flex items-center gap-1 text-slate-500 font-mono font-medium">
                          <span>Wallet:</span>
                          <span className="font-bold text-[#0B0B0C]">
                            {selectedToken === 'USDC'
                              ? `${balanceUsdc} USDC`
                              : selectedToken === 'USDT'
                                ? `${balanceUsdt} USDT`
                                : `${balanceNative} ${selectedToken}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-white border border-[#E2E6EC] focus-within:border-[#0047AB] focus-within:ring-1 focus-within:ring-[#0047AB] rounded-xl px-4 py-2.5">
                    <input
                      type="number"
                      inputMode="decimal"
                      required
                      min="0"
                      step="any"
                      value={fiatInputVal}
                      onChange={(e) => setFiatInputVal(e.target.value)}
                      className="w-full bg-transparent border-none text-[#0B0B0C] font-mono font-bold outline-none text-sm focus:ring-0"
                    />
                    <span className="px-2.5 py-1 bg-slate-50 border border-[#E2E6EC] text-slate-700 rounded-lg text-xs font-bold font-mono">
                      {selectedFiat}
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Review Window Setting (Days) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={13} className="text-[#0047AB]" />
                    Review Window (Days) <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-sans">
                    Auto-release in <span className="font-bold text-[#0047AB]">{reviewPeriodDays || 7}</span> days
                  </span>
                </div>
                
                <div className="flex items-center gap-3 bg-white border border-[#E2E6EC] focus-within:border-[#0047AB] focus-within:ring-1 focus-within:ring-[#0047AB] rounded-xl px-4 py-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-50 text-[#0047AB] flex items-center justify-center shrink-0">
                    <Clock size={13} className="stroke-[2.5]" />
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    min="1"
                    max="30"
                    value={reviewPeriodDays}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setReviewPeriodDays('');
                      } else {
                        const parsed = parseInt(val);
                        setReviewPeriodDays(isNaN(parsed) ? '' : parsed);
                      }
                    }}
                    className="w-full bg-transparent border-none text-[#0B0B0C] font-mono font-bold outline-none text-sm focus:ring-0"
                  />
                  <span className="px-2.5 py-0.5 bg-slate-50 border border-[#E2E6EC] text-slate-700 rounded-md text-xs font-bold font-mono shrink-0">
                    Days
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Escrow Breakdown Card */}
            <div className="md:col-span-5 flex items-center justify-center">
              <div 
                className="w-full p-5 rounded-2xl bg-slate-50 text-[#0B0B0C] border border-[#E2E6EC] shadow-xs select-none font-sans"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-white border border-[#E2E6EC] flex items-center justify-center text-[#0047AB] shrink-0">
                      <ShieldCheck size={13} className="stroke-[2.2]" />
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap font-mono">
                        Live Oracle Synced
                      </span>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 bg-white border border-[#E2E6EC] rounded-lg text-[9px] font-extrabold text-[#0047AB] flex items-center gap-1 shrink-0 font-mono">
                    <CreditCard size={11} className="text-[#0047AB]" />
                    <span>{selectedToken} Escrow</span>
                  </div>
                </div>

                {/* Crypto Escrow Amount */}
                <div className="my-3">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-1 font-mono">
                    ESCROW PRINCIPAL BUDGET
                  </span>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-baseline flex-wrap gap-1.5 min-w-0">
                      <span className="text-2xl font-black tracking-tight text-[#0B0B0C] font-mono">
                        {parseFloat(tokenAmount || '0').toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </span>
                      <span className="text-lg font-bold text-[#0047AB] font-mono">
                        {selectedToken}
                      </span>
                    </div>
                    
                    {/* Dynamic Token Circular Icon */}
                    <div className="w-8 h-8 rounded-full bg-white border border-[#E2E6EC] flex items-center justify-center shrink-0 shadow-2xs">
                      <TokenIcon token={selectedToken} size={20} />
                    </div>
                  </div>
                </div>

                {/* Simplified 2.5% Protocol Fee Card */}
                {(() => {
                  const numAmount = parseFloat(tokenAmount || '0') || 0;
                  const grossUsd = numAmount * (tokenPriceUsd || 1);
                  
                  const clientFeeToken = numAmount * 0.025;
                  const clientFeeUsd = grossUsd * 0.025;
                  const totalClientToken = numAmount + clientFeeToken;
                  const totalClientUsd = grossUsd + clientFeeUsd;

                  const isStable = selectedToken === 'USDC' || selectedToken === 'USDT';
                  const dec = selectedToken === 'POL' ? 4 : 2;

                  return (
                    <div className="my-2 p-3.5 bg-white border border-[#E2E6EC] rounded-xl space-y-2 font-mono text-[10.5px] shadow-2xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Escrow Principal:</span>
                        <span className="font-bold text-[#0B0B0C]">
                          {isStable
                            ? `$${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${selectedToken}`
                            : `${numAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${selectedToken} (~$${grossUsd.toFixed(2)})`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[#0047AB]">
                        <span>Protocol Fee (2.5%):</span>
                        <span className="font-bold">
                          {isStable
                            ? `+$${clientFeeToken.toFixed(2)} ${selectedToken}`
                            : `+${clientFeeToken.toFixed(dec)} ${selectedToken} (+$${clientFeeUsd.toFixed(2)})`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-[#E2E6EC] text-[#0B0B0C] font-bold">
                        <span>Total Deposit to Escrow:</span>
                        <span className="text-[#0B0B0C] font-extrabold text-xs">
                          {isStable
                            ? `$${totalClientToken.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${selectedToken}`
                            : `${totalClientToken.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${selectedToken} (~$${totalClientUsd.toFixed(2)})`}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Freelancer Local Pay Equivalent */}
                <div className="my-3">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-1 font-mono">
                    LOCAL CURRENCY CONVERSION
                  </span>
                  
                  <div className="flex items-baseline flex-wrap gap-1">
                    <span className="text-xl font-bold tracking-tight text-[#0B0B0C] font-mono">
                      {SUPPORTED_FIAT.find(f => f.code === selectedFiat)?.symbol}
                      {parseFloat(fiatInputVal || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      {selectedFiat}
                    </span>
                  </div>
                </div>

                {/* Live Rate Box */}
                <div className="p-2.5 bg-white border border-[#E2E6EC] rounded-xl flex items-center justify-between gap-1.5 my-2 shadow-2xs">
                  <div className="min-w-0">
                    <span className="text-[7.5px] font-bold text-[#0047AB] uppercase tracking-normal block font-mono leading-none mb-0.5">
                      LIVE EXCHANGE RATE
                    </span>
                    <span className="text-[9.5px] font-bold text-[#0B0B0C] font-mono block leading-none whitespace-nowrap">
                      1 {selectedToken} = {SUPPORTED_FIAT.find(f => f.code === selectedFiat)?.symbol}{(tokenPriceUsd * fiatRateVsUsd).toFixed(2)} {selectedFiat}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchLiveExchangeRates()}
                    title="Refresh live exchange rates"
                    className="w-6 h-6 rounded-lg bg-slate-50 text-[#0047AB] border border-[#E2E6EC] hover:bg-slate-100 flex items-center justify-center transition-all shrink-0 cursor-pointer"
                  >
                    <RefreshCw size={10} className="text-[#0047AB]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Spec Description */}
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-[#E2E6EC] flex items-center justify-center text-[#0047AB] shrink-0 mt-0.5">
            <FileText size={20} />
          </div>
          <div className="flex-1 space-y-2 relative">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-bold text-[#0B0B0C] uppercase tracking-wider font-mono">
                Detailed Job Specification <span className="text-rose-600">*</span>
              </label>

              {/* Formatting & Preview Helper Bar */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDescription(prev => prev + (prev.endsWith('\n') ? '' : '\n') + '**Key Requirement:** ')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E6EC] hover:bg-slate-50 text-slate-700 text-[11px] font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Add Bold Highlight"
                >
                  <Bold size={11} /> <span>Bold</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDescription(prev => prev + (prev.endsWith('\n') ? '' : '\n') + '* ')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E6EC] hover:bg-slate-50 text-slate-700 text-[11px] font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Add Bullet Item"
                >
                  <List size={11} /> <span>Bullet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDescription(prev => prev + (prev.endsWith('\n') ? '' : '\n') + '### Scope of Work:\n* ')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E6EC] hover:bg-slate-50 text-slate-700 text-[11px] font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Add Section Heading"
                >
                  <span># Section</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDescPreview(!showDescPreview)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    showDescPreview
                      ? 'bg-[#0047AB] text-white shadow-xs'
                      : 'bg-white border border-[#E2E6EC] hover:bg-slate-50 text-slate-700 shadow-2xs'
                  }`}
                >
                  <Eye size={12} />
                  <span>{showDescPreview ? 'Edit Spec' : 'Live Preview'}</span>
                </button>
              </div>
            </div>

            {showDescPreview ? (
              <div className="w-full p-5 bg-white border border-[#E2E6EC] rounded-xl space-y-2 min-h-[140px] shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E2E6EC] pb-1.5">
                  <span className="text-[10.5px] font-mono font-bold text-[#0047AB] uppercase">
                    Formatted Preview
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Markdown Supported
                  </span>
                </div>
                <FormattedJobDescription description={description} />
              </div>
            ) : (
              <div className="relative">
                <textarea
                  required
                  rows={6}
                  maxLength={2000}
                  placeholder="Describe deliverables, requirements, and milestones... Supports **bold**, * bullet items, and # section headings!"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#E2E6EC] rounded-xl text-[#0B0B0C] text-sm font-medium focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] outline-none resize-none transition-all placeholder:text-slate-400 leading-relaxed"
                />
                <span className="absolute bottom-3 right-4 text-[10px] text-slate-400 font-mono select-none">
                  {description.length} / 2000
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {isConnected && isWrongNetwork ? (
          <button
            type="button"
            onClick={switchToTargetNetwork}
            className="w-full p-4 px-6 rounded-xl shadow-xs hover:bg-amber-700 transition-colors cursor-pointer text-left bg-amber-600 border border-amber-500 text-white"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <AlertTriangle size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white tracking-tight leading-none flex items-center gap-2 flex-wrap">
                    <span>Switch Wallet to {targetChainName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider font-mono bg-white/25 text-white border border-white/30">
                      Network Notice
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-100 font-medium mt-1 font-sans">
                    Click here to switch your wallet network to {targetChainName} to deploy your escrow job.
                  </div>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center shadow-xs">
                  <ArrowRight size={14} className="stroke-[2.5]" />
                </div>
              </div>
            </div>
          </button>
        ) : isFormValid ? (
          <button
            type="submit"
            disabled={isSubmitting}
            onMouseEnter={() => rocketRef.current?.startAnimation()}
            onMouseLeave={() => rocketRef.current?.stopAnimation()}
            className="w-full p-4 px-6 rounded-xl shadow-xs hover:bg-[#003A8C] transition-colors cursor-pointer text-left bg-[#0047AB] border border-[#003A8C] text-white"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <RocketIcon ref={rocketRef} size={20} color="#ffffff" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-bold text-white tracking-tight leading-none flex items-center gap-2 flex-wrap">
                    <span>{isSubmitting ? 'Deploying Escrow Contract...' : 'Deploy Job Escrow Contract'}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider font-mono bg-white/25 text-white border border-white/30">
                      Ready to Deploy
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-100 font-medium mt-1 font-sans">
                    Escrow protected on-chain • Transparent 2.5% protocol fee
                  </div>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center shadow-xs">
                  <ArrowRight size={14} className="stroke-[2.5]" />
                </div>
              </div>
            </div>
          </button>
        ) : (
          <button
            type="submit"
            disabled={true}
            className="w-full p-4 px-6 rounded-xl bg-slate-100 text-slate-400 border border-[#E2E6EC] cursor-not-allowed text-left transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-700 tracking-tight leading-none flex items-center gap-2 flex-wrap">
                    <span>Complete Job Details to Post Escrow</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider font-mono bg-slate-200 text-slate-600 border border-slate-300">
                      Details Required
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1 font-sans">
                    Please enter a Job Title, Category, and Scope Description to continue
                  </div>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 text-slate-400 flex items-center justify-center shrink-0">
                  <ArrowRight size={14} className="stroke-[2]" />
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Security / Features Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-6 border-t border-[#E2E6EC]">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-[#E2E6EC] shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E6EC] flex items-center justify-center text-[#0047AB] shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B0B0C]">Secure & On-Chain</div>
              <div className="text-[10px] text-slate-500 font-medium">Immutable & Trustless</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-[#E2E6EC] shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E6EC] flex items-center justify-center text-emerald-600 shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B0B0C]">Automated Escrow</div>
              <div className="text-[10px] text-slate-500 font-medium">Funds locked until complete</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-[#E2E6EC] shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E6EC] flex items-center justify-center text-[#0047AB] shrink-0">
              <Zap size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B0B0C]">Smart Contracts</div>
              <div className="text-[10px] text-slate-500 font-medium">Transparent & Verifiable</div>
            </div>
          </div>
        </div>
        </form>
        </div>

        {/* Live Escrow Contract Summary Sidebar Rail */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white rounded-2xl shadow-xs border border-[#E2E6EC] p-6 space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-[#E2E6EC] pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4B5563]">
                Escrow Live Summary
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E7EEF9] text-[#0047AB] font-bold">
                {selectedToken} Escrow
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-[#8892A0] uppercase font-mono block">Estimated Budget</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#0B0B0C]">
                    {tokenAmount || '0'} {selectedToken}
                  </span>
                  <span className="text-xs font-mono text-[#8892A0]">
                    ≈ {selectedFiat} {fiatInputVal}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#F4F6F9] rounded-xl border border-[#E2E6EC] space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-[#4B5563]">
                  <span>2.5% Platform Fee:</span>
                  <span className="font-semibold text-[#0B0B0C]">
                    {(parseFloat(tokenAmount || '0') * 0.025).toFixed(4)} {selectedToken}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#4B5563]">
                  <span>Freelancer Net:</span>
                  <span className="font-semibold text-[#1E8449]">
                    {(parseFloat(tokenAmount || '0') * 0.975).toFixed(4)} {selectedToken}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#4B5563] pt-1 border-t border-[#E2E6EC]">
                  <span>Review SLA Window:</span>
                  <span className="font-semibold text-[#0B0B0C]">
                    {reviewPeriodDays} Days
                  </span>
                </div>
              </div>
            </div>

            {/* Smart Contract Guarantee Checklist */}
            <div className="space-y-2.5 pt-2 border-t border-[#E2E6EC] text-xs">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8892A0] block">
                Escrow Guarantees
              </span>
              <div className="flex items-start gap-2 text-[#4B5563]">
                <ShieldCheck size={15} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>Non-custodial smart contract locked on Polygon</span>
              </div>
              <div className="flex items-start gap-2 text-[#4B5563]">
                <Lock size={15} className="text-[#1E8449] shrink-0 mt-0.5" />
                <span>Funds released milestone-by-milestone upon inspection</span>
              </div>
              <div className="flex items-start gap-2 text-[#4B5563]">
                <Scale size={15} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>Decentralized DAO Judge panel arbitration</span>
              </div>
              <div className="flex items-start gap-2 text-[#4B5563]">
                <Award size={15} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>Soulbound (ERC-5192) reputation token minted upon release</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Modern Dialog Modal */}
      <PolyLanceAlertModal
        isOpen={Boolean(alertModalOptions)}
        options={alertModalOptions}
        onClose={() => setAlertModalOptions(null)}
      />
    </div>
  );
};
