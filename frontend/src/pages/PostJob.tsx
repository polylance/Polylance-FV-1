import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { SkillCategory } from '../types';
import { SuccessState } from '../components/UIStates';
import { PolyLanceAlertModal, AlertModalOptions } from '../components/PolyLanceAlertModal';
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
  AlertTriangle
} from 'lucide-react';
import { RocketIcon, RocketIconHandle } from '../components/RocketIcon';
import { generateIpfsCid } from '../utils/ipfs';
import { SUPPORTED_FIAT, SUPPORTED_CRYPTO, getActiveRates, useLiveCurrencyRates, fetchLiveExchangeRates } from '../utils/currency';
import { FormattedJobDescription } from '../components/FormattedJobDescription';

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

  // Advanced Multi-Currency & Interactive 3D Conversion State (Default: POL on Polygon Amoy)
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'USDT' | 'BTC' | 'ETH' | 'POL'>('POL');
  const [tokenAmount, setTokenAmount] = useState('0.05');
  const [selectedFiat, setSelectedFiat] = useState('INR');
  const [activeTab, setActiveTab] = useState<'crypto' | 'fiat'>('crypto');
  const [fiatInputVal, setFiatInputVal] = useState('208750');

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
      setTokenAmount(cryptoVal.toFixed(selectedToken === 'BTC' || selectedToken === 'ETH' ? 4 : 2));
    }
  }, [fiatInputVal, selectedToken, selectedFiat, activeTab, tokenPriceUsd, fiatRateVsUsd]);

  const handleSelectToken = (tokenId: 'USDC' | 'USDT' | 'BTC' | 'ETH' | 'POL') => {
    if (tokenId === selectedToken) return;
    setSelectedToken(tokenId);
    if (tokenId === 'POL' || tokenId === 'ETH') {
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
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs">
          <Briefcase size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading">
            Job Posting is for Clients & Admins
          </h2>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Your connected wallet is active in <span className="font-bold text-purple-700 uppercase font-mono">Freelancer Mode</span>. Freelancers can apply to active smart contract escrow jobs, submit deliverables, and earn soulbound reputation tokens.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/jobs')}
            className="gradient-btn-primary px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Search size={15} />
            Browse Open Jobs
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="glass-panel px-5 py-2.5 rounded-xl font-bold text-xs text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 bg-[#EEF2F6] text-slate-800 space-y-8">
      {/* Neomorphic Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 font-heading tracking-tight leading-tight">
          Post an <span className="text-indigo-600">On-Chain</span> Escrow Job
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Create milestone-protected jobs with automated escrow and sovereign oracle pricing.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EEF2F6] shadow-[4px_4px_10px_#cad4e2,-4px_-4px_10px_#ffffff] border border-white/80 text-slate-700 text-[11px] sm:text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
          <span><strong>2.5% Site Maintenance Fee:</strong> Transparent on-chain escrow protection routed to protocol treasury.</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#EEF2F6] rounded-[2.5rem] shadow-[14px_14px_30px_#cad4e2,-14px_-14px_30px_#ffffff] border border-white/70 p-6 sm:p-10 max-w-3xl mx-auto space-y-8 relative overflow-hidden">
        {/* Job Title Row */}
        <div className="flex gap-4 items-start">
          <div className="w-11 h-11 rounded-2xl bg-[#EEF2F6] shadow-[4px_4px_8px_#cad4e2,-4px_-4px_8px_#ffffff] flex items-center justify-center text-indigo-600 shrink-0 mt-1 border border-white/60">
            <Briefcase size={20} />
          </div>
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-bold text-slate-800 font-heading">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Full-Stack Web3 Application with Smart Contract Integration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#EEF2F6] shadow-[inset_3px_3px_6px_#cad4e2,inset_-3px_-3px_6px_#ffffff] border border-slate-200/60 rounded-2xl text-slate-900 text-sm font-medium focus:shadow-[inset_2px_2px_4px_#cad4e2,inset_-2px_-2px_4px_#ffffff,0_0_0_2px_rgba(99,102,241,0.4)] outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Skill Category Selector */}
        <div className="flex gap-4 items-start">
          <div className="w-11 h-11 rounded-2xl bg-[#EEF2F6] shadow-[4px_4px_8px_#cad4e2,-4px_-4px_8px_#ffffff] flex items-center justify-center text-indigo-600 shrink-0 mt-1 border border-white/60">
            <Star size={20} />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-bold text-slate-800 font-heading">
                Primary Skill Category <span className="text-red-500">*</span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { 
                  id: 'web3', 
                  label: 'Web3 / Solidity', 
                  desc: 'Solidity, Smart Contracts, DeFi',
                  icon: <Layers size={18} />,
                  iconColor: 'text-indigo-600'
                },
                { 
                  id: 'frontend', 
                  label: 'Frontend UI', 
                  desc: 'TypeScript, React, Next.js, CSS',
                  icon: <Code2 size={18} />,
                  iconColor: 'text-blue-600'
                },
                { 
                  id: 'backend', 
                  label: 'Backend Systems', 
                  desc: 'Rust, Go, Python, APIs',
                  icon: <Database size={18} />,
                  iconColor: 'text-emerald-600'
                },
                { 
                  id: 'mobile', 
                  label: 'Mobile Apps', 
                  desc: 'Flutter, React Native, Swift',
                  icon: <Smartphone size={18} />,
                  iconColor: 'text-amber-600'
                },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as SkillCategory)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    category === cat.id
                      ? 'bg-[#E5ECF4] shadow-[inset_3px_3px_6px_#cad4e2,inset_-3px_-3px_6px_#ffffff] border-indigo-300 ring-1 ring-indigo-200'
                      : 'bg-[#EEF2F6] shadow-[4px_4px_10px_#cad4e2,-4px_-4px_10px_#ffffff] border-white/80 hover:shadow-[2px_2px_6px_#cad4e2,-2px_-2px_6px_#ffffff]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    category === cat.id 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-[#EEF2F6] shadow-[2px_2px_5px_#cad4e2,-2px_-2px_5px_#ffffff] text-slate-700'
                  }`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800">{cat.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{cat.desc}</div>
                  </div>
                  <div className="shrink-0 ml-auto">
                    {category === cat.id ? (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 size={14} className="stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300 bg-[#EEF2F6] shadow-[inset_1px_1px_2px_#cad4e2]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Token & Currency Escrow Settings */}
        <div className="border-t border-slate-200/60 pt-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EEF2F6] shadow-[4px_4px_8px_#cad4e2,-4px_-4px_8px_#ffffff] text-emerald-600 flex items-center justify-center border border-white/60">
              <Coins size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-heading">Escrow Budget & Currency Configuration</h3>
              <p className="text-[10px] text-slate-500 font-mono">Live pricing and secure escrow deposits in standard stablecoins or native crypto</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Selection Column: Token & Rates Selector */}
            <div className="md:col-span-7 space-y-6">
              {/* 1. Token Payment Options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 font-heading">
                  Select Payment Currency
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {SUPPORTED_CRYPTO.map((token) => (
                    <button
                      key={token.id}
                      type="button"
                      onClick={() => handleSelectToken(token.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200 relative overflow-hidden cursor-pointer ${
                        selectedToken === token.id
                          ? 'bg-[#E5ECF4] shadow-[inset_3px_3px_6px_#cad4e2,inset_-3px_-3px_6px_#ffffff] border-indigo-400 text-indigo-900 font-extrabold'
                          : 'bg-[#EEF2F6] shadow-[4px_4px_10px_#cad4e2,-4px_-4px_10px_#ffffff] border-white/80 text-slate-700 hover:text-slate-900 hover:shadow-[2px_2px_5px_#cad4e2,-2px_-2px_5px_#ffffff]'
                      }`}
                    >
                      <span className="text-xs font-mono">{token.symbol}</span>
                      <span className="text-[8px] font-medium text-slate-500 mt-1">${token.priceUsd}</span>
                      {selectedToken === token.id && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Country Fiat Currency Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 font-heading">
                  Local Currency Reference
                </label>
                <div className="relative">
                  <select
                    value={selectedFiat}
                    onChange={(e) => setSelectedFiat(e.target.value)}
                    className="w-full bg-[#EEF2F6] shadow-[inset_2px_2px_5px_#cad4e2,inset_-2px_-2px_5px_#ffffff] border border-slate-200/60 rounded-2xl px-4 py-3 text-slate-800 font-medium text-xs focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer outline-none"
                  >
                    {SUPPORTED_FIAT.map((fiat) => (
                      <option key={fiat.code} value={fiat.code}>
                        {fiat.flag} {fiat.name} ({fiat.symbol} - {fiat.code})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 font-bold text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* 3. Two-way Input Tab & Field */}
              <div className="space-y-2">
                <div className="flex border-b border-slate-200/70 pb-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('crypto')}
                    className={`pb-1.5 px-3 text-xs font-bold font-heading rounded-lg transition-all cursor-pointer ${
                      activeTab === 'crypto'
                        ? 'bg-[#E5ECF4] text-indigo-700 shadow-[inset_2px_2px_4px_#cad4e2,inset_-2px_-2px_4px_#ffffff]'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Amount in {selectedToken}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('fiat')}
                    className={`pb-1.5 px-3 text-xs font-bold font-heading rounded-lg transition-all cursor-pointer ${
                      activeTab === 'fiat'
                        ? 'bg-[#E5ECF4] text-indigo-700 shadow-[inset_2px_2px_4px_#cad4e2,inset_-2px_-2px_4px_#ffffff]'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Amount in {selectedFiat}
                  </button>
                </div>

                {activeTab === 'crypto' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-[#EEF2F6] shadow-[inset_3px_3px_6px_#cad4e2,inset_-3px_-3px_6px_#ffffff] border border-slate-200/60 rounded-2xl px-4 py-3">
                      <input
                        type="number"
                        inputMode="decimal"
                        required
                        min="0"
                        step="any"
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(e.target.value)}
                        className="w-full bg-transparent border-none text-slate-900 font-mono font-bold outline-none text-sm focus:ring-0"
                      />
                      <span className="px-3 py-1 bg-[#EEF2F6] shadow-[2px_2px_5px_#cad4e2,-2px_-2px_5px_#ffffff] text-indigo-700 rounded-lg text-xs font-extrabold font-mono border border-white/80">
                        {selectedToken}
                      </span>
                    </div>

                    {/* Quick Preset Amount Buttons & Live Wallet Balance */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-400 font-medium">Presets:</span>
                        {(selectedToken === 'POL' || selectedToken === 'ETH') ? (
                          ['0.02', '0.05', '0.1', '0.25', '0.5'].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setTokenAmount(amt)}
                              className={`px-2 py-0.5 rounded-md font-mono font-bold transition-all cursor-pointer ${
                                tokenAmount === amt
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-[#EEF2F6] shadow-[2px_2px_4px_#cad4e2,-2px_-2px_4px_#ffffff] text-slate-700 hover:text-indigo-700 border border-white/80'
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
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-[#EEF2F6] shadow-[2px_2px_4px_#cad4e2,-2px_-2px_4px_#ffffff] text-slate-700 hover:text-indigo-700 border border-white/80'
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
                          <span className="font-bold text-slate-900">
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
                  <div className="flex items-center gap-3 bg-[#EEF2F6] shadow-[inset_3px_3px_6px_#cad4e2,inset_-3px_-3px_6px_#ffffff] border border-slate-200/60 rounded-2xl px-4 py-3">
                    <input
                      type="number"
                      inputMode="decimal"
                      required
                      min="0"
                      step="any"
                      value={fiatInputVal}
                      onChange={(e) => setFiatInputVal(e.target.value)}
                      className="w-full bg-transparent border-none text-slate-900 font-mono font-bold outline-none text-sm focus:ring-0"
                    />
                    <span className="px-3 py-1 bg-[#EEF2F6] shadow-[2px_2px_5px_#cad4e2,-2px_-2px_5px_#ffffff] text-slate-700 rounded-lg text-xs font-extrabold font-mono border border-white/80">
                      {selectedFiat}
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Review Window Setting (Days) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 font-heading flex items-center gap-1.5">
                    <Clock size={13} className="text-indigo-600" />
                    Review Window (Days) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-sans">
                    Auto-release in <span className="font-bold text-indigo-600">{reviewPeriodDays || 7}</span> days
                  </span>
                </div>
                
                <div className="flex items-center gap-3 bg-[#EEF2F6] shadow-[inset_3px_3px_6px_#cad4e2,inset_-3px_-3px_6px_#ffffff] border border-slate-200/60 rounded-2xl px-4 py-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#EEF2F6] shadow-[2px_2px_4px_#cad4e2,-2px_-2px_4px_#ffffff] text-indigo-600 flex items-center justify-center shrink-0 border border-white/80">
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
                    className="w-full bg-transparent border-none text-slate-900 font-mono font-bold outline-none text-sm focus:ring-0"
                  />
                  <span className="px-2.5 py-0.5 bg-[#EEF2F6] shadow-[2px_2px_4px_#cad4e2,-2px_-2px_4px_#ffffff] text-slate-700 rounded-md text-xs font-bold font-mono shrink-0 border border-white/80">
                    Days
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Neomorphic Escrow Breakdown Card */}
            <div className="md:col-span-5 flex items-center justify-center">
              <div 
                className="w-full p-5 rounded-3xl bg-[#EEF2F6] text-slate-900 relative overflow-hidden shadow-[8px_8px_20px_#cad4e2,-8px_-8px_20px_#ffffff] border border-white/90 select-none font-sans"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-[#EEF2F6] shadow-[2px_2px_4px_#cad4e2,-2px_-2px_4px_#ffffff] border border-white/80 flex items-center justify-center text-indigo-600 shrink-0">
                      <ShieldCheck size={13} className="stroke-[2.2]" />
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Live Oracle Synced
                      </span>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 bg-[#EEF2F6] shadow-[2px_2px_4px_#cad4e2,-2px_-2px_4px_#ffffff] border border-white/80 rounded-lg text-[9px] font-extrabold text-indigo-700 flex items-center gap-1 shrink-0">
                    <CreditCard size={11} className="text-indigo-600" />
                    <span>{selectedToken} Escrow</span>
                  </div>
                </div>

                {/* Crypto Escrow Amount */}
                <div className="my-3">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    ESCROW PRINCIPAL BUDGET
                  </span>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-baseline flex-wrap gap-1.5 min-w-0">
                      <span className="text-2xl font-black tracking-tight text-slate-900 font-mono">
                        {parseFloat(tokenAmount || '0').toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </span>
                      <span className="text-lg font-black text-indigo-600 font-mono">
                        {selectedToken}
                      </span>
                    </div>
                    
                    {/* Dynamic Token Circular Icon */}
                    {selectedToken === 'USDC' && (
                      <div className="w-9 h-9 rounded-full bg-[#EEF2F6] shadow-[3px_3px_6px_#cad4e2,-3px_-3px_6px_#ffffff] border border-white/80 flex items-center justify-center p-0.5 shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[#2775CA] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          <DollarSign size={14} className="stroke-[3]" />
                        </div>
                      </div>
                    )}
                    {selectedToken === 'USDT' && (
                      <div className="w-9 h-9 rounded-full bg-[#EEF2F6] shadow-[3px_3px_6px_#cad4e2,-3px_-3px_6px_#ffffff] border border-white/80 flex items-center justify-center p-0.5 shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[#26A17B] text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                          ₮
                        </div>
                      </div>
                    )}
                    {selectedToken === 'ETH' && (
                      <div className="w-9 h-9 rounded-full bg-[#EEF2F6] shadow-[3px_3px_6px_#cad4e2,-3px_-3px_6px_#ffffff] border border-white/80 flex items-center justify-center p-0.5 shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[#627EEA] text-white flex items-center justify-center font-extrabold text-sm shadow-xs font-mono">
                          Ξ
                        </div>
                      </div>
                    )}
                    {selectedToken === 'BTC' && (
                      <div className="w-9 h-9 rounded-full bg-[#EEF2F6] shadow-[3px_3px_6px_#cad4e2,-3px_-3px_6px_#ffffff] border border-white/80 flex items-center justify-center p-0.5 shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[#F7931A] text-white flex items-center justify-center font-extrabold text-xs shadow-xs font-mono">
                          ₿
                        </div>
                      </div>
                    )}
                    {selectedToken === 'POL' && (
                      <div className="w-9 h-9 rounded-full bg-[#EEF2F6] shadow-[3px_3px_6px_#cad4e2,-3px_-3px_6px_#ffffff] border border-white/80 flex items-center justify-center p-0.5 shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[#8247E5] text-white flex items-center justify-center font-extrabold text-xs shadow-xs font-mono">
                          ⬡
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Simplified 2.5% Site Maintenance Fee Card */}
                {(() => {
                  const numAmount = parseFloat(tokenAmount || '0') || 0;
                  const grossUsd = numAmount * (tokenPriceUsd || 1);
                  
                  const clientFeeToken = numAmount * 0.025;
                  const clientFeeUsd = grossUsd * 0.025;
                  const totalClientToken = numAmount + clientFeeToken;
                  const totalClientUsd = grossUsd + clientFeeUsd;

                  const isStable = selectedToken === 'USDC' || selectedToken === 'USDT';
                  const dec = selectedToken === 'BTC' || selectedToken === 'ETH' ? 4 : 2;

                  return (
                    <div className="my-2 p-3.5 bg-[#E8EEF5] shadow-[inset_2px_2px_5px_#cad4e2,inset_-2px_-2px_5px_#ffffff] rounded-2xl space-y-2 font-mono text-[10.5px]">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Escrow Principal:</span>
                        <span className="font-bold text-slate-900">
                          {isStable
                            ? `$${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${selectedToken}`
                            : `${numAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${selectedToken} (~$${grossUsd.toFixed(2)})`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-indigo-700">
                        <span>Site Maintenance Fee (2.5%):</span>
                        <span className="font-bold">
                          {isStable
                            ? `+$${clientFeeToken.toFixed(2)} ${selectedToken}`
                            : `+${clientFeeToken.toFixed(dec)} ${selectedToken} (+$${clientFeeUsd.toFixed(2)})`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-300/70 text-slate-900 font-bold">
                        <span>Total Deposit to Escrow:</span>
                        <span className="text-indigo-900 font-extrabold text-xs">
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
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    LOCAL CURRENCY CONVERSION
                  </span>
                  
                  <div className="flex items-baseline flex-wrap gap-1">
                    <span className="text-xl font-black tracking-tight text-slate-800 font-mono">
                      {SUPPORTED_FIAT.find(f => f.code === selectedFiat)?.symbol}
                      {parseFloat(fiatInputVal || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-extrabold text-slate-600 font-mono">
                      {selectedFiat}
                    </span>
                  </div>
                </div>

                {/* Live Rate Box */}
                <div className="p-2.5 bg-[#EEF2F6] shadow-[inset_2px_2px_4px_#cad4e2,inset_-2px_-2px_4px_#ffffff] rounded-xl flex items-center justify-between gap-1.5 my-2">
                  <div className="min-w-0">
                    <span className="text-[7.5px] font-bold text-indigo-600 uppercase tracking-normal block font-mono leading-none mb-0.5">
                      LIVE EXCHANGE RATE
                    </span>
                    <span className="text-[9.5px] font-extrabold text-slate-800 font-mono block leading-none whitespace-nowrap">
                      1 {selectedToken} = {SUPPORTED_FIAT.find(f => f.code === selectedFiat)?.symbol}{(tokenPriceUsd * fiatRateVsUsd).toFixed(2)} {selectedFiat}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchLiveExchangeRates()}
                    title="Refresh live exchange rates"
                    className="w-5 h-5 rounded-full bg-[#EEF2F6] text-indigo-600 shadow-[2px_2px_4px_#cad4e2,-2px_-2px_4px_#ffffff] flex items-center justify-center hover:shadow-[1px_1px_2px_#cad4e2] transition-all shrink-0 cursor-pointer"
                  >
                    <RefreshCw size={9} className="text-indigo-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Spec Description */}
        <div className="flex gap-4 items-start">
          <div className="w-11 h-11 rounded-2xl bg-[#EEF2F6] shadow-[4px_4px_8px_#cad4e2,-4px_-4px_8px_#ffffff] flex items-center justify-center text-indigo-600 shrink-0 mt-1 border border-white/60">
            <FileText size={20} />
          </div>
          <div className="flex-1 space-y-2 relative">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-bold text-slate-800 font-heading">
                Detailed Job Specification <span className="text-red-500">*</span>
              </label>

              {/* Formatting & Preview Helper Bar */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDescription(prev => prev + (prev.endsWith('\n') ? '' : '\n') + '**Key Requirement:** ')}
                  className="px-2.5 py-1 rounded-xl bg-[#EEF2F6] shadow-[2px_2px_5px_#cad4e2,-2px_-2px_5px_#ffffff] text-slate-700 text-[11px] font-bold border border-white/80 flex items-center gap-1 transition-all cursor-pointer hover:shadow-[1px_1px_3px_#cad4e2]"
                  title="Add Bold Highlight"
                >
                  <Bold size={11} /> <span>Bold</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDescription(prev => prev + (prev.endsWith('\n') ? '' : '\n') + '* ')}
                  className="px-2.5 py-1 rounded-xl bg-[#EEF2F6] shadow-[2px_2px_5px_#cad4e2,-2px_-2px_5px_#ffffff] text-slate-700 text-[11px] font-bold border border-white/80 flex items-center gap-1 transition-all cursor-pointer hover:shadow-[1px_1px_3px_#cad4e2]"
                  title="Add Bullet Item"
                >
                  <List size={11} /> <span>Bullet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDescription(prev => prev + (prev.endsWith('\n') ? '' : '\n') + '### Scope of Work:\n* ')}
                  className="px-2.5 py-1 rounded-xl bg-[#EEF2F6] shadow-[2px_2px_5px_#cad4e2,-2px_-2px_5px_#ffffff] text-slate-700 text-[11px] font-bold border border-white/80 flex items-center gap-1 transition-all cursor-pointer hover:shadow-[1px_1px_3px_#cad4e2]"
                  title="Add Section Heading"
                >
                  <span># Section</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDescPreview(!showDescPreview)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    showDescPreview
                      ? 'bg-[#E5ECF4] text-indigo-700 shadow-[inset_2px_2px_4px_#cad4e2,inset_-2px_-2px_4px_#ffffff] border border-indigo-200'
                      : 'bg-[#EEF2F6] text-slate-700 shadow-[2px_2px_5px_#cad4e2,-2px_-2px_5px_#ffffff] border border-white/80'
                  }`}
                >
                  <Eye size={12} />
                  <span>{showDescPreview ? 'Edit Spec' : 'Live Preview'}</span>
                </button>
              </div>
            </div>

            {showDescPreview ? (
              <div className="w-full p-5 bg-[#EEF2F6] shadow-[inset_3px_3px_6px_#cad4e2,inset_-3px_-3px_6px_#ffffff] border border-slate-200/60 rounded-2xl space-y-2 min-h-[140px]">
                <div className="flex items-center justify-between border-b border-slate-300/60 pb-1.5">
                  <span className="text-[10.5px] font-mono font-bold text-indigo-900 uppercase">
                    Formatted Preview
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200">
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
                  className="w-full px-4 py-3.5 pb-8 bg-[#EEF2F6] shadow-[inset_3px_3px_6px_#cad4e2,inset_-3px_-3px_6px_#ffffff] border border-slate-200/60 rounded-2xl text-slate-900 text-sm font-medium focus:shadow-[inset_2px_2px_4px_#cad4e2,inset_-2px_-2px_4px_#ffffff,0_0_0_2px_rgba(99,102,241,0.4)] outline-none resize-none transition-all placeholder:text-slate-400 leading-relaxed"
                />
                <span className="absolute bottom-3 right-4 text-[10px] text-slate-400 font-mono select-none">
                  {description.length} / 2000
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Standard, Understandable Action Button (No Green or Red!) */}
        {isConnected && isWrongNetwork ? (
          <button
            type="button"
            onClick={switchToTargetNetwork}
            className="w-full relative group p-4 px-6 rounded-2xl shadow-[6px_6px_16px_rgba(217,119,6,0.3),-4px_-4px_12px_#ffffff] hover:shadow-lg transition-all duration-300 cursor-pointer text-left overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 border border-amber-400/40 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <AlertTriangle size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-white font-heading tracking-tight leading-none flex items-center gap-2 flex-wrap">
                    <span>Switch Wallet to {targetChainName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider font-mono bg-white/25 text-white border border-white/30">
                      Network Notice
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-100 font-medium mt-1 font-sans">
                    Click here to switch your wallet network to {targetChainName} to deploy your escrow job.
                  </div>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
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
            className="w-full relative group p-4 px-6 rounded-2xl shadow-[6px_6px_18px_rgba(79,70,229,0.35),-4px_-4px_12px_#ffffff] hover:shadow-[4px_4px_14px_rgba(79,70,229,0.45),-2px_-2px_8px_#ffffff] transition-all duration-300 cursor-pointer text-left overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.25)] border border-indigo-400/30"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-300 backdrop-blur-xs">
                  <RocketIcon ref={rocketRef} size={20} color="#ffffff" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-extrabold text-white font-heading tracking-tight leading-none flex items-center gap-2 flex-wrap">
                    <span>{isSubmitting ? 'Deploying Escrow Contract...' : 'Deploy Job Escrow Contract'}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider font-mono bg-white/25 text-white border border-white/30">
                      Ready to Deploy
                    </span>
                  </div>
                  <div className="text-[11px] text-indigo-100 font-medium mt-1 font-sans">
                    Escrow protected on-chain • Transparent 2.5% site maintenance fee
                  </div>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-all duration-300 shrink-0">
                  <ArrowRight size={14} className="stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </button>
        ) : (
          <button
            type="submit"
            disabled={true}
            className="w-full relative p-4 px-6 rounded-2xl bg-[#E2E8F0] text-slate-500 border border-slate-300/40 shadow-[4px_4px_10px_#cad4e2,-4px_-4px_10px_#ffffff] cursor-not-allowed text-left transition-all duration-200"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-300/50 border border-slate-300/70 flex items-center justify-center text-slate-500 shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-700 font-heading tracking-tight leading-none flex items-center gap-2 flex-wrap">
                    <span>Complete Job Details to Post Escrow</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider font-mono bg-slate-300/60 text-slate-600 border border-slate-300/80">
                      Details Required
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1 font-sans">
                    Please enter a Job Title, Category, and Scope Description to continue
                  </div>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <div className="w-8 h-8 rounded-full bg-slate-300/50 border border-slate-300/70 text-slate-400 flex items-center justify-center shrink-0">
                  <ArrowRight size={14} className="stroke-[2]" />
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Security / Features Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-6 border-t border-slate-200/60">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#EEF2F6] shadow-[3px_3px_8px_#cad4e2,-3px_-3px_8px_#ffffff] border border-white/80">
            <div className="w-9 h-9 rounded-xl bg-[#EEF2F6] shadow-[2px_2px_4px_#cad4e2,-2px_-2px_4px_#ffffff] flex items-center justify-center text-indigo-600 shrink-0 border border-white/80">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Secure & On-Chain</div>
              <div className="text-[10px] text-slate-500 font-medium">Immutable & Trustless</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#EEF2F6] shadow-[3px_3px_8px_#cad4e2,-3px_-3px_8px_#ffffff] border border-white/80">
            <div className="w-9 h-9 rounded-xl bg-[#EEF2F6] shadow-[2px_2px_4px_#cad4e2,-2px_-2px_4px_#ffffff] flex items-center justify-center text-emerald-600 shrink-0 border border-white/80">
              <Lock size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Automated Escrow</div>
              <div className="text-[10px] text-slate-500 font-medium">Funds locked until complete</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#EEF2F6] shadow-[3px_3px_8px_#cad4e2,-3px_-3px_8px_#ffffff] border border-white/80">
            <div className="w-9 h-9 rounded-xl bg-[#EEF2F6] shadow-[2px_2px_4px_#cad4e2,-2px_-2px_4px_#ffffff] flex items-center justify-center text-blue-600 shrink-0 border border-white/80">
              <Zap size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Smart Contracts</div>
              <div className="text-[10px] text-slate-500 font-medium">Transparent & Verifiable</div>
            </div>
          </div>
        </div>
      </form>

      {/* Modern Dialog Modal */}
      <PolyLanceAlertModal
        isOpen={Boolean(alertModalOptions)}
        options={alertModalOptions}
        onClose={() => setAlertModalOptions(null)}
      />
    </div>
  );
};
