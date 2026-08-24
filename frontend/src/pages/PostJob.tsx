import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { SkillCategory } from '../types';
import { SuccessState } from '../components/UIStates';
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
  ArrowRight
} from 'lucide-react';
import { RocketIcon, RocketIconHandle } from '../components/RocketIcon';
import { generateIpfsCid } from '../utils/ipfs';
import { SUPPORTED_FIAT, SUPPORTED_CRYPTO, getActiveRates } from '../utils/currency';

export const PostJob: React.FC = () => {
  const { address, isConnected, connectWallet } = useWeb3();
  const { postJob } = usePolyLanceData();
  const navigate = useNavigate();
  const rocketRef = useRef<RocketIconHandle>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SkillCategory>('web3');
  const [reviewPeriodDays, setReviewPeriodDays] = useState<number | string>(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (createdJobId) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    }
  }, [createdJobId]);

  // Advanced Multi-Currency & Interactive 3D Conversion State
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'USDT' | 'BTC' | 'ETH' | 'POL'>('USDC');
  const [tokenAmount, setTokenAmount] = useState('2500');
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

  const rates = getActiveRates();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill in title and description.');
      return;
    }
    if (!isConnected) {
      await connectWallet();
    }

    const usdEquivalent = (parseFloat(tokenAmount) * tokenPriceUsd).toFixed(2);
    const parsedReviewPeriod = typeof reviewPeriodDays === 'number' ? reviewPeriodDays : (parseInt(reviewPeriodDays) || 7);

    setIsSubmitting(true);
    try {
      const newJob = await postJob(
        {
          title,
          description,
          category,
          amountUsdc: usdEquivalent,
          paymentTokenSymbol: selectedToken === 'POL' ? 'MATIC' : (selectedToken as any),
          reviewPeriodDays: parsedReviewPeriod,
        },
        address
      );
      setIsSubmitting(false);
      setCreatedJobId(newJob.id);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
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

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      {/* Redesigned Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading tracking-tight leading-tight">
          Post an <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">On-Chain</span> Escrow Job
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Deploys a standalone <span className="font-mono text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded animate-pulse">JobEscrow.sol</span> clone via JobFactory
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-100 shadow-xl p-8 sm:p-10 max-w-3xl mx-auto space-y-8 relative overflow-hidden">
        {/* Job Title Row */}
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 mt-1">
            <Briefcase size={20} />
          </div>
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-bold text-slate-800 font-heading">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Audit & Optimize ERC-721 Reputation Smart Contracts"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-slate-900 text-sm focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none font-sans font-medium transition-all duration-200 shadow-sm"
            />
          </div>
        </div>

        {/* Skill Category Selector */}
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-1">
            <Star size={20} className="fill-blue-600 text-white" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-bold text-slate-800 font-heading">
                Primary Skill Category <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium font-sans">
                ( Section 10 MVP Standard )
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { 
                  id: 'web3', 
                  label: 'Web3 / Solidity', 
                  desc: 'Solidity, Vyper, Cairo',
                  icon: <Layers size={18} />,
                  iconBg: 'bg-purple-100',
                  iconColor: 'text-purple-600'
                },
                { 
                  id: 'frontend', 
                  label: 'Frontend UI', 
                  desc: 'TypeScript, React, Vue, CSS',
                  icon: <Code2 size={18} />,
                  iconBg: 'bg-cyan-100',
                  iconColor: 'text-cyan-600'
                },
                { 
                  id: 'backend', 
                  label: 'Backend Systems', 
                  desc: 'Rust, Go, Python, Java',
                  icon: <Database size={18} />,
                  iconBg: 'bg-emerald-100',
                  iconColor: 'text-emerald-600'
                },
                { 
                  id: 'mobile', 
                  label: 'Mobile Apps', 
                  desc: 'Swift, Kotlin, Dart',
                  icon: <Smartphone size={18} />,
                  iconBg: 'bg-amber-100',
                  iconColor: 'text-amber-600'
                },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as SkillCategory)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    category === cat.id
                      ? 'bg-purple-50/50 border-purple-400 shadow-md ring-2 ring-purple-100'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.iconBg} ${cat.iconColor}`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800">{cat.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{cat.desc}</div>
                  </div>
                  <div className="shrink-0 ml-auto">
                    {category === cat.id ? (
                      <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                        <CheckCircle2 size={14} className="stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-200" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Token & Currency Escrow Settings */}
        <div className="border-t border-slate-100 pt-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-heading">Escrow Budget & Currency Configuration</h3>
              <p className="text-[10px] text-slate-500 font-mono">Convert live pricing and secure payments in standard stablecoins or native crypto</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Selection Column: Token & Rates Selector */}
            <div className="md:col-span-7 space-y-6">
              {/* 1. Token Payment Options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 font-heading">
                  Select Secure Cryptocurrency Payment Option
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {SUPPORTED_CRYPTO.map((token) => (
                    <button
                      key={token.id}
                      type="button"
                      onClick={() => setSelectedToken(token.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-300 relative overflow-hidden cursor-pointer ${
                        selectedToken === token.id
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-extrabold font-mono">{token.symbol}</span>
                      <span className="text-[8px] font-medium text-slate-400 mt-1">${token.priceUsd}</span>
                      {selectedToken === token.id && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Country Fiat Currency Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 font-heading">
                  Local Country / Currency Conversion
                </label>
                <div className="relative">
                  <select
                    value={selectedFiat}
                    onChange={(e) => setSelectedFiat(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-medium text-xs focus:ring-purple-500 focus:border-purple-500 appearance-none shadow-sm cursor-pointer"
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
                <div className="flex border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab('crypto')}
                    className={`pb-2 px-4 text-xs font-bold font-heading border-b-2 transition-all cursor-pointer ${
                      activeTab === 'crypto'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Enter Amount in {selectedToken}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('fiat')}
                    className={`pb-2 px-4 text-xs font-bold font-heading border-b-2 transition-all cursor-pointer ${
                      activeTab === 'fiat'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Enter Amount in {selectedFiat}
                  </button>
                </div>

                {activeTab === 'crypto' ? (
                  <div className="flex items-center gap-3 border border-slate-200/80 rounded-2xl px-4 py-3 bg-white focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-50/50 transition-all duration-200 shadow-sm">
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      className="w-full bg-transparent border-none text-slate-900 font-mono font-bold outline-none text-sm focus:ring-0"
                    />
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-extrabold font-mono">
                      {selectedToken}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 border border-slate-200/80 rounded-2xl px-4 py-3 bg-white focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-50/50 transition-all duration-200 shadow-sm">
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={fiatInputVal}
                      onChange={(e) => setFiatInputVal(e.target.value)}
                      className="w-full bg-transparent border-none text-slate-900 font-mono font-bold outline-none text-sm focus:ring-0"
                    />
                    <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-extrabold font-mono">
                      {selectedFiat}
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Review Window Setting (Days) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 font-heading flex items-center gap-1.5">
                    <Clock size={13} className="text-purple-600" />
                    Review Window (Days) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-sans">
                    Auto-release in <span className="font-bold text-blue-600">{reviewPeriodDays || 7}</span> days
                  </span>
                </div>
                
                <div className="flex items-center gap-3 border border-slate-200/80 rounded-2xl px-4 py-2.5 bg-white focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-50/50 transition-all duration-200 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Clock size={13} className="stroke-[2.5]" />
                  </div>
                  <input
                    type="number"
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
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold font-mono shrink-0">
                    Days
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Attestation Card */}
            <div className="md:col-span-5 flex items-center justify-center">
              <div 
                className="w-full p-4 sm:p-5 rounded-2xl bg-white text-slate-900 relative overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg shadow-sm shadow-slate-200/50 border border-slate-200/80 select-none font-sans"
              >
                {/* Glow Overlay */}
                <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-50/40 rounded-full blur-2xl pointer-events-none" />
                
                {/* Card Header */}
                <div className="flex justify-between items-center mb-3 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
                      <ShieldCheck size={16} className="stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block leading-tight">
                        SOVEREIGN PRICE ATTESTATION
                      </span>
                      <div className="text-[10.5px] font-black text-slate-900 flex items-center gap-1.5 mt-0.5 leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0" />
                        <span>LIVE ORACLE SYNCED</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-white border border-indigo-200/80 rounded-xl text-[10px] font-extrabold text-indigo-700 shadow-xs flex items-center gap-1 shrink-0">
                    <CreditCard size={12} className="text-indigo-600" />
                    <span>{selectedToken} Card</span>
                  </div>
                </div>

                {/* Crypto Escrow Locked */}
                <div className="my-3">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    CRYPTO ESCROW LOCKED
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
                      <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center p-0.5 shadow-xs shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[#2775CA] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          <DollarSign size={14} className="stroke-[3]" />
                        </div>
                      </div>
                    )}
                    {selectedToken === 'USDT' && (
                      <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center p-0.5 shadow-xs shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[#26A17B] text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                          ₮
                        </div>
                      </div>
                    )}
                    {selectedToken === 'ETH' && (
                      <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center p-0.5 shadow-xs shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[#627EEA] text-white flex items-center justify-center font-extrabold text-sm shadow-xs font-mono">
                          Ξ
                        </div>
                      </div>
                    )}
                    {selectedToken === 'BTC' && (
                      <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center p-0.5 shadow-xs shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[#F7931A] text-white flex items-center justify-center font-extrabold text-xs shadow-xs font-mono">
                          ₿
                        </div>
                      </div>
                    )}
                    {selectedToken === 'POL' && (
                      <div className="w-9 h-9 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center p-0.5 shadow-xs shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[#8247E5] text-white flex items-center justify-center font-extrabold text-xs shadow-xs font-mono">
                          ⬡
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50/80 border border-indigo-100/80 rounded-lg text-[10px] font-semibold text-indigo-900">
                    <Lock size={10} className="text-indigo-600 shrink-0" />
                    <span>Funds locked in smart escrow</span>
                  </div>
                </div>

                {/* Protocol Commission & Net Payout Breakdown */}
                {(() => {
                  const grossUsdc = (parseFloat(tokenAmount || '0') || 0) * (tokenPriceUsd || 1);
                  const commUsdc = grossUsdc * 0.025;
                  const netUsdc = grossUsdc - commUsdc;
                  return (
                    <div className="my-2 p-2 bg-purple-50/80 border border-purple-200/80 rounded-xl space-y-1 font-mono text-[9.5px]">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Escrow Total:</span>
                        <span className="font-bold text-slate-900">${grossUsdc.toFixed(2)} USDC</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Protocol Fee (2.5%):</span>
                        <span className="font-bold text-rose-600">-${commUsdc.toFixed(2)} USDC</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-purple-200/80 text-purple-950 font-bold">
                        <span>Freelancer Net Payout:</span>
                        <span className="text-emerald-700 font-extrabold text-[10.5px]">${netUsdc.toFixed(2)} USDC</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Divider Line */}
                <div className="border-t border-slate-100 my-2.5" />

                {/* Freelancer Local Pay Equivalent */}
                <div className="my-3">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    FREELANCER LOCAL PAY EQUIVALENT
                  </span>
                  
                  <div className="flex items-baseline flex-wrap gap-1">
                    <span className="text-2xl font-black tracking-tight text-emerald-600 font-mono">
                      {SUPPORTED_FIAT.find(f => f.code === selectedFiat)?.symbol}
                      {parseFloat(fiatInputVal || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600 font-mono">
                      {selectedFiat}
                    </span>
                    <span className="text-[9px] text-slate-400 font-normal italic tracking-tight ml-1.5">
                      (Present spot value • Excludes fees)
                    </span>
                  </div>

                  {/* Auto-converted Pill Banner */}
                  <div className="p-1.5 px-2 bg-emerald-50/70 border border-emerald-100/80 rounded-lg flex items-center justify-between mt-1.5 gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check size={9} className="stroke-[3]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-slate-800 block leading-none whitespace-nowrap">
                          Auto-converted via Live Oracle
                        </span>
                        <span className="text-[7.5px] text-emerald-700 font-medium block leading-none mt-0.5 whitespace-nowrap">
                          Spot value • Excludes fees
                        </span>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 bg-emerald-100/80 text-emerald-800 text-[8.5px] font-extrabold rounded font-mono shrink-0">
                      {selectedFiat}
                    </span>
                  </div>
                </div>

                {/* Live Rate Box */}
                <div className="p-2 px-2.5 bg-slate-50/80 border border-dashed border-indigo-200/80 rounded-xl flex items-center justify-between gap-1.5 my-2">
                  <div className="min-w-0">
                    <span className="text-[7px] font-bold text-indigo-600 uppercase tracking-normal block font-mono flex items-center gap-1 leading-none mb-0.5">
                      <span className="w-1 h-1 rounded-full bg-indigo-600 inline-block shrink-0" />
                      LIVE RATE
                    </span>
                    <span className="text-[9px] sm:text-[9.5px] font-extrabold text-slate-900 font-mono block leading-none whitespace-nowrap">
                      1 {selectedToken} = {SUPPORTED_FIAT.find(f => f.code === selectedFiat)?.symbol}{(tokenPriceUsd * fiatRateVsUsd).toFixed(2)} {selectedFiat}
                    </span>
                  </div>

                  <div className="w-4.5 h-4.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/80 flex items-center justify-center hover:bg-indigo-100 transition-colors shadow-xs shrink-0">
                    <RefreshCw size={8} className="text-indigo-600" />
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[7px] font-bold text-indigo-600 uppercase tracking-normal block font-mono leading-none mb-0.5 text-right">
                      UPDATED
                    </span>
                    <div className="text-[8.5px] font-extrabold text-slate-800 flex items-center gap-1 justify-end font-mono leading-none">
                      <span>Just now</span>
                      <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Bottom Dark Navy Bar */}
                <div className="p-2 px-2.5 bg-[#0c1033] rounded-xl text-white flex items-center justify-between gap-1.5 shadow-xs shadow-indigo-950/20 mt-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                      <ShieldCheck size={12} />
                    </div>
                    <div>
                      <span className="text-[7px] text-indigo-300/80 font-medium block leading-none">Powered by</span>
                      <span className="text-[9.5px] font-bold text-white block leading-tight mt-0.5">PolyLance Oracle</span>
                    </div>
                  </div>

                  <div className="w-[1px] h-4.5 bg-indigo-800/50 shrink-0 mx-1" />

                  <div className="text-right shrink-0">
                    <span className="text-[7px] font-bold text-indigo-300/70 tracking-normal font-sans uppercase block leading-none mb-0.5">
                      TX CURRENCY
                    </span>
                    <span className="text-[9.5px] font-extrabold font-mono text-right block text-indigo-200 leading-none">
                      {selectedToken} <span className="text-indigo-400 font-normal mx-0.5">➔</span> <span className="text-emerald-400">{selectedFiat}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Spec Description */}
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 mt-1">
            <FileText size={20} />
          </div>
          <div className="flex-1 space-y-2 relative">
            <label className="block text-sm font-bold text-slate-800 font-heading">
              Detailed Job Specification (IPFS Pinning) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                required
                rows={5}
                maxLength={2000}
                placeholder="Describe deliverables, required test coverage, and acceptance criteria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3.5 pb-8 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-slate-900 text-sm focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none resize-none font-sans font-medium transition-all duration-200 shadow-sm"
              />
              <span className="absolute bottom-3 right-4 text-[10px] text-slate-400 font-mono select-none">
                {description.length} / 2000
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Validation Submit Button (Red when incomplete, Green when ready) */}
        <button
          type="submit"
          disabled={isSubmitting}
          onMouseEnter={() => rocketRef.current?.startAnimation()}
          onMouseLeave={() => rocketRef.current?.stopAnimation()}
          className={`w-full relative group p-3 px-5 rounded-2xl shadow-md transition-all duration-300 cursor-pointer text-left overflow-hidden ${
            isFormValid
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5'
              : 'bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/20 hover:shadow-lg hover:shadow-rose-600/30'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Left Rocket & Status */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8.5 h-8.5 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-300 backdrop-blur-xs">
                <RocketIcon ref={rocketRef} size={17} color="#ffffff" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-extrabold text-white font-heading tracking-tight leading-none flex items-center gap-2 flex-wrap">
                  <span>
                    {isSubmitting
                      ? 'Deploying Escrow Clone...'
                      : isFormValid
                      ? 'Deploy Job Escrow Clone'
                      : 'Fill Required Job Details'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider font-mono ${
                    isFormValid ? 'bg-white/25 text-white border border-white/30' : 'bg-white/20 text-white border border-white/30'
                  }`}>
                    {isFormValid ? 'Ready On-Chain' : 'Incomplete'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Arrow Circular Button */}
            <div className="flex items-center shrink-0">
              <div className="w-7.5 h-7.5 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-all duration-300 shrink-0">
                {isFormValid ? (
                  <ArrowRight size={13} className="stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                ) : (
                  <Check size={13} className="stroke-[2.5] opacity-70" />
                )}
              </div>
            </div>
          </div>
        </button>

        {/* Security / Features Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100/80">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Secure & On-Chain</div>
              <div className="text-[10px] text-slate-500 font-medium">Immutable & Trustless</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-2 border-t md:border-t-0 md:border-x border-slate-100/80 py-3 md:py-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Automated Escrow</div>
              <div className="text-[10px] text-slate-500 font-medium">Funds locked until complete</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Zap size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Powered by Smart Contracts</div>
              <div className="text-[10px] text-slate-500 font-medium">Transparent & Verifiable</div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
