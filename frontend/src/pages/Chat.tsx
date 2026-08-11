import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { 
  MessageSquare, Send, ShieldCheck, Award, Scale, Building2, Briefcase, 
  ExternalLink, Lock, PlusCircle, DollarSign, CheckCircle2, ArrowUpRight, 
  User, Clock, Search, Sparkles, AlertCircle, FileCheck, CheckCircle, Gavel, UserCheck
} from 'lucide-react';
import { truncateAddress } from '../utils/formatters';
import { JudgeRecord, JudgeMessage } from '../types';
import confetti from 'canvas-confetti';

export const Chat: React.FC = () => {
  const { jobId: urlJobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { address, currentRole, isConnected } = useWeb3();
  const { 
    jobs, profiles, judges, judgeMessages, sendChatMessage, sendJudgeChatMessage, proposeTerms, fundJob, 
    releasePayment, submitWork, requestModifications 
  } = usePolyLanceData();

  const isAdmin = currentRole === 'admin';
  const [chatTab, setChatTab] = useState<'jobs' | 'judges'>(isAdmin && !urlJobId ? 'judges' : 'jobs');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(urlJobId || null);
  const [selectedJudgeAddr, setSelectedJudgeAddr] = useState<string | null>(
    judges.length > 0 ? judges[0].address : null
  );

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive submission modal inside chat
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitDesc, setSubmitDesc] = useState('');
  const [submitLink, setSubmitLink] = useState('');

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

  // Filter jobs for conversation sidebar
  const myChats = jobs.filter(j => {
    if (isAdmin) return true; // Admin has visibility across all active negotiation channels
    const lowerAddr = (address || '').toLowerCase();
    const isClient = j.client.toLowerCase() === lowerAddr;
    const isFreelancer = j.freelancer?.toLowerCase() === lowerAddr;
    const isApplicant = (j.applications || []).some(app => app.applicant.toLowerCase() === lowerAddr);
    const isJudge = currentRole === 'judge';
    const isDisputed = j.status === 'Disputed';

    return isClient || isFreelancer || isApplicant || (isJudge && isDisputed);
  });

  // Default to the first conversation if none selected
  useEffect(() => {
    if (!selectedJobId && myChats.length > 0) {
      setSelectedJobId(myChats[0].id);
    }
  }, [myChats, selectedJobId]);

  const activeJob = jobs.find(j => j.id === selectedJobId);
  const activeJudge = judges.find(j => j.address.toLowerCase() === (selectedJudgeAddr || '').toLowerCase());

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeJob?.chatMessages, selectedJudgeAddr, judgeMessages, chatTab]);

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 font-sans">
        <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 font-heading">Wallet Not Connected</h2>
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

    if (isAdmin && chatTab === 'judges' && selectedJudgeAddr) {
      sendJudgeChatMessage(selectedJudgeAddr, inputText, 'Admin', address);
      setInputText('');
    } else if (activeJob) {
      const isClient = activeJob.client.toLowerCase() === (address || '').toLowerCase();
      const senderRole = isAdmin ? 'Judge' : (isClient ? 'Client' : 'Freelancer');
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

  const handleRequestRevision = () => {
    if (!activeJob) return;
    const note = prompt('Please explain what revisions are required:');
    if (!note) return;
    requestModifications(activeJob.id, note);
    sendChatMessage(activeJob.id, `⚠️ Revision Request: Client requested code changes. Note: "${note}"`, 'Client');
  };

  // Filters
  const filteredJudges = judges.filter((j: JudgeRecord) =>
    j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChats = myChats.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh] border border-slate-200 bg-white rounded-3xl overflow-hidden shadow-xl">
        
        {/* Left Side: Conversation Sidebar (3 Cols) */}
        <div className="lg:col-span-3 border-r border-slate-200 flex flex-col h-full bg-slate-50">
          <div className="p-4 border-b border-slate-200 bg-white space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-sm font-black text-slate-800 flex items-center gap-1.5">
                <MessageSquare size={16} className="text-purple-700" /> Channels
              </h3>
            </div>

            {/* Admin Channel Mode Selector */}
            {isAdmin && (
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setChatTab('judges')}
                  className={`flex-1 py-1 text-center text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    chatTab === 'judges' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Judges
                </button>
                <button
                  type="button"
                  onClick={() => setChatTab('jobs')}
                  className={`flex-1 py-1 text-center text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    chatTab === 'jobs' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Job Escrows
                </button>
              </div>
            )}
            
            <div className="relative">
              <input
                type="text"
                placeholder={chatTab === 'judges' ? "Search judges..." : "Search channels..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full !pl-8 !pr-3 !py-1.5 text-xs glass-input font-medium"
              />
              <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {chatTab === 'judges' && isAdmin ? (
              /* Admin View: Show List of Registered Judges ONLY */
              filteredJudges.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  No judge accounts registered.
                </div>
              ) : (
                filteredJudges.map((j: JudgeRecord) => {
                  const isSelected = j.address.toLowerCase() === (selectedJudgeAddr || '').toLowerCase();
                  const msgs = judgeMessages[j.address.toLowerCase()] || [];
                  const lastMsg = msgs[msgs.length - 1];

                  return (
                    <button
                      key={j.address}
                      onClick={() => { setSelectedJudgeAddr(j.address); setChatTab('judges'); }}
                      className={`w-full p-3 rounded-2xl text-left transition-all border flex items-start gap-3 cursor-pointer ${
                        isSelected 
                          ? 'bg-purple-700 text-white border-purple-800 shadow-md font-bold' 
                          : 'bg-white text-slate-700 border-slate-150 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                        isSelected ? 'bg-purple-100 text-purple-900' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {j.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                          <span className={`font-extrabold text-xs truncate max-w-[130px] ${isSelected ? 'text-white' : 'text-slate-900'}`} style={isSelected ? { color: '#FFFFFF' } : undefined}>
                            {j.name}
                          </span>
                          <span className={`text-[9px] font-mono shrink-0 px-1.5 py-0.5 rounded ${
                            isSelected 
                              ? 'bg-purple-900 text-white font-bold' 
                              : j.status === 'Active' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                          }`}>
                            {j.status}
                          </span>
                        </div>
                        <p className={`text-[10px] truncate font-mono mt-0.5 ${isSelected ? 'text-purple-100' : 'text-slate-500'}`} style={isSelected ? { color: '#F3E8FF' } : undefined}>
                          {truncateAddress(j.address)}
                        </p>
                        <p className={`text-[9px] truncate font-mono mt-1 ${isSelected ? 'text-white font-bold' : 'text-slate-400'}`} style={isSelected ? { color: '#FFFFFF' } : undefined}>
                          {lastMsg ? `${lastMsg.senderRole}: ${lastMsg.text}` : 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              /* Job Escrow Channels List */
              filteredChats.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  No active negotiation channels.
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
                      onClick={() => { setSelectedJobId(job.id); setChatTab('jobs'); }}
                      className={`w-full p-3 rounded-2xl text-left transition-all border flex items-start gap-3 cursor-pointer ${
                        jobIsSelected 
                          ? 'bg-purple-700 text-white border-purple-800 shadow-md font-bold' 
                          : 'bg-white text-slate-700 border-slate-150 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                        jobIsSelected ? 'bg-purple-100 text-purple-900' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {activeCounterpartName.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                          <span className={`font-extrabold text-xs truncate max-w-[120px] ${jobIsSelected ? 'text-white' : 'text-slate-900'}`} style={jobIsSelected ? { color: '#FFFFFF' } : undefined}>
                            {activeCounterpartName}
                          </span>
                          <span className={`text-[9px] font-mono shrink-0 ${jobIsSelected ? 'text-purple-100 font-bold' : 'text-slate-500'}`} style={jobIsSelected ? { color: '#F3E8FF' } : undefined}>
                            ${parseFloat(job.amountUsdc || '0').toLocaleString()}
                          </span>
                        </div>
                        <p className={`text-[10px] truncate font-sans mt-0.5 ${jobIsSelected ? 'text-white font-bold' : 'text-slate-700'}`} style={jobIsSelected ? { color: '#FFFFFF' } : undefined}>
                          {job.title}
                        </p>
                        <p className={`text-[9px] truncate font-mono mt-1 ${jobIsSelected ? 'text-purple-100 font-medium' : 'text-slate-500'}`} style={jobIsSelected ? { color: '#E9D5FF' } : undefined}>
                          {lastMsg ? `${lastMsg.sender}: ${lastMsg.text}` : 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Center: Live Messenger Feed (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col h-full bg-slate-50/50">
          {chatTab === 'judges' && isAdmin ? (
            /* Admin Chat Window with Selected Judge */
            activeJudge ? (
              <>
                <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-extrabold uppercase">
                      {activeJudge.name.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-slate-900 text-sm flex items-center gap-2">
                        {activeJudge.name}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          activeJudge.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {activeJudge.status}
                        </span>
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        XMTP Admin Direct Channel ({truncateAddress(activeJudge.address)})
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/judge"
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 font-mono"
                  >
                    Manage Judges <ArrowUpRight size={14} />
                  </Link>
                </div>

                {/* Admin-Judge Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
                  {((selectedJudgeAddr && judgeMessages[selectedJudgeAddr.toLowerCase()]) || []).length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs font-mono space-y-2">
                      <Lock className="w-8 h-8 text-purple-600 mx-auto opacity-80" />
                      <p className="font-bold text-slate-800">End-to-End Encrypted Admin ↔ Judge Direct Channel</p>
                      <p>Send a message below to coordinate dispute arbitrations with {activeJudge.name}.</p>
                    </div>
                  ) : (
                    ((selectedJudgeAddr && judgeMessages[selectedJudgeAddr.toLowerCase()]) || []).map((msg: JudgeMessage) => {
                      const isMe = msg.senderRole === 'Admin';

                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-md p-3.5 rounded-2xl border text-xs shadow-xs space-y-1.5 ${
                            isMe 
                              ? 'bg-purple-700 text-white border-purple-800 rounded-tr-none font-bold' 
                              : 'bg-white text-slate-800 border-slate-200 rounded-tl-none font-medium'
                          }`}>
                            <div className={`font-mono text-[9px] font-bold ${isMe ? 'text-purple-200' : 'text-purple-700'}`}>
                              {msg.senderRole === 'Admin' ? 'Admin Governance' : `${activeJudge.name} (Arbitrator)`}
                            </div>
                            <p className={`leading-relaxed whitespace-pre-wrap ${isMe ? 'text-white font-medium' : 'text-slate-800'}`}>{msg.text}</p>
                            <div className={`text-right text-[8px] font-mono ${isMe ? 'text-purple-200' : 'text-slate-400'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Admin Input Panel */}
                <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder={`Message ${activeJudge.name}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full glass-input text-xs font-semibold py-3"
                  />
                  <button
                    type="submit"
                    className="gradient-btn-primary px-5 rounded-xl flex items-center justify-center cursor-pointer shadow-md"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-8 text-slate-400 space-y-3">
                <UserCheck size={48} className="text-purple-600 stroke-1" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Select a Judge Account</h4>
                  <p className="text-xs text-slate-500 mt-1 font-mono">Choose an arbitrator from the left panel to open direct encrypted communications.</p>
                </div>
              </div>
            )
          ) : (
            /* Job Escrow Chat Window */
            activeJob ? (
              <>
                <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-extrabold uppercase">
                      {(activeJob.client.toLowerCase() === (address || '').toLowerCase() ? (activeJob.freelancer || 'Dev') : 'Client').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-slate-900 text-sm">{activeJob.title}</h4>
                      <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        XMTP Encrypted Escrow Channel
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/jobs/${activeJob.id}`}
                    className="no-print text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                  >
                    View Details <ArrowUpRight size={14} />
                  </Link>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
                  {(activeJob.chatMessages || [
                    { sender: 'Client' as const, text: 'Welcome! Let us coordinate milestone specifications and delivery targets.', timestamp: activeJob.createdAt || Date.now() - 3600000 }
                  ]).map((msg, index) => {
                    const isClient = activeJob.client.toLowerCase() === (address || '').toLowerCase();
                    const isUser = msg.sender === (isClient ? 'Client' : 'Freelancer') || (isAdmin && msg.sender === 'Judge');
                    const isSystem = msg.sender === 'Judge' && !isAdmin;

                    if (isSystem) {
                      return (
                        <div key={index} className="flex justify-center my-3">
                          <div className="bg-slate-100 border border-slate-200 text-slate-600 rounded-xl px-4 py-1.5 text-[10px] font-mono font-bold flex items-center gap-1.5">
                            <Lock size={12} className="text-purple-700" />
                            {msg.text}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={index}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-md p-3.5 rounded-2xl border text-xs shadow-xs space-y-1.5 ${
                          isUser 
                            ? 'bg-purple-700 text-white border-purple-800 rounded-tr-none' 
                            : 'bg-white text-slate-800 border-slate-200 rounded-tl-none font-sans font-medium'
                        }`}>
                          <div className={`font-mono text-[9px] font-bold ${isUser ? 'text-purple-200' : 'text-slate-400'}`}>
                            {msg.sender}
                          </div>
                          <p className={`leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white font-medium' : 'text-slate-800'}`}>{msg.text}</p>
                          <div className={`text-right text-[8px] font-mono ${isUser ? 'text-purple-200' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Panel */}
                <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Type encrypted message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full glass-input text-xs font-semibold py-3"
                  />
                  <button
                    type="submit"
                    className="gradient-btn-primary px-5 rounded-xl flex items-center justify-center cursor-pointer shadow-md"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-8 text-slate-400 space-y-3">
                <MessageSquare size={48} className="text-purple-600 stroke-1" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Select a Conversation</h4>
                  <p className="text-xs text-slate-500 mt-1 font-mono">Choose a channel from the left panel to begin encrypted chatting.</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Right Side: Contract & Milestone Summary Panel (3 Cols) */}
        <div className="lg:col-span-3 border-l border-slate-200 flex flex-col h-full bg-white p-5 overflow-y-auto space-y-6">
          {activeJob ? (
            <>
              <div>
                <span className="text-[9.5px] uppercase font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded">
                  {activeJob.status} Escrow
                </span>
                <h3 className="font-headline font-bold text-slate-900 text-sm mt-2 leading-snug">
                  {activeJob.title}
                </h3>
                <p className="text-[11px] text-slate-500 font-sans mt-1 line-clamp-3 leading-relaxed">
                  {activeJob.description}
                </p>
              </div>

              {/* Escrow Value Card */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1">
                <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Locked Vault Deposit</span>
                <div className="font-mono font-extrabold text-slate-900 text-lg flex items-baseline gap-1">
                  <span>${parseFloat(activeJob.amountUsdc || '0').toLocaleString()}</span>
                  <span className="text-xs font-normal text-slate-500">USDC</span>
                </div>
              </div>

              {/* Workflow Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-2">Smart Contract Actions</span>

                {/* Propose / Agree Terms */}
                {activeJob.status === 'Open' && (
                  <button
                    onClick={handleProposeTerms}
                    className="w-full gradient-btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <FileCheck size={14} /> Sign Terms Hash
                  </button>
                )}

                {/* Fund Escrow Vault (Client) */}
                {((activeJob.status as string) === 'TermsAgreed' || activeJob.status === 'Selected') && (activeJob.client.toLowerCase() === (address || '').toLowerCase() || isAdmin) && (
                  <button
                    onClick={handleFund}
                    className="w-full gradient-btn-emerald py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <DollarSign size={14} /> Fund Vault Deposit
                  </button>
                )}

                {/* Submit Deliverable (Freelancer) */}
                {((activeJob.status as string) === 'Funded' || activeJob.status === 'Selected') && (activeJob.freelancer?.toLowerCase() === (address || '').toLowerCase() || isAdmin) && (
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="w-full gradient-btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <PlusCircle size={14} /> Submit Deliverable
                  </button>
                )}

                {/* Approve Deliverable & Release (Client) */}
                {(activeJob.status === 'Submitted' || (activeJob.status as string) === 'Funded') && (activeJob.client.toLowerCase() === (address || '').toLowerCase() || isAdmin) && (
                  <button
                    onClick={handleRelease}
                    className="w-full gradient-btn-emerald py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle size={14} /> Approve & Release Payout
                  </button>
                )}

                {/* Request Revisions (Client) */}
                {activeJob.status === 'Submitted' && (activeJob.client.toLowerCase() === (address || '').toLowerCase() || isAdmin) && (
                  <button
                    onClick={handleRequestRevision}
                    className="w-full btn-secondary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Clock size={14} /> Request Revision
                  </button>
                )}
              </div>

              {/* Security Badge */}
              <div className="bg-purple-50/60 border border-purple-100 p-3 rounded-2xl text-[10px] text-purple-900 font-mono space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <ShieldCheck size={13} className="text-purple-700" /> Polygon Smart Escrow
                </div>
                <p className="text-slate-600 text-[9.5px]">Non-custodial EIP-5192 vault protection.</p>
              </div>
            </>
          ) : activeJudge ? (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-purple-800">Arbitrator Profile</span>
                <h4 className="font-bold text-slate-900 text-sm">{activeJudge.name}</h4>
                <p className="text-xs text-slate-600 font-mono">{truncateAddress(activeJudge.address)}</p>
                <div className="pt-2">
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded uppercase">
                    {activeJudge.status}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-mono leading-relaxed">{activeJudge.notes}</p>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs font-mono">
              No active channel selected.
            </div>
          )}
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
