import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import {
  MessageSquare, Send, ShieldCheck, Award, Scale, Building2, Briefcase,
  ExternalLink, Lock, PlusCircle, DollarSign, CheckCircle2, ArrowUpRight,
  User, Clock, Search, Sparkles, AlertCircle, FileCheck, CheckCircle, Gavel, UserCheck,
  Paperclip, Smile, MoreVertical, Copy, Shield, Download, AlertTriangle, ChevronRight, ChevronLeft, X, Zap, Trash2, Users,
  RotateCcw, UserPlus, PanelRightClose, PanelRightOpen, Info
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
    jobs, profiles, judges, judgeMessages, sendChatMessage, sendJudgeChatMessage, sendPreAcceptMessage, proposeTerms, fundJob,
    releasePayment, submitWork, requestModifications, isEnclineConnected, closeChatSession, deleteChatHistory, restoreChatHistory, addJudge
  } = usePolyLanceData();

  const [showJobDetailsSidebar, setShowJobDetailsSidebar] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showJudgeMoreMenu, setShowJudgeMoreMenu] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // 30-Second Undo Timer State
  const [undoDelete, setUndoDelete] = useState<{
    jobId?: string;
    judgeAddress?: string;
    backupMessages: any[];
    secondsLeft: number;
  } | null>(null);

  // Invite Judge Modal State
  const [isInviteJudgeModalOpen, setIsInviteJudgeModalOpen] = useState(false);
  const [newJudgeAddress, setNewJudgeAddress] = useState('');
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgeNotes, setNewJudgeNotes] = useState('');

  // 30-Second Countdown Effect
  useEffect(() => {
    if (!undoDelete) return;
    if (undoDelete.secondsLeft <= 0) {
      setUndoDelete(null);
      return;
    }
    const timer = setInterval(() => {
      setUndoDelete((prev) => (prev ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [undoDelete]);

  const handleUndoDelete = () => {
    if (!undoDelete) return;
    restoreChatHistory(undoDelete.jobId, undoDelete.backupMessages, undoDelete.judgeAddress, undoDelete.backupMessages);
    setUndoDelete(null);
  };

  const handleDeleteJobChat = (jobId: string) => {
    const target = jobs.find(j => (j.id && j.id.toLowerCase() === jobId.toLowerCase()) || (j.contractAddress && j.contractAddress.toLowerCase() === jobId.toLowerCase()));
    const backup = target?.chatMessages ? [...target.chatMessages] : [];
    deleteChatHistory(jobId);
    setUndoDelete({
      jobId,
      backupMessages: backup,
      secondsLeft: 30,
    });
  };

  const handleDeleteJudgeChat = (judgeAddr: string) => {
    const lower = judgeAddr.toLowerCase();
    const backup = judgeMessages[lower] ? [...judgeMessages[lower]] : [];
    deleteChatHistory(undefined, judgeAddr);
    setUndoDelete({
      judgeAddress: judgeAddr,
      backupMessages: backup,
      secondsLeft: 30,
    });
  };

  const handleAddJudgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudgeAddress.trim() || !newJudgeAddress.startsWith('0x')) {
      alert('Please enter a valid Ethereum/Polygon address starting with 0x.');
      return;
    }
    addJudge(
      newJudgeAddress.trim(),
      newJudgeName.trim() || `Judge ${newJudgeAddress.slice(0, 6)}...`,
      newJudgeNotes.trim(),
      address || 'Admin'
    );
    setSelectedJudgeAddr(newJudgeAddress.trim().toLowerCase());
    setChatTab('judges');
    setIsInviteJudgeModalOpen(false);
    setNewJudgeAddress('');
    setNewJudgeName('');
    setNewJudgeNotes('');
    confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
  };

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
  // ONLY show escrow chat channel to the Client or the assigned/accepted Freelancer, applied candidates, (or Admin/Judge)
  const myChats = jobs.filter(j => {
    if (isAdmin) return true; // Admin has platform governance oversight
    const lowerAddr = (address || '').toLowerCase();
    const isClient = j.client.toLowerCase() === lowerAddr;
    const isFreelancer = j.freelancer?.toLowerCase() === lowerAddr;
    const hasApplied = (j.applications || []).some(a => a.applicant.toLowerCase() === lowerAddr);
    const isJudgeOnDispute = isJudgeRole && j.status === 'Disputed';

    // Strictly limit private escrow channels to the client, accepted developer, applied candidates, or judge
    return isClient || isFreelancer || hasApplied || isJudgeOnDispute;
  });

  const isUserScrolledUpRef = useRef(false);
  const activeJobIdRef = useRef<string | null>(null);

  const activeJob = jobs.find(j => j.id === selectedJobId);
  const activeJudge = judges.find(j => j.address.toLowerCase() === (selectedJudgeAddr || '').toLowerCase());

  // Scroll listener to detect if user manually scrolled up
  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    isUserScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 80;
  };

  // Only scroll down internally in the chat feed if user is at the bottom or switching conversation channel
  useEffect(() => {
    if (activeJobIdRef.current !== selectedJobId) {
      activeJobIdRef.current = selectedJobId;
      isUserScrolledUpRef.current = false;
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    } else if (!isUserScrolledUpRef.current) {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [activeJob?.chatMessages?.length, activeJob?.preAcceptMessages?.length, selectedJudgeAddr, judgeMessages, selectedJobId]);

  const handleCopyAddress = (addrToCopy: string) => {
    navigator.clipboard.writeText(addrToCopy);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

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

    if (chatTab === 'judges' && selectedJudgeAddr) {
      const judgeSenderRole = isAdmin ? 'Admin' : 'Judge';
      sendJudgeChatMessage(selectedJudgeAddr, inputText, judgeSenderRole, address);
      setInputText('');
    } else if (activeJob) {
      const lowerAddr = (address || '').toLowerCase();
      const isClient = activeJob.client.toLowerCase() === lowerAddr || currentRole === 'client';
      const isFreelancer = (!isClient && (
        (activeJob.freelancer?.toLowerCase() === lowerAddr) ||
        (activeJob.applications || []).some(a => a.applicant.toLowerCase() === lowerAddr) ||
        currentRole === 'freelancer' ||
        (!isAdmin && !isJudgeRole)
      ));

      let jobSenderRole: 'Client' | 'Freelancer' | 'Judge' = 'Freelancer';
      if (isClient) {
        jobSenderRole = 'Client';
      } else if (isFreelancer) {
        jobSenderRole = 'Freelancer';
      } else if (isAdmin || isJudgeRole) {
        jobSenderRole = 'Judge';
      }

      if (activeJob.status === 'Open') {
        sendPreAcceptMessage(activeJob.id, inputText, address || '', jobSenderRole === 'Client' ? 'Client' : 'Freelancer');
      }
      sendChatMessage(activeJob.id, inputText, jobSenderRole);
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

  // Comprehensive Filters for Search
  const filteredJudges = judges.filter((j: JudgeRecord) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch =
      j.name?.toLowerCase().includes(q) ||
      j.address?.toLowerCase().includes(q) ||
      j.specialty?.toLowerCase().includes(q) ||
      (judgeMessages[j.address.toLowerCase()] || []).some((m: JudgeMessage) => m.text?.toLowerCase().includes(q));

    if (isAdmin) return matchesSearch;
    if (isJudgeRole) {
      return j.address.toLowerCase() === (address || '').toLowerCase() && matchesSearch;
    }
    return false;
  });

  const filteredChats = myChats.filter(j => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    // 1. Title & Description & Category & Amount & Contract Address
    if (j.title?.toLowerCase().includes(q)) return true;
    if (j.description?.toLowerCase().includes(q)) return true;
    if (j.category?.toLowerCase().includes(q)) return true;
    if (j.amountUsdc?.toString().toLowerCase().includes(q)) return true;
    if (j.contractAddress?.toLowerCase().includes(q)) return true;

    // 2. Client & Freelancer addresses
    if (j.client?.toLowerCase().includes(q)) return true;
    if (j.freelancer?.toLowerCase().includes(q)) return true;

    // 3. Counterpart Display Name, GitHub Username & Bio
    const clientKey = Object.keys(profiles).find(k => k.toLowerCase() === j.client.toLowerCase());
    const clientProfile = clientKey ? profiles[clientKey] : null;
    if (clientProfile?.displayName?.toLowerCase().includes(q)) return true;
    if (clientProfile?.githubUsername?.toLowerCase().includes(q)) return true;
    if (clientProfile?.bio?.toLowerCase().includes(q)) return true;

    const freelancerKey = j.freelancer ? Object.keys(profiles).find(k => k.toLowerCase() === j.freelancer?.toLowerCase()) : null;
    const freelancerProfile = freelancerKey ? profiles[freelancerKey] : null;
    if (freelancerProfile?.displayName?.toLowerCase().includes(q)) return true;
    if (freelancerProfile?.githubUsername?.toLowerCase().includes(q)) return true;
    if (freelancerProfile?.bio?.toLowerCase().includes(q)) return true;

    // 4. Applicants
    if (j.applications?.some(a => a.applicant.toLowerCase().includes(q) || a.proposalText?.toLowerCase().includes(q))) return true;

    // 5. Message Content in Conversation History
    const allMsgs = [...(j.chatMessages || []), ...(j.preAcceptMessages || [])];
    if (allMsgs.some(m => m.text?.toLowerCase().includes(q))) return true;

    return false;
  });



  return (
    <div className="w-full h-full flex overflow-hidden font-sans bg-white relative">

      {/* Left Side: Channels Sidebar */}
      <div className={`w-80 md:w-88 lg:w-96 shrink-0 border-r border-slate-200 flex-col h-full bg-white p-3.5 sm:p-4 space-y-3.5 overflow-hidden ${
        showMobileChannels ? 'flex absolute inset-0 z-40 bg-white' : 'hidden lg:flex'
      }`}>
          <div className="space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-sm font-black text-slate-900 flex items-center gap-2">
                <MessageSquare size={16} className="text-purple-700" /> Channels
              </h3>
              {showMobileChannels && (
                <button
                  type="button"
                  onClick={() => setShowMobileChannels(false)}
                  className="lg:hidden text-slate-400 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Icon Tab Switcher */}
            {(isAdmin || isJudgeRole) && (
              <div className="flex bg-slate-200/70 p-1 rounded-2xl gap-1 border border-slate-300/50">
                <button
                  type="button"
                  onClick={() => setChatTab('judges')}
                  className={`flex-1 py-1.5 text-center text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${chatTab === 'judges' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <Gavel size={13} /> Judges
                </button>
                <button
                  type="button"
                  onClick={() => setChatTab('jobs')}
                  className={`flex-1 py-1.5 text-center text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${chatTab === 'jobs' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <Briefcase size={13} /> Job Escrows
                </button>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                placeholder={chatTab === 'judges' ? "Search judges or address..." : "Search escrow channels, name, messages..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full !pl-8 !pr-8 !py-2 text-xs glass-input font-medium rounded-xl"
              />
              <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Clear Search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
            {chatTab === 'judges' && (isAdmin || isJudgeRole) ? (
              <>
                {/* Active Channels Section Header */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider px-1">
                    ACTIVE CHANNELS
                  </span>
                  {filteredJudges.slice(0, 1).map((j: JudgeRecord) => {
                    const isSelected = j.address.toLowerCase() === (selectedJudgeAddr || '').toLowerCase();
                    const msgs = judgeMessages[j.address.toLowerCase()] || [];
                    const lastMsg = msgs[msgs.length - 1];

                    return (
                      <button
                        key={j.address}
                        onClick={() => { setSelectedJudgeAddr(j.address); setChatTab('judges'); }}
                        className={`w-full p-3 rounded-2xl text-left transition-all border flex items-start gap-3 cursor-pointer ${isSelected
                            ? 'bg-purple-700 text-white border-purple-800 shadow-md font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${isSelected ? 'bg-purple-100 text-purple-900' : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                          {j.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start">
                            <span className={`font-extrabold text-xs truncate max-w-[110px] ${isSelected ? 'text-white' : 'text-slate-900'}`} style={isSelected ? { color: '#FFFFFF' } : undefined}>
                              {j.name}
                            </span>
                            <span className={`text-[9px] font-mono shrink-0 px-1.5 py-0.5 rounded ${isSelected
                                ? 'bg-purple-900 text-white font-bold'
                                : j.status === 'Active' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                              }`}>
                              {j.status}
                            </span>
                          </div>
                          <p className={`text-[10px] truncate font-mono mt-0.5 ${isSelected ? 'text-purple-100' : 'text-slate-500'}`} style={isSelected ? { color: '#F3E8FF' } : undefined}>
                            {truncateAddress(j.address)}
                          </p>
                          <div className="flex justify-between items-center mt-1">
                            <p className={`text-[9px] truncate font-mono ${isSelected ? 'text-white font-bold' : 'text-slate-400'}`} style={isSelected ? { color: '#FFFFFF' } : undefined}>
                              {lastMsg ? `${lastMsg.senderRole}: ${lastMsg.text}` : 'Admin: hi'}
                            </p>
                            <span className="bg-purple-900 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                              {msgs.length || 2}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Other Judges Section Header */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider px-1">
                    OTHER JUDGES
                  </span>
                  {filteredJudges.slice(1).map((j: JudgeRecord, idx) => {
                    const isSelected = j.address.toLowerCase() === (selectedJudgeAddr || '').toLowerCase();
                    const dates = ['Yesterday', '2d ago', '5d ago'];

                    return (
                      <button
                        key={j.address}
                        onClick={() => { setSelectedJudgeAddr(j.address); setChatTab('judges'); }}
                        className={`w-full p-2.5 rounded-2xl text-left transition-all border flex items-center gap-3 cursor-pointer ${isSelected
                            ? 'bg-purple-700 text-white border-purple-800 shadow-md font-bold'
                            : 'bg-white text-slate-700 border-slate-150 hover:bg-slate-50'
                          }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                          {j.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs truncate text-slate-900">{j.name}</span>
                            <span className="text-[9px] font-mono text-slate-400">{dates[idx % dates.length]}</span>
                          </div>
                          <p className="text-[9.5px] truncate font-mono text-slate-400 mt-0.5">
                            {truncateAddress(j.address)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Escrow Job Channels Section */
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider px-1">
                  ACTIVE ESCROW CHANNELS
                </span>
                {filteredChats.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium space-y-1">
                    <p className="font-bold text-slate-600">
                      {searchQuery ? 'No matching escrow channels' : 'No active escrow channels found'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {searchQuery ? 'Try searching by title, user name, address, or message text.' : 'Post a job or submit a proposal to start chatting.'}
                    </p>
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
                        className={`w-full p-3 rounded-2xl text-left transition-all border flex items-start gap-3 cursor-pointer ${jobIsSelected
                            ? 'bg-purple-700 text-white border-purple-800 shadow-md font-bold'
                            : 'bg-white text-slate-700 border-slate-150 hover:bg-slate-50'
                          }`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${jobIsSelected ? 'bg-purple-100 text-purple-900' : 'bg-slate-100 text-slate-700 border border-slate-200'
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
                )}
              </div>
            )}
          </div>

          {/* Bottom Sidebar Action */}
          <div className="pt-2 border-t border-slate-200 shrink-0">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setIsInviteJudgeModalOpen(true)}
                className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 text-purple-700 font-bold py-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-xs shadow-xs transition-all cursor-pointer"
              >
                <UserPlus size={14} className="text-purple-600" /> Invite / Appoint Judge
              </button>
            ) : (
              <Link
                to="/jobs/post"
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-purple-700 font-bold py-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-xs shadow-xs transition-all"
              >
                <PlusCircle size={14} /> Post Escrow Job
              </Link>
            )}
          </div>
        </div>

        {/* Center: Live Messenger Feed - WhatsApp Web Style (Full Width & Height) */}
        <div className="flex-1 min-w-0 flex flex-col h-full bg-[#f8fafc] overflow-hidden relative">
          {chatTab === 'judges' && (isAdmin || isJudgeRole) ? (
            /* Admin Chat Window with Selected Judge */
            activeJudge ? (
              <>
                {/* Header Bar */}
                <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Circle Avatar with green status dot */}
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-600 text-white font-extrabold flex items-center justify-center text-xs uppercase shadow-xs ring-2 ring-purple-100">
                        {activeJudge.name.slice(0, 2)}
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white absolute -bottom-0.5 -right-0.5 shadow-xs" />
                    </div>

                    {/* Header Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-headline font-black text-slate-900 text-sm sm:text-[15px] leading-tight truncate">
                          {activeJudge.name}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-mono font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.2 rounded-full shrink-0">
                          <Shield size={9} className="text-purple-600" />
                          PRIMARY ARBITRATOR
                        </span>
                      </div>

                      {/* Subtitle & Address Pill */}
                      <div className="flex items-center gap-2 text-xs mt-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-slate-500 font-medium shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Encrypted Channel</span>
                        </div>
                        <span className="text-slate-300 text-[10px] shrink-0">•</span>
                        <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-1.5 py-0.5 rounded-md text-[10.5px] font-mono text-slate-600 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyAddress(activeJudge.address)}
                            className="hover:text-purple-700 cursor-pointer flex items-center gap-1"
                            title="Copy Address"
                          >
                            <Copy size={9} className="text-slate-400 hover:text-purple-600" />
                            <span>{truncateAddress(activeJudge.address)}</span>
                          </button>
                          {copiedAddr && <span className="text-[8px] text-emerald-600 font-bold">Copied!</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Admin Only: Manage Judges button */}
                    {isAdmin && (
                      <Link
                        to="/judge"
                        className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-[11px] font-bold font-mono transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer leading-none"
                      >
                        <Users size={12} className="text-purple-600 shrink-0" /> Manage Judges <ArrowUpRight size={11} className="shrink-0" />
                      </Link>
                    )}

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowJudgeMoreMenu(!showJudgeMoreMenu)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {showJudgeMoreMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1 font-sans">
                          <button
                            type="button"
                            onClick={() => {
                              setShowJudgeMoreMenu(false);
                              setDeleteConfirmModal({
                                isOpen: true,
                                title: 'Delete Judge Chat History',
                                description: 'Are you sure you want to delete this arbitrator chat history? You will have 30 seconds to undo this action.',
                                onConfirm: () => handleDeleteJudgeChat(activeJudge.address)
                              });
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                          >
                            <Trash2 size={14} /> Delete Chat History
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Toggle Specs Panel Button */}
                    <button
                      type="button"
                      onClick={() => setShowJobDetailsSidebar(!showJobDetailsSidebar)}
                      className={`px-2 py-1 rounded-lg border text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        showJobDetailsSidebar
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                      title={showJobDetailsSidebar ? "Hide Details Panel" : "Show Details Panel"}
                    >
                      {showJobDetailsSidebar ? <PanelRightClose size={13} className="text-purple-700" /> : <PanelRightOpen size={13} className="text-slate-500" />}
                      <span className="text-[11px] leading-none">{showJobDetailsSidebar ? 'Hide Specs' : 'Show Specs'}</span>
                    </button>
                  </div>
                </div>

                {/* Dedicated Action Button Bar */}
                <div className="px-4 py-2 border-b border-slate-100 bg-white/60 flex items-center justify-start gap-2 shrink-0 flex-wrap">
                  {(isAdmin || (activeJob && activeJob.client.toLowerCase() === (address || '').toLowerCase())) && (
                    <button
                      type="button"
                      onClick={handleRelease}
                      className="bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-300 text-emerald-800 font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[10.5px] shadow-2xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      Approve Payment
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const reason = prompt('State the dispute reason:');
                      if (reason) {
                        const targetId = activeJob ? activeJob.id : selectedJudgeAddr;
                        if (targetId) {
                          sendChatMessage(targetId, `⚠️ Dispute Raised: ${reason}`, 'Judge');
                        }
                      }
                    }}
                    className="bg-rose-50/70 hover:bg-rose-100/70 border border-rose-300 text-rose-800 font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[10.5px] shadow-2xs transition-all cursor-pointer"
                  >
                    <AlertTriangle size={13} className="text-rose-600" />
                    Raise Issue
                  </button>

                  {activeJob ? (
                    <Link
                      to={`/jobs/${activeJob.id}`}
                      className="bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 text-purple-700 font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[10.5px] shadow-2xs transition-all cursor-pointer"
                    >
                      Job Details <ArrowUpRight size={12} className="text-purple-600" />
                    </Link>
                  ) : (
                    <Link
                      to="/dao"
                      className="bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 text-purple-700 font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[10.5px] shadow-2xs transition-all cursor-pointer"
                    >
                      DAO Court <ArrowUpRight size={12} className="text-purple-600" />
                    </Link>
                  )}
                </div>

                {/* Messages List Area */}
                <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white/40 min-h-0">
                  {(() => {
                    const currentJudgeMsgs = (selectedJudgeAddr && judgeMessages[selectedJudgeAddr.toLowerCase()]) || [];
                    if (currentJudgeMsgs.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 px-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center shadow-inner">
                            <MessageSquare size={22} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-slate-800">Arbitrator Chat Cleared</h4>
                            <p className="text-xs text-slate-500 max-w-xs">All messages have been cleared. Send a new message below to begin chatting.</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* Today Date Pill */}
                        <div className="flex justify-center my-2">
                          <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-mono font-bold px-3 py-0.5 rounded-full">
                            Today
                          </span>
                        </div>

                        {currentJudgeMsgs.map((msg: JudgeMessage) => {
                          const isMe = isAdmin ? msg.senderRole === 'Admin' : msg.senderRole === 'Judge';

                          return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-start gap-2.5`}>
                              {!isMe && (
                                <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-xs mt-1">
                                  {isAdmin ? activeJudge.name.slice(0, 2) : 'AD'}
                                </div>
                              )}
                              <div className="max-w-md space-y-1">
                                <div className={`font-mono text-[10px] font-bold px-1 ${isMe ? 'text-right text-purple-700' : 'text-purple-700'}`}>
                                  {msg.senderRole === 'Admin' ? 'Admin Governance' : activeJudge.name}
                                </div>
                                <div className={`p-3.5 rounded-2xl border text-xs shadow-xs ${isMe
                                    ? 'bg-purple-50/90 border-purple-200 text-slate-900 rounded-tr-none'
                                    : 'bg-white border-slate-200 text-slate-800 rounded-tl-none font-medium'
                                  }`}>
                                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                  <div className={`text-right text-[8px] font-mono mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-purple-600 font-bold' : 'text-slate-400'}`}>
                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {isMe && <span className="text-purple-600 text-[10px]">✓✓</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}

                  {/* No more messages divider */}
                  <div className="flex items-center justify-center gap-2 my-4 pt-2">
                    <div className="h-px bg-slate-200 w-16" />
                    <span className="text-[10px] font-mono text-slate-400">No more messages</span>
                    <div className="h-px bg-slate-200 w-16" />
                  </div>

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Panel matching Reference Image */}
                <div className="p-4 border-t border-slate-200 bg-white shrink-0 space-y-2">
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center glass-input rounded-2xl px-3 py-1.5 bg-slate-50 border border-slate-200 shadow-inner">
                      <button type="button" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                        <Paperclip size={16} />
                      </button>
                      <input
                        type="text"
                        placeholder={`Message ${activeJudge.name}...`}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-xs font-semibold px-2 py-1.5 text-slate-800 placeholder-slate-400"
                      />
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer flex items-center justify-center"
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
                    </div>

                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Send size={14} /> Send
                    </button>
                  </form>

                  <div className="text-center">
                    <span className="text-[9.5px] font-mono text-slate-400 flex items-center justify-center gap-1">
                      <Shield size={11} className="text-purple-600" /> Messages are end-to-end encrypted via XMTP
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-8 text-slate-400 space-y-3">
                <UserCheck size={48} className="text-purple-600 stroke-1" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Select a Judge Channel</h4>
                  <p className="text-xs text-slate-500 mt-1 font-mono">Choose an arbitrator from the left panel to open direct communications.</p>
                </div>
              </div>
            )
          ) : (
            /* Job Escrow Chat Window */
            activeJob ? (
              <>
                {/* Header Bar */}
                <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setSelectedJobId(null)}
                      className="md:hidden p-1 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                      title="Back to conversation list"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    {/* Circle Avatar with status ring */}
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-600 text-white font-extrabold flex items-center justify-center text-xs uppercase shadow-xs ring-2 ring-purple-100">
                        {(activeJob.client.toLowerCase() === (address || '').toLowerCase() ? (activeJob.freelancer || 'Dev') : 'Client').slice(0, 2)}
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5 shadow-xs ${
                        activeJob.status === 'Completed' ? 'bg-purple-500' : 'bg-emerald-400'
                      }`} />
                    </div>

                    {/* Header Info */}
                    <div className="min-w-0 flex-1">
                      {/* Main Title - compact single line / clean truncate */}
                      <h4 className="font-headline font-black text-slate-900 text-sm sm:text-[15px] leading-tight truncate" title={activeJob.title}>
                        {activeJob.title}
                      </h4>

                      {/* Clean Single-line Subtitle & Address Pill */}
                      <div className="flex items-center gap-2 text-xs mt-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-slate-500 font-medium shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Encrypted Channel</span>
                        </div>

                        {(activeJob.contractAddress || activeJob.client) && (
                          <>
                            <span className="text-slate-300 text-[10px] shrink-0">•</span>
                            <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-1.5 py-0.5 rounded-md text-[10.5px] font-mono text-slate-600 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCopyAddress(activeJob.contractAddress || activeJob.client)}
                                className="hover:text-purple-700 cursor-pointer flex items-center gap-1"
                                title="Copy Address"
                              >
                                <Copy size={9} className="text-slate-400 hover:text-purple-600" />
                                <span>{truncateAddress(activeJob.contractAddress || activeJob.client)}</span>
                              </button>
                              {copiedAddr && <span className="text-[8px] text-emerald-600 font-bold">Copied!</span>}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Job Details Button */}
                    <Link
                      to={`/jobs/${activeJob.id}`}
                      className="whitespace-nowrap shrink-0 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[11px] shadow-2xs transition-all cursor-pointer leading-none"
                      title="View full job details & milestones"
                    >
                      <span>Job Details</span>
                      <ArrowUpRight size={11} className="text-purple-600 shrink-0" />
                    </Link>

                    {/* Raise Issue Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const reason = prompt('State the dispute reason:');
                        if (reason && activeJob) {
                          sendChatMessage(activeJob.id, `⚠️ Dispute Raised: ${reason}`, 'Judge');
                        }
                      }}
                      className="whitespace-nowrap shrink-0 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[11px] shadow-2xs transition-all cursor-pointer leading-none"
                      title="Raise an arbitrator dispute / issue"
                    >
                      <AlertTriangle size={11} className="text-rose-600 shrink-0" />
                      <span>Raise Issue</span>
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                        title="Chat Options"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {showMoreMenu && (
                        <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 font-sans">
                          <button
                            type="button"
                            onClick={() => {
                              setShowMoreMenu(false);
                              setDeleteConfirmModal({
                                isOpen: true,
                                title: 'Delete Job Chat History',
                                description: 'Are you sure you want to delete this job chat history? You will have 30 seconds to undo this action.',
                                onConfirm: () => handleDeleteJobChat(activeJob.id)
                              });
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                          >
                            <Trash2 size={13} /> Delete Chat History
                          </button>
                          <div className="px-4 py-1.5 text-[9.5px] font-mono text-slate-400 border-t border-slate-100">
                            Completed chats auto-delete after 7 days
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Toggle Job Specs Panel Button */}
                    <button
                      type="button"
                      onClick={() => setShowJobDetailsSidebar(!showJobDetailsSidebar)}
                      className={`px-2 py-1 rounded-lg border text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        showJobDetailsSidebar
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                      title={showJobDetailsSidebar ? "Hide Details Panel" : "Show Details Panel"}
                    >
                      {showJobDetailsSidebar ? <PanelRightClose size={13} className="text-purple-700" /> : <PanelRightOpen size={13} className="text-slate-500" />}
                      <span className="text-[11px] leading-none">{showJobDetailsSidebar ? 'Hide Specs' : 'Show Specs'}</span>
                    </button>
                  </div>
                </div>

                {/* Compact Dedicated Action Button Bar */}
                <div className="px-4 py-2 border-b border-slate-100 bg-white/60 flex items-center justify-start gap-2 shrink-0 flex-wrap">
                  {(() => {
                    const isClient = activeJob.client.toLowerCase() === (address || '').toLowerCase() || currentRole === 'client';
                    const isFreelancer = (!isClient && activeJob.freelancer?.toLowerCase() === (address || '').toLowerCase()) || currentRole === 'freelancer';

                    return (
                      <>
                        {/* Escrow & Net Amount Badge */}
                        <div className="bg-slate-100/90 border border-slate-200 text-slate-800 font-mono py-1 px-2.5 rounded-lg flex items-center gap-1.5 text-[10.5px]">
                          <span className="font-bold text-slate-600">Escrow:</span>
                          <strong className="text-slate-900">${parseFloat(activeJob.amountUsdc || '0').toLocaleString()} USDC</strong>
                          <span className="text-slate-400">•</span>
                          <span className="text-purple-700 font-bold">Net: ${(parseFloat(activeJob.amountUsdc || '0') * 0.975).toFixed(2)} USDC</span>
                        </div>

                        {/* CLIENT ACTIONS */}
                        {isClient && (
                          <>
                            {(activeJob.status === 'Submitted' || (activeJob.status as string) === 'Funded') ? (
                              <button
                                type="button"
                                onClick={handleRelease}
                                className="bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-300 text-emerald-800 font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[10.5px] shadow-2xs transition-all cursor-pointer"
                              >
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                Approve Payment
                              </button>
                            ) : (activeJob.status === 'Selected' || (activeJob.status as string) === 'TermsAgreed') ? (
                              <button
                                type="button"
                                onClick={handleFund}
                                className="bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-300 text-emerald-800 font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[10.5px] shadow-2xs transition-all cursor-pointer"
                              >
                                <DollarSign size={13} className="text-emerald-600" />
                                Fund Escrow
                              </button>
                            ) : activeJob.status === 'Completed' ? (
                              <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-800 font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[10.5px]">
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                Escrow Completed
                              </div>
                            ) : null}
                          </>
                        )}

                        {/* FREELANCER ACTIONS (NEVER SHOWS APPROVE PAYMENT) */}
                        {isFreelancer && (
                          <>
                            {activeJob.status === 'Selected' && !activeJob.freelancerAgreedTerms ? (
                              <button
                                type="button"
                                onClick={handleProposeTerms}
                                className="bg-purple-50/70 hover:bg-purple-100/70 border border-purple-300 text-purple-800 font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[10.5px] shadow-2xs transition-all cursor-pointer"
                              >
                                <CheckCircle2 size={13} className="text-purple-600" />
                                Accept Terms
                              </button>
                            ) : (activeJob.status === 'Funded' || activeJob.status === 'Selected') ? (
                              <button
                                type="button"
                                onClick={() => setIsSubmitModalOpen(true)}
                                className="bg-blue-50/70 hover:bg-blue-100/70 border border-blue-300 text-blue-800 font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[10.5px] shadow-2xs transition-all cursor-pointer"
                              >
                                <PlusCircle size={13} className="text-blue-600" />
                                Submit Deliverable
                              </button>
                            ) : activeJob.status === 'Submitted' ? (
                              <div className="bg-blue-50/70 border border-blue-200 text-blue-800 font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[10.5px]">
                                <Clock size={13} className="text-blue-600" />
                                Under Review
                              </div>
                            ) : activeJob.status === 'Completed' ? (
                              <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-800 font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[10.5px]">
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                Payout Released
                              </div>
                            ) : null}
                          </>
                        )}

                        {/* Spectator or non-client non-freelancer */}
                        {!isClient && !isFreelancer && (
                          <div className="bg-purple-50/70 border border-purple-200 text-purple-800 font-bold py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[10.5px]">
                            <Shield size={13} className="text-purple-600" />
                            Status: {activeJob.status}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Messages Feed with Scroll Listener */}
                <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white/40 min-h-0">
                  {(() => {
                    const rawJobMessages = activeJob.chatMessages !== undefined 
                      ? activeJob.chatMessages 
                      : [
                          { sender: 'Client' as const, text: 'Welcome! Let us coordinate milestone specifications and delivery targets.', timestamp: activeJob.createdAt || Date.now() - 3600000 }
                        ];
                    const jobMessages = rawJobMessages.filter(
                      (m) => !activeJob.chatClearedAt || (m.timestamp || 0) > activeJob.chatClearedAt
                    );

                    if (jobMessages.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 px-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center shadow-inner">
                            <MessageSquare size={22} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-slate-800">Chat History Cleared</h4>
                            <p className="text-xs text-slate-500 max-w-xs">All prior messages have been cleared. Send a new message below to begin chatting.</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* Today Date Pill */}
                        <div className="flex justify-center my-2">
                          <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-mono font-bold px-3 py-0.5 rounded-full">
                            Today
                          </span>
                        </div>

                        {jobMessages.map((msg, index) => {
                          const lowerAddr = (address || '').toLowerCase();
                          const isClient = activeJob.client.toLowerCase() === lowerAddr || currentRole === 'client';
                          const isFreelancer = (!isClient && (
                            (activeJob.freelancer?.toLowerCase() === lowerAddr) ||
                            (activeJob.applications || []).some(a => a.applicant.toLowerCase() === lowerAddr) ||
                            currentRole === 'freelancer' ||
                            (!isAdmin && !isJudgeRole)
                          ));

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
                                <div className="bg-purple-50 border border-purple-200 text-purple-900 rounded-xl px-4 py-1.5 text-[10px] font-mono font-bold flex items-center gap-1.5">
                                  <Lock size={12} className="text-purple-700" />
                                  {msg.text}
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
                                <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-xs mt-1">
                                  {msg.sender.slice(0, 2)}
                                </div>
                              )}
                              <div className="max-w-md space-y-1">
                                <div className={`font-mono text-[10px] font-bold px-1 ${isUser ? 'text-right text-purple-700' : 'text-purple-700'}`}>
                                  {msg.sender}
                                </div>
                                <div className={`p-3.5 rounded-2xl border text-xs shadow-xs ${isUser
                                    ? 'bg-purple-50/90 border-purple-200 text-slate-900 rounded-tr-none'
                                    : 'bg-white border-slate-200 text-slate-800 rounded-tl-none font-medium'
                                  }`}>
                                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                  <div className={`text-right text-[8px] font-mono mt-1 flex items-center justify-end gap-1 ${isUser ? 'text-purple-600 font-bold' : 'text-slate-400'}`}>
                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {isUser && <span className="text-purple-600 text-[10px]">✓✓</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Panel */}
                <div className="p-4 border-t border-slate-200 bg-white shrink-0 space-y-2">
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center glass-input rounded-2xl px-3 py-1.5 bg-slate-50 border border-slate-200 shadow-inner">
                      <button type="button" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                        <Paperclip size={16} />
                      </button>
                      <input
                        type="text"
                        placeholder="Message client or developer..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-xs font-semibold px-2 py-1.5 text-slate-800 placeholder-slate-400"
                      />
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer flex items-center justify-center"
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
                    </div>

                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Send size={14} /> Send
                    </button>
                  </form>

                  <div className="text-center">
                    <span className="text-[9.5px] font-mono text-slate-400 flex items-center justify-center gap-1">
                      <Shield size={11} className="text-purple-600" /> Messages are end-to-end encrypted via XMTP Peer-to-Peer Protocol
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shadow-inner">
                  <MessageSquare size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Select a Conversation</h4>
                  <p className="text-xs text-slate-500 mt-1 font-mono max-w-xs">Choose a job or freelancer from the left panel to start messaging.</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Right Side: Escrow / Arbitrator Summary Panel (Slide Toggleable) */}
        <div
          className={`transition-all duration-300 ease-in-out shrink-0 border-slate-200 bg-white flex flex-col h-full overflow-hidden ${
            showJobDetailsSidebar && (activeJob || activeJudge)
              ? 'w-80 lg:w-88 border-l opacity-100'
              : 'w-0 border-l-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="w-80 lg:w-88 flex flex-col justify-start h-full p-5 space-y-4 overflow-y-auto shrink-0">
            {activeJob ? (
              <>
                {/* Top Status Pill */}
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[9.5px] font-mono font-bold uppercase tracking-wider text-purple-900 bg-purple-100 border border-purple-200 px-3 py-0.5 rounded-full">
                    <CheckCircle2 size={12} className="text-purple-700" />
                    {activeJob.status === 'Completed' ? 'COMPLETED ESCROW' : `${activeJob.status.toUpperCase()} ESCROW`}
                  </span>
                  <h3 className="font-headline font-extrabold text-slate-900 text-sm mt-3 leading-snug">
                    {activeJob.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-sans mt-1 leading-snug line-clamp-2">
                    {activeJob.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => alert(activeJob.description)}
                    className="text-xs text-purple-700 hover:text-purple-900 font-bold mt-1 cursor-pointer hover:underline block"
                  >
                    View More
                  </button>
                </div>

                {/* Locked Vault Deposit Card */}
                <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[9.5px] uppercase font-mono text-slate-500 font-bold block tracking-wider">
                    LOCKED VAULT DEPOSIT
                  </span>
                  <div className="font-mono font-black text-slate-900 text-xl flex items-center justify-between">
                    <span>${parseFloat(activeJob.amountUsdc || '10.00').toFixed(2)} <span className="text-xs text-slate-500 font-normal">USDC</span></span>
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      $
                    </div>
                  </div>
                </div>

                {/* Smart Contract Actions */}
                <div className="space-y-2.5 pt-1 border-t border-slate-100">
                  <span className="text-[9.5px] uppercase font-mono text-slate-400 font-bold block tracking-wider">
                    SMART CONTRACT ACTIONS
                  </span>

                  {/* Smart Escrow Card */}
                  <div className="bg-gradient-to-br from-purple-50/90 to-indigo-50/90 border border-purple-200/90 p-3 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Lock size={13} className="text-purple-600" /> Smart Escrow
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                        ON-CHAIN
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono leading-tight">
                      Funds locked in audited escrow vault:
                    </p>
                    <div className="flex items-center gap-1.5 bg-white/80 border border-purple-200 px-2.5 py-1 rounded-xl text-[10.5px] font-mono text-purple-950 font-bold">
                      <button
                        type="button"
                        onClick={() => handleCopyAddress(activeJob.contractAddress || activeJob.client)}
                        className="hover:text-purple-700 cursor-pointer flex items-center gap-1.5 w-full justify-between"
                        title="Copy Escrow Address"
                      >
                        <span className="truncate">{truncateAddress(activeJob.contractAddress || activeJob.client)}</span>
                        <Copy size={11} className="text-purple-600 shrink-0" />
                      </button>
                    </div>
                  </div>

                  {/* Dispute Notice */}
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl space-y-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Scale size={13} className="text-slate-700" /> Decentralized Arbitration
                    </span>
                    <p className="text-[10.5px] text-slate-500 font-mono leading-tight">
                      If terms are disputed, certified judges assess on-chain evidence with 24h SLA.
                    </p>
                  </div>

                  {/* Job Overview Link */}
                  <Link
                    to={`/jobs/${activeJob.id}`}
                    className="flex items-center justify-between p-3 rounded-2xl border border-amber-200/80 bg-amber-50/50 hover:bg-amber-100/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Download size={14} />
                      </div>
                      <div>
                        <p className="font-bold text-amber-950 text-xs">Job Overview</p>
                        <p className="text-[10px] text-slate-500 font-mono">View contract milestones</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </>
            ) : activeJudge ? (
              <div className="space-y-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[9.5px] font-mono font-bold uppercase tracking-wider text-purple-900 bg-purple-100 border border-purple-200 px-3 py-0.5 rounded-full">
                    <Gavel size={12} className="text-purple-700" />
                    ARBITRATOR PROFILE
                  </span>
                  <h3 className="font-headline font-extrabold text-slate-900 text-base mt-3 leading-snug">
                    {activeJudge.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-sans mt-1 leading-snug">
                    {activeJudge.specialty || 'Decentralized Dispute Resolution Specialist'}
                  </p>
                </div>
                <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-2xl space-y-2">
                  <span className="text-[9.5px] uppercase font-mono text-slate-500 font-bold block tracking-wider">
                    VERIFIED CREDENTIALS
                  </span>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600">Cases Resolved</span>
                    <span className="font-bold text-slate-900">{activeJudge.casesResolved ?? 8}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600">Avg Resolution</span>
                    <span className="font-bold text-emerald-600">{activeJudge.avgResolutionTime || '< 24 Hours'}</span>
                  </div>
                </div>
              </div>
            ) : null}
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

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-rose-100 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 size={26} />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-headline font-black text-slate-900 text-base">
                {deleteConfirmModal.title}
              </h3>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                {deleteConfirmModal.description}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteConfirmModal.onConfirm();
                  setDeleteConfirmModal(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Delete (30s Undo)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 30-Second Floating Undo Delete Banner */}
      {undoDelete && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-slide-up backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-mono font-bold text-xs">
              {undoDelete.secondsLeft}s
            </div>
            <div>
              <p className="font-bold text-xs text-white">Chat history deleted</p>
              <p className="text-[11px] text-slate-400">Click undo within {undoDelete.secondsLeft}s to restore your messages</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105"
          >
            <RotateCcw size={13} />
            <span>Undo ({undoDelete.secondsLeft}s)</span>
          </button>
        </div>
      )}

      {/* Invite / Appoint Judge Modal for Admins */}
      {isInviteJudgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-purple-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-headline">
                    Appoint Protocol Arbitrator
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Authorize a new Judge address for DAO dispute arbitration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteJudgeModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddJudgeSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[9.5px] tracking-wider">
                  Judge Ethereum / Polygon Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={newJudgeAddress}
                  onChange={(e) => setNewJudgeAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold">Quick Presets:</span>
                  {[
                    { label: 'Judge Candidate 1', addr: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc' },
                    { label: 'Judge Candidate 2', addr: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewJudgeAddress(p.addr);
                        setNewJudgeName(p.label);
                        setNewJudgeNotes('Accredited DeFi & smart contract auditor.');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-mono text-[9.5px] cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[9.5px] tracking-wider">
                  Judge Display Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arbitrator Elena Vance"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-sans text-xs focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[9.5px] tracking-wider">
                  Arbitration Specialization & Governance Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Smart Contract Security, DeFi protocols, Zero-Knowledge proofs..."
                  value={newJudgeNotes}
                  onChange={(e) => setNewJudgeNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-sans text-xs focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteJudgeModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-md cursor-pointer transition-all hover:scale-105"
                >
                  Appoint & Authorize Judge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
