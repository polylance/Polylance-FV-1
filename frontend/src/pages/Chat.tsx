import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { 
  MessageSquare, Send, ShieldCheck, Award, Scale, Building2, Briefcase, 
  ExternalLink, Lock, PlusCircle, DollarSign, CheckCircle2, ArrowUpRight, 
  User, Clock, Search, Sparkles, AlertCircle, FileCheck, CheckCircle 
} from 'lucide-react';
import { truncateAddress } from '../utils/formatters';
import confetti from 'canvas-confetti';

export const Chat: React.FC = () => {
  const { jobId: urlJobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { address, currentRole, isConnected, isArbitrator } = useWeb3();
  const { 
    jobs, profiles, sendChatMessage, proposeTerms, fundJob, 
    releasePayment, submitWork, requestModifications 
  } = usePolyLanceData();

  const [selectedJobId, setSelectedJobId] = useState<string | null>(urlJobId || null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive submission modal inside chat
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitDesc, setSubmitDesc] = useState('');
  const [submitLink, setSubmitLink] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter jobs where the active user is a participant
  const myChats = jobs.filter(j => {
    const lowerAddr = address.toLowerCase();
    const isClient = j.client.toLowerCase() === lowerAddr;
    const isFreelancer = j.freelancer?.toLowerCase() === lowerAddr;
    const isApplicant = j.applications.some(app => app.applicant.toLowerCase() === lowerAddr);
    return isClient || isFreelancer || isApplicant;
  });

  // Default to the first conversation if none selected
  useEffect(() => {
    if (!selectedJobId && myChats.length > 0) {
      setSelectedJobId(myChats[0].id);
    }
  }, [myChats, selectedJobId]);

  const activeJob = jobs.find(j => j.id === selectedJobId);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeJob?.chatMessages]);

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

  // Determine chat counterparts
  const isClient = activeJob ? activeJob.client.toLowerCase() === address.toLowerCase() : false;
  
  let counterpartAddress = '';
  if (activeJob) {
    if (isClient) {
      counterpartAddress = activeJob.freelancer || (activeJob.applications[0]?.applicant || '');
    } else {
      counterpartAddress = activeJob.client;
    }
  }

  const counterpartKey = counterpartAddress 
    ? Object.keys(profiles).find(k => k.toLowerCase() === counterpartAddress.toLowerCase()) 
    : null;
  const counterpartProfile = counterpartKey ? profiles[counterpartKey] : null;
  const counterpartName = counterpartProfile?.displayName || (counterpartAddress ? truncateAddress(counterpartAddress) : 'Anonymous user');

  const messages = activeJob?.chatMessages || [
    { sender: 'Client' as const, text: 'Welcome! Let us coordinate milestone specifications and delivery targets.', timestamp: activeJob?.createdAt || Date.now() - 3600000 }
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeJob) return;
    
    sendChatMessage(activeJob.id, inputText, isClient ? 'Client' : 'Freelancer');
    setInputText('');
  };

  // Escrow direct actions
  const handleProposeTerms = () => {
    if (!activeJob) return;
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

  const filteredChats = myChats.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh] border border-slate-200 bg-white rounded-3xl overflow-hidden shadow-xl">
        
        {/* Left Side: Active Negotiation Channels (3 Cols) */}
        <div className="lg:col-span-3 border-r border-slate-200 flex flex-col h-full bg-slate-50">
          <div className="p-4 border-b border-slate-200 bg-white space-y-3 shrink-0">
            <h3 className="font-headline text-sm font-black text-slate-800 flex items-center gap-1.5">
              <MessageSquare size={16} className="text-purple-755 text-purple-700" /> Negotiation Channels
            </h3>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full !pl-8 !pr-3 !py-1.5 text-xs glass-input font-medium"
              />
              <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No negotiation channels active.
              </div>
            ) : (
              filteredChats.map((job) => {
                const jobIsSelected = job.id === selectedJobId;
                const activeRoleIsClient = job.client.toLowerCase() === address.toLowerCase();
                const activeCounterpartAddress = activeRoleIsClient ? (job.freelancer || job.applications[0]?.applicant || '') : job.client;
                const activeCounterpartKey = activeCounterpartAddress 
                  ? Object.keys(profiles).find(k => k.toLowerCase() === activeCounterpartAddress.toLowerCase()) 
                  : null;
                const activeCounterpartProfile = activeCounterpartKey ? profiles[activeCounterpartKey] : null;
                const activeCounterpartName = activeCounterpartProfile?.displayName || truncateAddress(activeCounterpartAddress || '');
                const lastMsg = job.chatMessages?.[job.chatMessages.length - 1];

                return (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
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
                        <span className="font-extrabold text-xs truncate max-w-[120px]">
                          {activeCounterpartName}
                        </span>
                        <span className={`text-[9px] font-mono shrink-0 ${jobIsSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                          ${parseFloat(job.amountUsdc).toLocaleString()}
                        </span>
                      </div>
                      <p className={`text-[10px] truncate font-sans mt-0.5 ${jobIsSelected ? 'text-purple-100' : 'text-slate-500'}`}>
                        {job.title}
                      </p>
                      <p className={`text-[9px] truncate font-mono mt-1 ${jobIsSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                        {lastMsg ? `${lastMsg.sender}: ${lastMsg.text}` : 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Live Messenger Feed (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col h-full bg-slate-50/50">
          {activeJob ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-extrabold uppercase">
                    {counterpartName.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-slate-900 text-sm">{counterpartName}</h4>
                    <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      XMTP Encrypted Connected ({truncateAddress(counterpartAddress)})
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

              {/* Chat Messages List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
                {messages.map((msg, index) => {
                  const isUser = msg.sender === (isClient ? 'Client' : 'Freelancer');
                  const isSystem = msg.sender === 'Judge';

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
                          ? 'bg-purple-755 bg-purple-700 text-white border-purple-800 rounded-tr-none' 
                          : 'bg-white text-slate-800 border-slate-200 rounded-tl-none font-sans font-medium'
                      }`}>
                        <div className={`font-mono text-[9px] font-bold ${isUser ? 'text-purple-200' : 'text-slate-450'}`}>
                          {msg.sender === 'Client' ? 'Client (Buyer)' : 'Developer (Contractor)'}
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <div className="text-right text-[8px] font-mono opacity-60">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Panel */}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Type end-to-end encrypted message..."
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
              <MessageSquare size={48} className="text-slate-300 stroke-1" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Select a Conversation</h4>
                <p className="text-xs text-slate-500 mt-1 font-mono">Choose a channel from the sidebar to start securely negotiating terms.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Contract & Actions Dashboard (3 Cols) */}
        <div className="lg:col-span-3 border-l border-slate-200 p-5 space-y-6 overflow-y-auto bg-slate-50/30">
          {activeJob ? (
            <>
              {/* Job Info Header */}
              <div className="space-y-3">
                <span className="font-mono text-[9px] font-black uppercase text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                  Active Escrow Contract
                </span>
                <div>
                  <h3 className="font-headline font-bold text-slate-900 text-sm line-clamp-2">{activeJob.title}</h3>
                  <p className="text-[10px] font-mono text-slate-450 mt-1 capitalize">Category: {activeJob.category}</p>
                </div>
              </div>

              {/* Escrow Parameters Table */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 font-mono text-xs shadow-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Safe Deposit</span>
                  <span className="font-extrabold text-emerald-700">${parseFloat(activeJob.amountUsdc).toLocaleString()} USDC</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Review Period</span>
                  <span className="font-bold text-slate-800">{activeJob.reviewPeriodDays} Days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Contract Status</span>
                  <span className={`badge-status badge-${activeJob.status.toLowerCase()}`}>
                    {activeJob.status}
                  </span>
                </div>
              </div>

              {/* Cryptographic Signature States */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-250 font-mono text-xs space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Terms Signature Status</span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span>Client Signature</span>
                    <span className={activeJob.clientAgreedTerms ? "text-emerald-600 font-extrabold" : "text-slate-400"}>
                      {activeJob.clientAgreedTerms ? "Signed ✓" : "Pending Signature"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Developer Signature</span>
                    <span className={activeJob.freelancerAgreedTerms ? "text-emerald-600 font-extrabold" : "text-slate-400"}>
                      {activeJob.freelancerAgreedTerms ? "Signed ✓" : "Pending Signature"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Escrow Direct Actions Area */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <span className="font-headline text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Interactive Escrow Actions
                </span>

                {/* 1. AGREE TO TERMS */}
                {activeJob.status === 'Selected' && (!activeJob.clientAgreedTerms || !activeJob.freelancerAgreedTerms) && (
                  <button
                    onClick={handleProposeTerms}
                    className="w-full gradient-btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <FileCheck size={14} /> Agree & Sign Terms Hash
                  </button>
                )}

                {/* 2. FUND ESCROW (CLIENT ONLY) */}
                {activeJob.status === 'Selected' && activeJob.clientAgreedTerms && activeJob.freelancerAgreedTerms && isClient && (
                  <button
                    onClick={handleFund}
                    className="w-full gradient-btn-emerald py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <DollarSign size={14} /> Fund Smart Escrow Vault
                  </button>
                )}

                {/* 3. SUBMIT DELIVERABLES (FREELANCER ONLY) */}
                {(activeJob.status === 'Selected' && activeJob.freelancerAgreedTerms && !isClient) && (
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="w-full gradient-btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <PlusCircle size={14} /> Submit Milestone Work
                  </button>
                )}

                {/* 4. RELEASE MILESTONE / PAYOUT (CLIENT ONLY) */}
                {activeJob.status === 'Submitted' && isClient && (
                  <div className="space-y-2">
                    <button
                      onClick={handleRelease}
                      className="w-full gradient-btn-emerald py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <CheckCircle2 size={14} /> Release Payout (100%)
                    </button>
                    <button
                      onClick={handleRequestRevision}
                      className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-white"
                    >
                      Request Code Revision
                    </button>
                  </div>
                )}

                {/* NO PENDING ACTIONS DISPLAY */}
                {activeJob.status === 'Completed' && (
                  <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-3.5 rounded-xl text-center font-mono text-[11px] space-y-1 font-bold">
                    <CheckCircle className="text-emerald-600 mx-auto" size={16} />
                    <p>Contract Closed & Settled</p>
                    <span className="text-[10px] text-slate-500 font-normal">All funds released dynamically.</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs font-mono">
              No conversation parameters loaded.
            </div>
          )}
        </div>
      </div>

      {/* Submission Modal inside Chat */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 font-sans text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-headline font-black text-slate-900 text-sm">Submit Work Deliverables</h4>
              <button 
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-450 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDeliverable} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-500 block">Deliverable Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Completed smart contracts & unit tests"
                  value={submitTitle}
                  onChange={(e) => setSubmitTitle(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">Description of Work</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize the changes and files implemented..."
                  value={submitDesc}
                  onChange={(e) => setSubmitDesc(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">Evidence Link (e.g. GitHub Pull Request)</label>
                <input
                  type="url"
                  placeholder="https://github.com/org/repo/pull/..."
                  value={submitLink}
                  onChange={(e) => setSubmitLink(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-650 cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-btn-primary px-5 py-2 rounded-xl text-white shadow-md cursor-pointer"
                >
                  Submit for Client Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
