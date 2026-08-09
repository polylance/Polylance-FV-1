import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { SkillCategory } from '../types';
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
  Coins
} from 'lucide-react';
import { generateIpfsCid } from '../utils/ipfs';
import { SUPPORTED_FIAT, SUPPORTED_CRYPTO, convertCryptoToFiat, getActiveRates } from '../utils/currency';

export const PostJob: React.FC = () => {
  const { address, isConnected, connectWallet } = useWeb3();
  const { postJob } = usePolyLanceData();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SkillCategory>('web3');
  const [reviewPeriodDays, setReviewPeriodDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advanced Multi-Currency & Interactive 3D Conversion State
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'USDT' | 'BTC' | 'ETH' | 'POL'>('USDC');
  const [tokenAmount, setTokenAmount] = useState('2500');
  const [selectedFiat, setSelectedFiat] = useState('INR');
  const [activeTab, setActiveTab] = useState<'crypto' | 'fiat'>('crypto');
  const [fiatInputVal, setFiatInputVal] = useState('208750');

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

    setIsSubmitting(true);
    setTimeout(() => {
      const descriptionCid = generateIpfsCid({ title, description, category, timestamp: Date.now() });
      const newJob = postJob(
        {
          title,
          description,
          category,
          amountUsdc: usdEquivalent,
          reviewPeriodDays,
          paymentToken: selectedToken,
          tokenAmount: tokenAmount,
        },
        address
      );
      setIsSubmitting(false);
      navigate(`/jobs/${newJob.id}`);
    }, 600);
  };

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
                    <span className="px-3 py-1 bg-slate-50 text-slate-650 rounded-lg text-xs font-extrabold font-mono">
                      {selectedFiat}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: 3D interactive Attestation Card */}
            <div className="md:col-span-5 [perspective:1000px] flex items-center justify-center">
              <div 
                className="w-full p-6 rounded-3xl text-white relative overflow-hidden transition-all duration-500 ease-out transform hover:[transform:rotateY(8deg)_rotateX(8deg)_scale(1.02)] hover:shadow-2xl shadow-xl border border-white/20 select-none font-mono"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c026d3 100%)',
                  boxShadow: '0 20px 40px -15px rgba(124, 58, 237, 0.4)'
                }}
              >
                {/* Glow Overlay */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                
                {/* Card Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <span className="text-[7px] tracking-widest text-indigo-200 uppercase font-bold block">SOVEREIGN PRICE ATTESTATION</span>
                    <div className="text-[10px] font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>LIVE ORACLE SYNCED</span>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 bg-white/10 border border-white/20 rounded-md text-[8px] font-bold">
                    {selectedToken} Card
                  </div>
                </div>

                {/* Big Converted Values */}
                <div className="space-y-4 my-8">
                  <div>
                    <span className="text-[9px] text-indigo-100 block">Crypto Escrow Locked</span>
                    <span className="text-xl font-extrabold tracking-tight">
                      {parseFloat(tokenAmount || '0').toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedToken}
                    </span>
                  </div>
                  
                  <div className="border-t border-white/10 pt-4">
                    <span className="text-[9px] text-indigo-100 block">Freelancer Local Pay equivalent</span>
                    <span className="text-lg font-bold tracking-tight text-emerald-300">
                      {SUPPORTED_FIAT.find(f => f.code === selectedFiat)?.flag}{' '}
                      {SUPPORTED_FIAT.find(f => f.code === selectedFiat)?.symbol}
                      {parseFloat(fiatInputVal || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      {selectedFiat}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex justify-between items-center text-[7px] text-indigo-200 border-t border-white/10 pt-4">
                  <div>
                    <span>Live Rate: </span>
                    <span className="font-bold text-white block">1 {selectedToken} = {SUPPORTED_FIAT.find(f => f.code === selectedFiat)?.symbol}{(tokenPriceUsd * fiatRateVsUsd).toFixed(2)} {selectedFiat}</span>
                  </div>
                  <div className="text-right">
                    <span>Powered by</span>
                    <span className="block font-bold text-white">PolyLance Oracle</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Review Period Setting */}
        <div className="border-t border-slate-100 pt-8">

          {/* Review Window Column */}
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-1">
              <Clock size={20} />
            </div>
            <div className="flex-1 space-y-2">
              <label className="block text-sm font-bold text-slate-800 font-heading">
                Review Window (Days) <span className="text-red-500">*</span>
              </label>
              
              <div className="flex items-center gap-3 border border-slate-200/80 rounded-2xl px-4 py-3 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50/50 transition-all duration-200 shadow-sm">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock size={15} className="stroke-[2.5]" />
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max="30"
                  value={reviewPeriodDays}
                  onChange={(e) => setReviewPeriodDays(parseInt(e.target.value) || 7)}
                  className="w-full bg-transparent border-none text-slate-900 font-mono font-bold outline-none text-base focus:ring-0"
                />
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold font-mono">
                  Days
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-sans block mt-1 leading-normal">
                Auto-release triggers if client does not review in <span className="font-bold text-blue-600">{reviewPeriodDays}</span> days.
              </span>
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

        {/* Deploy Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 rounded-2xl font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Rocket size={18} className="transform -rotate-45" />
          {isSubmitting ? 'Deploying Clone Contract...' : 'Deploy Job Escrow Clone On-Chain'}
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
