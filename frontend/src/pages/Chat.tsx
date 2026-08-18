import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { PolyLanceLogo } from '../components/PolyLanceLogo';
import { 
  MessageSquare, Send, ShieldCheck, Award, Scale, Building2, Briefcase, 
  ExternalLink, Lock, PlusCircle, DollarSign, CheckCircle2, ArrowUpRight, 
  User, Clock, Search, Sparkles, AlertCircle, FileCheck, CheckCircle, Gavel, UserCheck,
  Paperclip, Smile, MoreVertical, Copy, Shield, Download, AlertTriangle, ChevronRight, X, Filter
} from 'lucide-react';
import { truncateAddress } from '../utils/formatters';
import { JudgeRecord, JudgeMessage } from '../types';
import confetti from 'canvas-confetti';
import { EmptyState } from '../components/UIStates';

export const Chat: React.FC = () => {
  const { jobId: urlJobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { address, currentRole, isConnected } = useWeb3();
  const { 
    jobs, profiles, judges, judgeMessages, sendChatMessage, sendJudgeChatMessage, proposeTerms, fundJob, 
    releasePayment, submitWork, requestModifications 
  } = usePolyLanceData();

  const isAdmin = currentRole === 'admin';
  const isJudgeRole = currentRole === 'judge';
  const [chatTab, setChatTab] = useState<'jobs' | 'judges'>(isAdmin && !urlJobId ? 'judges' : 'jobs');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(urlJobId || null);
  const [selectedJudgeAddr, setSelectedJudgeAddr] = useState<string | null>(
    judges.length > 0 ? judges[0].address : null
  );

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Interactive submission modal inside chat
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitDesc, setSubmitDesc] = useState('');
  const [submitLink, setSubmitLink] = useState('');
  const [showMobileChannels, setShowMobileChannels] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto select initial judge if admin
  useEffect(() => {
    if (isAdmin && !selectedJudgeAddr && judges.length > 0) {
      setSelectedJudgeAddr(judges[0].address);
    }
  }, [isAdmin, judges, selectedJudgeAddr]);

  // If URL contains a jobId, auto select it and switch tab to jobs
  useEffect(() => {
    if (urlJobId) {
      setSelectedJobId(urlJobId);
      setChatTab('jobs');
    }
  }, [urlJobId]);

  // Securely filter jobs for conversation sidebar
  const myChats = jobs.filter(j => {
    if (isAdmin) return true;
    const lowerAddr = (address || '').toLowerCase();
    const isClient = j.client.toLowerCase() === lowerAddr;
    const isFreelancer = j.freelancer?.toLowerCase() === lowerAddr;
    const isJudgeOnDispute = isJudgeRole && j.status === 'Disputed';

    return isClient || isFreelancer || isJudgeOnDispute;
  });

  // Default to the first conversation if none selected
  useEffect(() => {
    if (!selectedJobId && myChats.length > 0) {
      setSelectedJobId(myChats[0].id);
    }
  }, [myChats, selectedJobId]);

  const activeJob = jobs.find(j => j.id === selectedJobId);
  const activeJudge = judges.find(j => j.address.toLowerCase() === (selectedJudgeAddr || '').toLowerCase());

  // Inner-container scroll to bottom (prevents full window scroll to footer)
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeJob?.chatMessages, selectedJudgeAddr, judgeMessages, chatTab]);

  const handleCopyAddress = (addrToCopy: string) => {
    navigator.clipboard.writeText(addrToCopy);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 font-sans">
        <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 font-headline">Wallet Not Connected</h2>
        <p className="text-xs text-slate-500 font-mono">
          Please connect your wallet to access your end-to-end encrypted negotiation chats.
        </p>
      </div>
    );
  }

  // Handle message submission
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (chatTab === 'judges' && selectedJudgeAddr) {
      const senderRole = isAdmin ? 'Admin' : 'Judge';
      sendJudgeChatMessage(selectedJudgeAddr, inputText, senderRole, address);
      setInputText('');
    } else if (activeJob) {
      const isClient = activeJob.client.toLowerCase() === (address || '').toLowerCase();
      const isFreelancer = activeJob.freelancer?.toLowerCase() === (address || '').toLowerCase();
      
      let senderRole: 'Client' | 'Freelancer' | 'Judge' = 'Judge';
      if (isClient) {
        senderRole = 'Client';
      } else if (isFreelancer) {
        senderRole = 'Freelancer';
      } else if (isAdmin || isJudgeRole) {
        senderRole = 'Judge';
      }
      sendChatMessage(activeJob.id, inputText, senderRole);
      setInputText('');
    }
  };

  // Escrow direct actions
  const handleProposeTerms = () => {
    if (!activeJob) return;
    const isClient = activeJob.client.toLowerCase() === (address || '').toLowerCase();
    proposeTerms(activeJob.id, address);
    confetti({ particleCount: 50, spread: 60 });
    sendChatMessage(activeJob.id, `🔒 Terms signature hash submitted cryptographically by ${isClient ? 'Client' : 'Developer'}.`, 'Judge');
  };

  const handleFund = () => {
    if (!activeJob) return;
    fundJob(activeJob.id);
    confetti({ particleCount: 75, spread: 60 });
    sendChatMessage(activeJob.id, `💰 Escrow vault funded successfully. Budget of $${parseFloat(activeJob.amountUsdc).toLocaleString()} USDC is locked.`, 'Judge');
  };

  const handleRelease = () => {
    if (!activeJob) return;
    releasePayment(activeJob.id);
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    sendChatMessage(activeJob.id, `🎉 Escrow Milestone approved. Funds released to Developer's wallet. SBT minted!`, 'Judge');
  };

  const handleSubmitDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob || !submitTitle.trim()) return;

    submitWork(activeJob.id, submitTitle, submitDesc, submitLink ? [submitLink] : []);
    setIsSubmitModalOpen(false);
    confetti({ particleCount: 60, spread: 50 });
    sendChatMessage(activeJob.id, `🚀 Work Submission: "${submitTitle}" submitted for Client review. Deliverable link: ${submitLink || 'N/A'}`, 'Freelancer');
  };

  // Filters
  const filteredJudges = judges.filter((j: JudgeRecord) => {
    const matchesSearch = j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          j.address.toLowerCase().includes(searchQuery.toLowerCase());
    if (isAdmin) return matchesSearch;
    if (isJudgeRole) {
      return j.address.toLowerCase() === (address || '').toLowerCase() && matchesSearch;
    }
    return false;
  });

  const filteredChats = myChats.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1440px] mx-auto px-2 sm:px-4 lg:px-6 py-4 font-sans space-y-4">
      
      {/* Mobile Channel Switcher Header */}
      <div className="lg:hidden flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          type="button"
          onClick={() => setShowMobileChannels(!showMobileChannels)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold border border-purple-200/80 cursor-pointer"
        >
          <MessageSquare size={14} />
          <span>{showMobileChannels ? 'Close Channels' : 'Channels & Escrows'}</span>
        </button>
        <span className="text-xs text-slate-800 font-bold truncate max-w-[180px]">
          {activeJob ? activeJob.title : 'Escrow Channel'}
        </span>
      </div>

      {/* Main 3-Column Modern Web3 SaaS Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[780px] h-[82vh] border border-slate-200/80 bg-white rounded-3xl overflow-hidden shadow-xl shadow-purple-900/5 relative">
        
        {/* ──────────────────────────────────────────────────────────────────────────
            LEFT COLUMN: ESCROW CHANNELS SIDEBAR (3 COLS)
            ────────────────────────────────────────────────────────────────────────── */}
        <div className={`lg:col-span-3 border-r border-slate-200/80 flex-col h-full bg-[#F8FAFC] p-4 space-y-4 ${
          showMobileChannels ? 'flex absolute inset-0 z-30 bg-white' : 'hidden lg:flex'
        }`}>
          {/* Top Brand Header */}
          <div className="space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PolyLanceLogo size={30} />
                <span className="font-headline font-black text-xl text-slate-900 tracking-tight">
                  Poly<span className="text-purple-600">Lance</span>
                </span>
              </div>

              {showMobileChannels && (
                <button
                  type="button"
                  onClick={() => setShowMobileChannels(false)}
                  className="lg:hidden text-slate-400 hover:text-slate-700 p-1"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-widest px-1">
                ESCROW CHANNELS
              </span>

              {/* Admin/Judge Tab Switcher */}
              {(isAdmin || isJudgeRole) && (
                <div className="flex bg-slate-200/70 p-1 rounded-xl gap-1 border border-slate-300/40">
                  <button
                    type="button"
                    onClick={() => setChatTab('judges')}
                    className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      chatTab === 'judges' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Gavel size={13} /> Judges
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatTab('jobs')}
                    className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      chatTab === 'jobs' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Briefcase size={13} /> Job Escrows
                  </button>
                </div>
              )}
            </div>
            
            {/* Search Input with Filter Icon */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={chatTab === 'judges' ? "Search channels..." : "Search channels..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full !pl-8 !pr-3 !py-2 text-xs bg-white border border-slate-200/80 font-medium rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                />
                <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
              </div>
              <button type="button" className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-500 hover:text-purple-600 hover:border-purple-200 transition-all cursor-pointer shrink-0">
                <Filter size={13} />
              </button>
            </div>
          </div>

          {/* Active Channels List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider px-1 block">
              ACTIVE CHANNELS
            </span>

            {chatTab === 'judges' && (isAdmin || isJudgeRole) ? (
              filteredJudges.map((j: JudgeRecord) => {
                const isSelected = j.address.toLowerCase() === (selectedJudgeAddr || '').toLowerCase();
                const msgs = judgeMessages[j.address.toLowerCase()] || [];
                const lastMsg = msgs[msgs.length - 1];

                return (
                  <button
                    key={j.address}
                    onClick={() => { setSelectedJudgeAddr(j.address); setChatTab('judges'); setShowMobileChannels(false); }}
                    className={`w-full p-3 rounded-2xl text-left transition-all border flex items-start gap-3 cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600 shadow-md shadow-purple-600/20' 
                        : 'bg-white text-slate-700 border-slate-200/80 hover:border-purple-200 hover:shadow-2xs'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs uppercase ${
                        isSelected ? 'bg-white/20 text-white border border-white/30' : 'bg-purple-100 text-purple-700 border border-purple-200/80'
                      }`}>
                        {j.name.slice(0, 2)}
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold text-xs truncate max-w-[110px] ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {j.name}
                        </span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-purple-200 font-bold' : 'text-slate-400'}`}>
                          {msgs.length ? 'Active' : 'XMTP'}
                        </span>
                      </div>
                      <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-purple-100' : 'text-slate-400'}`}>
                        XMTP Encrypted Private Channel
                      </p>
                      <p className={`text-[10px] truncate font-mono mt-1 ${isSelected ? 'text-white font-medium' : 'text-slate-500'}`}>
                        {lastMsg ? `${lastMsg.senderRole}: ${lastMsg.text}` : 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              filteredChats.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs font-medium bg-white rounded-2xl border border-slate-200/60">
                  No active escrow channels found.
                </div>
              ) : (
                filteredChats.map((job) => {
                  const jobIsSelected = job.id === selectedJobId && chatTab === 'jobs';
                  const activeRoleIsClient = job.client.toLowerCase() === (address || '').toLowerCase();
                  const activeCounterpartAddress = activeRoleIsClient ? (job.freelancer || job.applications?.[0]?.applicant || '') : job.client;
                  const activeCounterpartKey = activeCounterpartAddress 
                    ? Object.keys(profiles).find(k => k.toLowerCase() === activeCounterpartAddress.toLowerCase()) 
                    : null;
                  const activeCounterpartProfile = activeCounterpartKey ? profiles[activeCounterpartKey] : null;
                  const activeCounterpartName = activeCounterpartProfile?.displayName || truncateAddress(activeCounterpartAddress || '');
                  const lastMsg = job.chatMessages?.[job.chatMessages.length - 1];

                  return (
                    <button
                      key={job.id}
                      onClick={() => { setSelectedJobId(job.id); setChatTab('jobs'); setShowMobileChannels(false); }}
                      className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-start gap-3 cursor-pointer ${
                        jobIsSelected 
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600 shadow-md shadow-purple-600/20' 
                          : 'bg-white text-slate-700 border-slate-200/80 hover:border-purple-200 hover:shadow-2xs'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs uppercase ${
                          jobIsSelected ? 'bg-white/20 text-white border border-white/30' : 'bg-purple-100 text-purple-700 border border-purple-200/80'
                        }`}>
                          {activeCounterpartName.slice(0, 2)}
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center">
                          <span className={`font-bold text-xs truncate max-w-[105px] ${jobIsSelected ? 'text-white' : 'text-slate-900'}`}>
                            {job.title}
                          </span>
                          <span className={`text-[10px] font-mono font-bold shrink-0 ${jobIsSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                            ${parseFloat(job.amountUsdc || '0').toLocaleString()} <span className="text-[8px]">USDC</span>
                          </span>
                        </div>
                        <p className={`text-[10px] truncate mt-0.5 ${jobIsSelected ? 'text-purple-100' : 'text-slate-400'}`}>
                          XMTP Encrypted Private Channel
                        </p>
                        <p className={`text-[10px] truncate font-mono mt-1 ${jobIsSelected ? 'text-white font-medium' : 'text-slate-500'}`}>
                          {lastMsg ? lastMsg.text : 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )
            )}
          </div>

          {/* Bottom Sidebar Action & XMTP Footer Note */}
          <div className="pt-3 border-t border-slate-200/80 shrink-0 space-y-3">
            <Link
              to={isAdmin ? "/judge" : "/jobs/post"}
              className="w-full bg-purple-50 hover:bg-purple-100/80 text-purple-700 font-bold py-2.5 px-4 rounded-2xl border border-purple-200/80 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <PlusCircle size={14} />
              <span>{isAdmin ? "Invite Arbitrator" : "Post Escrow Job"}</span>
            </Link>

            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-mono">
              <Lock size={11} className="text-purple-600 shrink-0" />
              <span>All messages are end-to-end encrypted via <span className="text-purple-600 font-bold">XMTP</span></span>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────────────
            CENTER COLUMN: ENCRYPTED CHAT CONVERSATION (6 COLS)
            ────────────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 flex flex-col h-full bg-white">
          {chatTab === 'judges' && (isAdmin || isJudgeRole) ? (
            /* Admin / Judge Chat Conversation */
            activeJudge ? (
              <>
                {/* Header Bar */}
                <div className="p-4 border-b border-slate-200/80 bg-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-xs uppercase shadow-sm">
                        {activeJudge.name.slice(0, 2)}
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-headline font-bold text-slate-900 text-sm">
                          {activeJudge.name}
                        </h4>
                        <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        XMTP Encrypted Private Channel
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/judge"
                      className="bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100 rounded-full px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      Channel Details <ArrowUpRight size={13} />
                    </Link>
                    <button type="button" className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                {/* Inner Scrollable Message Feed */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8FAFC]/50">
                  <div className="flex justify-center my-2">
                    <span className="bg-slate-100 border border-slate-200/80 text-slate-500 text-[10px] font-mono font-bold px-3 py-1 rounded-full">
                      Today
                    </span>
                  </div>

                  {((selectedJudgeAddr && judgeMessages[selectedJudgeAddr.toLowerCase()]) || []).map((msg: JudgeMessage) => {
                    const isMe = isAdmin ? msg.senderRole === 'Admin' : msg.senderRole === 'Judge';

                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-start gap-2.5`}>
                        {!isMe && (
                          <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-xs mt-1">
                            {isAdmin ? activeJudge.name.slice(0, 2) : 'AD'}
                          </div>
                        )}
                        <div className="max-w-md space-y-1">
                          <div className={`text-[10px] font-bold px-1 ${isMe ? 'text-right text-purple-600' : 'text-purple-600'}`}>
                            {msg.senderRole === 'Admin' ? 'Admin' : activeJudge.name}
                          </div>
                          <div className={`p-4 rounded-2xl border text-xs shadow-3xs leading-relaxed ${
                            isMe 
                              ? 'bg-[#F3E8FF] border-purple-200/80 text-purple-950 rounded-tr-xs' 
                              : 'bg-white border-slate-200/80 text-slate-900 rounded-tl-xs'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <div className={`text-right text-[9px] font-mono mt-1.5 flex items-center justify-end gap-1 ${isMe ? 'text-purple-600 font-bold' : 'text-slate-400'}`}>
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMe && <span>✓✓</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>

                {/* Floating Bottom Composer */}
                <div className="p-3 border-t border-slate-200/80 bg-white shrink-0 space-y-2">
                  <form onSubmit={handleSend} className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-1.5 flex items-center gap-2 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                    <button type="button" className="text-slate-400 hover:text-slate-600 p-2 cursor-pointer rounded-xl hover:bg-slate-200/50">
                      <Paperclip size={16} />
                    </button>
                    
                    <input
                      type="text"
                      placeholder={`Message ${activeJudge.name}...`}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-xs font-medium px-1 py-1.5 text-slate-900 placeholder-slate-400"
                    />

                    <div className="relative">
                      <button 
                        type="button" 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="text-slate-400 hover:text-slate-600 p-2 cursor-pointer rounded-xl hover:bg-slate-200/50 flex items-center justify-center"
                      >
                        <Smile size={16} />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 grid grid-cols-6 gap-1 w-48 font-sans">
                          {['👍', '❤️', '😂', '🎉', '🔥', '🚀', '💻', '💡', '👏', '👀', '💬', '💯'].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setInputText(prev => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                              className="text-base p-1 hover:bg-slate-100 rounded-md transition-colors text-center cursor-pointer"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer shrink-0"
                    >
                      <Send size={14} /> Send
                    </button>
                  </form>

                  <div className="text-center">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1">
                      <Lock size={11} className="text-purple-600 shrink-0" /> Messages are end-to-end encrypted via <span className="text-purple-600 font-bold">XMTP</span>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
                <EmptyState
                  title="Secure Channel Ready"
                  description="Select an arbitrator channel to coordinate milestone specifications securely."
                  actionText=""
                />
              </div>
            )
          ) : (
            /* Job Escrow Chat Conversation */
            activeJob ? (
              <>
                {/* Header Bar */}
                <div className="p-4 border-b border-slate-200/80 bg-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-xs uppercase shadow-sm">
                        {(activeJob.client.toLowerCase() === (address || '').toLowerCase() ? (activeJob.freelancer || 'Dev') : 'Client').slice(0, 2)}
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-headline font-bold text-slate-900 text-sm">{activeJob.title}</h4>
                        <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        XMTP Encrypted Private Channel
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/jobs/${activeJob.id}`}
                      className="bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100 rounded-full px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      Channel Details <ArrowUpRight size={13} />
                    </Link>
                    <button type="button" className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                {/* Inner Scrollable Messages Feed */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8FAFC]/50">
                  <div className="flex justify-center my-2">
                    <span className="bg-slate-100 border border-slate-200/80 text-slate-500 text-[10px] font-mono font-bold px-3 py-1 rounded-full">
                      Today
                    </span>
                  </div>

                  {(activeJob.chatMessages || [
                    { sender: 'Client' as const, text: 'Welcome! Let us coordinate milestone specifications and delivery targets.', timestamp: activeJob.createdAt || Date.now() - 3600000 }
                  ]).map((msg, index) => {
                    const isClient = activeJob.client.toLowerCase() === (address || '').toLowerCase();
                    const isFreelancer = activeJob.freelancer?.toLowerCase() === (address || '').toLowerCase();
                    
                    const isSystem = msg.sender === 'Judge' && (
                      msg.text.startsWith('🔒') || 
                      msg.text.startsWith('💰') || 
                      msg.text.startsWith('🎉') || 
                      msg.text.startsWith('⚠️') || 
                      msg.text.startsWith('🚀')
                    );

                    const isUser = !isSystem && (
                      (isClient && msg.sender === 'Client') ||
                      (isFreelancer && msg.sender === 'Freelancer') ||
                      ((isAdmin || isJudgeRole) && msg.sender === 'Judge')
                    );

                    if (isSystem) {
                      return (
                        <div key={index} className="flex justify-center my-3">
                          <div className="bg-purple-50 border border-purple-200/80 text-purple-900 rounded-xl px-4 py-2 text-[10px] font-mono font-bold flex items-center gap-2 shadow-2xs">
                            <Lock size={12} className="text-purple-700 shrink-0" />
                            <span>{msg.text}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={index}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-2.5`}
                      >
                        {!isUser && (
                          <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-xs mt-1">
                            {msg.sender.slice(0, 2)}
                          </div>
                        )}
                        <div className="max-w-md space-y-1">
                          <div className={`text-[10px] font-bold px-1 ${isUser ? 'text-right text-purple-600' : 'text-purple-600'}`}>
                            {msg.sender}
                          </div>
                          <div className={`p-4 rounded-2xl border text-xs shadow-3xs leading-relaxed ${
                            isUser 
                              ? 'bg-[#F3E8FF] border-purple-200/80 text-purple-950 rounded-tr-xs' 
                              : 'bg-white border-slate-200/80 text-slate-900 rounded-tl-xs'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <div className={`text-right text-[9px] font-mono mt-1.5 flex items-center justify-end gap-1 ${isUser ? 'text-purple-600 font-bold' : 'text-slate-400'}`}>
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isUser && <span>✓✓</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>

                {/* Floating Bottom Composer */}
                <div className="p-3 border-t border-slate-200/80 bg-white shrink-0 space-y-2">
                  <form onSubmit={handleSend} className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-1.5 flex items-center gap-2 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                    <button type="button" className="text-slate-400 hover:text-slate-600 p-2 cursor-pointer rounded-xl hover:bg-slate-200/50">
                      <Paperclip size={16} />
                    </button>
                    <input
                      type="text"
                      placeholder="Message client or developer..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-xs font-medium px-1 py-1.5 text-slate-900 placeholder-slate-400"
                    />
                    <div className="relative">
                      <button 
                        type="button" 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="text-slate-400 hover:text-slate-600 p-2 cursor-pointer rounded-xl hover:bg-slate-200/50 flex items-center justify-center"
                      >
                        <Smile size={16} />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 grid grid-cols-6 gap-1 w-48 font-sans">
                          {['👍', '❤️', '😂', '🎉', '🔥', '🚀', '💻', '💡', '👏', '👀', '💬', '💯'].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setInputText(prev => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                              className="text-base p-1 hover:bg-slate-100 rounded-md transition-colors text-center cursor-pointer"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer shrink-0"
                    >
                      <Send size={14} /> Send
                    </button>
                  </form>

                  <div className="text-center">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1">
                      <Lock size={11} className="text-purple-600 shrink-0" /> Messages are end-to-end encrypted via <span className="text-purple-600 font-bold">XMTP</span>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mb-3">
                  <Lock size={22} />
                </div>
                <h4 className="font-headline font-bold text-slate-900 text-base">Secure channel ready</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                  Start the conversation and coordinate your escrow milestones securely.
                </p>
              </div>
            )
          )}
        </div>

        {/* ──────────────────────────────────────────────────────────────────────────
            RIGHT COLUMN: ESCROW DETAILS & SMART CONTRACT ACTIONS (3 COLS)
            ────────────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 border-l border-slate-200/80 flex flex-col h-full bg-white p-5 overflow-y-auto space-y-5">
          {activeJob ? (
            <>
              {/* Top Status Badge */}
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 border border-purple-200 px-3 py-1 rounded-full">
                  <Lock size={12} className="text-purple-700 shrink-0" />
                  {activeJob.status === 'Completed' ? 'COMPLETED ESCROW' : `${activeJob.status.toUpperCase()} ESCROW`}
                </span>
                <h3 className="font-headline font-extrabold text-slate-900 text-base leading-snug">
                  {activeJob.title}
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  {activeJob.description || 'Test the Site UI'}
                </p>
              </div>

              {/* Locked Vault Deposit Card */}
              <div className="bg-[#F8FAFC] border border-slate-200/80 p-4 rounded-2xl space-y-1.5">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block tracking-wider">
                  LOCKED VAULT DEPOSIT
                </span>
                <div className="font-mono font-black text-slate-900 text-2xl flex items-center justify-between">
                  <span>${parseFloat(activeJob.amountUsdc || '0').toFixed(2)} <span className="text-xs text-slate-500 font-normal">USDC</span></span>
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shadow-2xs">
                    $
                  </div>
                </div>
              </div>

              {/* Smart Contract Actions Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block tracking-wider">
                  SMART CONTRACT ACTIONS
                </span>

                {/* Action Card 1: Polygon Smart Escrow */}
                <div className="bg-[#FAF5FF] border border-purple-200/60 p-3.5 rounded-2xl flex items-center justify-between text-xs hover:border-purple-300 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-200/70 text-purple-700 flex items-center justify-center shrink-0">
                      <Shield size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-purple-950 text-xs">Polygon Smart Escrow</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Non-custodial EIP-5192 vault protection.</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-purple-400 shrink-0" />
                </div>

                {/* Action Card 2: View on Explorer */}
                <a 
                  href={`https://amoy.polygonscan.com/address/${activeJob.contractAddress || '0x'}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="bg-[#ECFDF5] border border-emerald-200/60 p-3.5 rounded-2xl flex items-center justify-between text-xs hover:border-emerald-300 transition-all cursor-pointer block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-200/70 text-emerald-700 flex items-center justify-center shrink-0">
                      <ExternalLink size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-950 text-xs">View on Explorer</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Check transaction & escrow details</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-emerald-400 shrink-0" />
                </a>

                {/* Action Card 3: Download Receipt */}
                <Link 
                  to={`/audit/${activeJob.client}`} 
                  className="bg-[#FFFBEB] border border-amber-200/60 p-3.5 rounded-2xl flex items-center justify-between text-xs hover:border-amber-300 transition-all cursor-pointer block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-200/70 text-amber-800 flex items-center justify-center shrink-0">
                      <Download size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-amber-950 text-xs">Download Receipt</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Get encrypted escrow receipt</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-amber-400 shrink-0" />
                </Link>
              </div>

              {/* Action Buttons: Terms / Fund / Submit / Release */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {activeJob.status === 'Open' && (
                  <button
                    onClick={handleProposeTerms}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                  >
                    <FileCheck size={14} /> Sign Terms Hash
                  </button>
                )}

                {((activeJob.status as string) === 'TermsAgreed' || activeJob.status === 'Selected') && (activeJob.client.toLowerCase() === (address || '').toLowerCase() || isAdmin) && (
                  <button
                    onClick={handleFund}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <DollarSign size={14} /> Fund Vault Deposit
                  </button>
                )}

                {((activeJob.status as string) === 'Funded' || activeJob.status === 'Selected') && (activeJob.freelancer?.toLowerCase() === (address || '').toLowerCase() || isAdmin) && (
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                  >
                    <PlusCircle size={14} /> Submit Deliverable
                  </button>
                )}

                {(activeJob.status === 'Submitted' || (activeJob.status as string) === 'Funded') && (activeJob.client.toLowerCase() === (address || '').toLowerCase() || isAdmin) && (
                  <button
                    onClick={handleRelease}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle size={14} /> Approve & Release Payout
                  </button>
                )}
              </div>

              {/* Bottom Raise Dispute Danger Button */}
              <button
                type="button"
                onClick={() => {
                  const reason = prompt('State the dispute reason:');
                  if (reason && activeJob) {
                    sendChatMessage(activeJob.id, `⚠️ Dispute Raised: ${reason}`, 'Judge');
                  }
                }}
                className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all cursor-pointer mt-auto"
              >
                <AlertTriangle size={14} /> Raise Dispute
              </button>
            </>
          ) : activeJudge ? (
            <>
              {/* Judge Summary */}
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 border border-purple-200 px-3 py-1 rounded-full">
                  <Lock size={12} className="text-purple-700 shrink-0" />
                  COMPLETED ESCROW
                </span>
                <h3 className="font-headline font-extrabold text-slate-900 text-base leading-snug">
                  {activeJudge.name}
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  {activeJudge.notes || 'Lead Arbitrator for decentralized dispute resolution.'}
                </p>
              </div>

              {/* Deposit Card */}
              <div className="bg-[#F8FAFC] border border-slate-200/80 p-4 rounded-2xl space-y-1.5">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block tracking-wider">
                  LOCKED VAULT DEPOSIT
                </span>
                <div className="font-mono font-black text-slate-900 text-2xl flex items-center justify-between">
                  <span>$99.96 <span className="text-xs text-slate-500 font-normal">USDC</span></span>
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shadow-2xs">
                    $
                  </div>
                </div>
              </div>

              {/* Smart Contract Actions */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block tracking-wider">
                  SMART CONTRACT ACTIONS
                </span>

                <div className="bg-[#FAF5FF] border border-purple-200/60 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-200/70 text-purple-700 flex items-center justify-center shrink-0">
                      <Shield size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-purple-950 text-xs">Polygon Smart Escrow</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Non-custodial EIP-5192 vault protection.</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-purple-400 shrink-0" />
                </div>

                <div className="bg-[#ECFDF5] border border-emerald-200/60 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-200/70 text-emerald-700 flex items-center justify-center shrink-0">
                      <ExternalLink size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-950 text-xs">View on Explorer</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Check transaction & escrow details</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-emerald-400 shrink-0" />
                </div>

                <div className="bg-[#FFFBEB] border border-amber-200/60 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-200/70 text-amber-800 flex items-center justify-center shrink-0">
                      <Download size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-amber-950 text-xs">Download Receipt</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Get encrypted escrow receipt</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-amber-400 shrink-0" />
                </div>
              </div>

              <button
                type="button"
                className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all cursor-pointer mt-auto"
              >
                <AlertTriangle size={14} /> Raise Dispute
              </button>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs font-mono">
              No active channel selected.
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          BOTTOM SECURITY & NETWORK STATUS STRIP
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Shield size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">ENCRYPTION</span>
            <span className="font-bold text-slate-900">XMTP Protocol</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">CHANNEL STATUS</span>
            <span className="font-bold text-slate-900">Active & Secure</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">NETWORK</span>
            <span className="font-bold text-slate-900">Polygon Mainnet</span>
          </div>
        </div>
      </div>

      {/* Deliverable Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="glass-panel max-w-md w-full p-6 space-y-4 border-purple-200 bg-white shadow-xl">
            <h3 className="font-headline text-base font-bold text-slate-900">Submit Deliverable Work</h3>
            <form onSubmit={handleSubmitDeliverable} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Deliverable Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Contract V1 Audit & Frontend Integration"
                  value={submitTitle}
                  onChange={(e) => setSubmitTitle(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Description / Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide summary of completed milestones..."
                  value={submitDesc}
                  onChange={(e) => setSubmitDesc(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  External Link (GitHub PR / Figma / IPFS)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={submitLink}
                  onChange={(e) => setSubmitLink(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-btn-primary px-5 py-2 text-xs font-bold"
                >
                  Submit Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
