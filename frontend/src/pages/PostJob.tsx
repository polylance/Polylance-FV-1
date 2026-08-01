import React, { useState } from 'react';
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
  Wallet
} from 'lucide-react';
import { generateIpfsCid } from '../utils/ipfs';

export const PostJob: React.FC = () => {
  const { address, isConnected, connectWallet } = useWeb3();
  const { postJob } = usePolyLanceData();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SkillCategory>('web3');
  const [amountUsdc, setAmountUsdc] = useState('2500');
  const [reviewPeriodDays, setReviewPeriodDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill in title and description.');
      return;
    }
    if (!isConnected) {
      await connectWallet();
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const descriptionCid = generateIpfsCid({ title, description, category, timestamp: Date.now() });
      const newJob = postJob(
        {
          title,
          description,
          category,
          amountUsdc,
          reviewPeriodDays,
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

        {/* Budget & Review Window with Flex Icon Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Escrow Budget Column */}
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 mt-1">
              <Wallet size={20} />
            </div>
            <div className="flex-1 space-y-2">
              <label className="block text-sm font-bold text-slate-800 font-heading">
                Escrow Budget (USDC) <span className="text-red-500">*</span>
              </label>
              
              <div className="flex items-center gap-3 border border-slate-200/80 rounded-2xl px-4 py-3 bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-50/50 transition-all duration-200 shadow-sm">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <DollarSign size={15} className="stroke-[2.5]" />
                </div>
                <input
                  type="number"
                  required
                  min="100"
                  step="50"
                  value={amountUsdc}
                  onChange={(e) => setAmountUsdc(e.target.value)}
                  className="w-full bg-transparent border-none text-slate-900 font-mono font-bold outline-none text-base focus:ring-0"
                />
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold font-mono">
                  USDC
                </span>
              </div>
            </div>
          </div>

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
