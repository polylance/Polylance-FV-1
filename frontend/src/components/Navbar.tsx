import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { PolyLanceLogo } from './PolyLanceLogo';
import { LoginModal } from './LoginModal';
import { 
  Briefcase, 
  PlusCircle, 
  LayoutDashboard, 
  Scale, 
  Lock, 
  BarChart3, 
  User, 
  Users, 
  Award, 
  LogIn, 
  Shield, 
  ChevronDown, 
  MessageSquare,
  Menu,
  X,
  Landmark,
  Trophy,
  Settings,
  Beaker,
  Grid,
  ChevronRight
} from 'lucide-react';
import { truncateAddress } from '../utils/formatters';

export const Navbar: React.FC = () => {
  const { isConnected, address, currentRole, isArbitrator, isTreasuryAdmin, disconnectWallet } = useWeb3();
  const location = useLocation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const moreRef = React.useRef<HTMLDivElement>(null);
  const mobileMoreRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
      if (mobileMoreRef.current && !mobileMoreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const isVisitor = !isConnected || currentRole === 'visitor';

  return (
    <>
      <nav className="glass-panel sticky top-0 z-40 border-x-0 rounded-none border-t-0 bg-white/95 border-b border-slate-200 shadow-xs px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo with 3D Hexagon P Icon */}
          <Link to="/" className="flex items-center gap-3.5 group shrink-0">
            <PolyLanceLogo size={40} className="group-hover:scale-105 transition-transform" />
            <div className="flex items-center">
              <span className="font-black text-2xl sm:text-3xl tracking-tight text-slate-900 font-heading">
                Poly<span className="text-purple-700">Lance</span>
              </span>
              <span className="ml-2.5 text-[10px] font-mono text-purple-900 font-extrabold bg-purple-100 px-2 py-0.5 rounded-md border border-purple-300 whitespace-nowrap inline-block shrink-0 shadow-2xs">
                MVP ON-CHAIN
              </span>
            </div>
          </Link>

          {/* DYNAMIC ROLE-PERCEPTION NAVIGATION LINKS */}
          {(currentRole as string) !== 'admin' ? (
            <div className="hidden md:flex items-center gap-1.5 font-sans">
              {/* 1. PUBLIC VISITOR PERCEPTION */}
              {isVisitor ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/') && location.pathname === '/'
                        ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-semibold'
                      }`}
                  >
                    <Shield size={14} />
                    Overview
                  </Link>

                  <Link
                    to="/jobs"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/jobs')
                        ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                        : 'text-slate-700 hover:text-slate-955 hover:bg-slate-100 font-semibold'
                      }`}
                  >
                    <Briefcase size={14} />
                    Marketplace
                  </Link>

                  <Link
                    to="/reputation"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/reputation')
                        ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                        : 'text-slate-700 hover:text-slate-955 hover:bg-slate-100 font-semibold'
                      }`}
                  >
                    <Award size={14} />
                    Leaderboard
                  </Link>
                </div>
              ) : (
                <>
                  {/* 2. COMMON SECTIONS (Marketplace & Leaderboard) */}
                  {currentRole !== 'client' && (
                    <>
                      <Link
                        to="/jobs"
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/jobs') && !isActive('/jobs/post')
                            ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                            : 'text-slate-700 hover:text-slate-955 hover:bg-slate-100 font-semibold'
                          }`}
                      >
                        <Briefcase size={14} />
                        Find Jobs
                      </Link>

                      <Link
                        to="/reputation"
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/reputation')
                            ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                            : 'text-slate-700 hover:text-slate-955 hover:bg-slate-100 font-semibold'
                          }`}
                      >
                        <Award size={14} />
                        SBT Leaderboard
                      </Link>
                    </>
                  )}

                  {/* 3. CLIENT PERCEPTION */}
                  {currentRole === 'client' && (
                    <Link
                      to="/jobs/post"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/jobs/post')
                          ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                          : 'text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-bold'
                        }`}
                    >
                      <PlusCircle size={14} />
                      Post Job Escrow
                    </Link>
                  )}

                  {/* 4. DASHBOARD (MY WORK / CLIENT ESCROWS) */}
                  {(currentRole === 'client' || currentRole === 'freelancer') && (
                    <Link
                      to="/dashboard"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/dashboard')
                          ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                          : 'text-slate-700 hover:text-slate-955 hover:bg-slate-100 font-semibold'
                        }`}
                    >
                      <LayoutDashboard size={14} />
                      {currentRole === 'client' ? 'Client Escrows' : 'My Dashboard'}
                    </Link>
                  )}

                  {/* 5. JUDGE PANEL (JUDGE PERCEPTION) */}
                  {(isArbitrator || currentRole === 'judge') && (
                    <Link
                      to="/judge"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/judge')
                          ? 'bg-amber-600 text-white font-extrabold shadow-sm'
                          : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-bold'
                        }`}
                    >
                      <Scale size={14} />
                      Judge Panel
                    </Link>
                  )}

                  {/* 6. TREASURY ADMIN (ADMIN PERCEPTION) */}
                  {(isTreasuryAdmin || (currentRole as string) === 'admin') && (
                    <Link
                      to="/treasury"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/treasury')
                          ? 'bg-emerald-700 text-white font-extrabold shadow-sm'
                          : 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold'
                        }`}
                    >
                      <Lock size={14} />
                      Treasury Admin
                    </Link>
                  )}

                  {/* 7. DAO GOVERNANCE */}
                  <Link
                    to="/dao"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/dao')
                        ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                        : 'text-slate-700 hover:text-slate-955 hover:bg-slate-100 font-semibold'
                      }`}
                  >
                    <Award size={14} />
                    DAO
                  </Link>

                  {/* 7.5 MESSAGES */}
                  {!isVisitor && (
                    <Link
                      to="/chat"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/chat')
                          ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                          : 'text-slate-700 hover:text-slate-955 hover:bg-slate-100 font-semibold'
                        }`}
                    >
                      <MessageSquare size={14} />
                      Messages
                    </Link>
                  )}

                  {/* 8. ANALYTICS */}
                  {currentRole !== 'judge' && (
                    <Link
                      to="/analytics"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/analytics')
                          ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                          : 'text-slate-700 hover:text-slate-955 hover:bg-slate-100 font-semibold'
                        }`}
                    >
                      <BarChart3 size={14} />
                      Analytics
                    </Link>
                  )}

                  {/* 9. ADMIN SANDBOX TOGGLE */}
                  {(currentRole as string) === 'admin' && (
                    <div className="relative">
                      <button
                        onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-955 hover:bg-slate-100 flex items-center gap-1 cursor-pointer font-sans"
                      >
                        Admin Sandbox <ChevronDown size={14} />
                      </button>
                      {isAdminDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 text-xs font-bold text-slate-700 font-sans">
                          <Link
                            to="/jobs/post"
                            onClick={() => setIsAdminDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 hover:text-slate-955"
                          >
                            <PlusCircle size={14} className="text-indigo-600" />
                            Post Job Escrow
                          </Link>
                          <Link
                            to="/dashboard"
                            onClick={() => setIsAdminDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 hover:text-slate-955"
                          >
                            <LayoutDashboard size={14} className="text-purple-650" />
                            Client/Dev Dashboard
                          </Link>
                          <Link
                            to="/onboarding"
                            onClick={() => setIsAdminDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 hover:text-slate-955"
                          >
                            <User size={14} className="text-purple-650" />
                            Edit Profile
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* ADMIN-SPECIFIC DESKTOP NAVBAR */
            <div className="hidden md:flex items-center gap-2.5 font-sans">
              {/* 1. Judge Panel */}
              <Link
                to="/judge"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  isActive('/judge')
                    ? 'border-amber-300 bg-amber-100 text-amber-900 font-extrabold shadow-sm'
                    : 'border-amber-200 bg-amber-50/40 text-amber-800 hover:bg-amber-100/70 font-semibold'
                }`}
              >
                <Scale size={14} className="stroke-[2]" />
                Judge Panel
              </Link>

              {/* 2. Treasury Admin */}
              <Link
                to="/treasury"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  isActive('/treasury')
                    ? 'border-emerald-300 bg-emerald-100 text-emerald-900 font-extrabold shadow-sm'
                    : 'border-emerald-200 bg-emerald-50/40 text-emerald-800 hover:bg-emerald-100/70 font-semibold'
                }`}
              >
                <Landmark size={14} className="stroke-[2]" />
                Treasury Admin
              </Link>

              {/* 3. DAO */}
              <Link
                to="/dao"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive('/dao')
                    ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                    : 'text-slate-700 hover:text-purple-700 hover:bg-purple-50 font-semibold'
                }`}
              >
                <Users size={14} className="stroke-[2]" />
                DAO
              </Link>

              {/* 4. Analytics */}
              <Link
                to="/analytics"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive('/analytics')
                    ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                    : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50 font-semibold'
                }`}
              >
                <BarChart3 size={14} className="stroke-[2]" />
                Analytics
              </Link>

              {/* 5. More Dropdown Trigger */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer font-sans transition-all ${
                    isMoreOpen
                      ? 'border-purple-300 bg-purple-50 text-purple-900 font-extrabold'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <Grid size={14} />
                  <span>More</span>
                  <ChevronDown size={13} className={`transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMoreOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 font-sans">
                    <Link
                      to="/jobs"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                        isActive('/jobs') && !isActive('/jobs/post') ? 'bg-purple-50/70 text-purple-950 font-bold border border-purple-100/50' : 'text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Briefcase size={16} className="text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="font-bold text-xs text-slate-900 leading-tight">Find Jobs</p>
                          <p className="text-[10px] text-slate-500 font-medium">Explore and manage job listings</p>
                        </div>
                      </div>
                      <ChevronRight size={12} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/reputation"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                        isActive('/reputation') ? 'bg-purple-50/70 text-purple-950 font-bold border border-purple-100/50' : 'text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Trophy size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="font-bold text-xs text-slate-900 leading-tight">SBT Leaderboard</p>
                          <p className="text-[10px] text-slate-500 font-medium">View top performers</p>
                        </div>
                      </div>
                      <ChevronRight size={12} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/chat"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                        isActive('/chat') ? 'bg-purple-50/70 text-purple-950 font-bold border border-purple-100/50' : 'text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MessageSquare size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="font-bold text-xs text-slate-900 leading-tight">Messages</p>
                          <p className="text-[10px] text-slate-500 font-medium">Communicate with community</p>
                        </div>
                      </div>
                      <ChevronRight size={12} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                        isActive('/dashboard') ? 'bg-purple-50/70 text-purple-950 font-bold border border-purple-100/50' : 'text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Beaker size={16} className="text-purple-600 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="font-bold text-xs text-slate-900 leading-tight">Admin Sandbox</p>
                          <p className="text-[10px] text-slate-500 font-medium">Test and simulate features</p>
                        </div>
                      </div>
                      <ChevronRight size={12} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/onboarding"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                        isActive('/onboarding') ? 'bg-purple-50/70 text-purple-950 font-bold border border-purple-100/50' : 'text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Settings size={16} className="text-slate-500 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="font-bold text-xs text-slate-900 leading-tight">Settings</p>
                          <p className="text-[10px] text-slate-500 font-medium">Preferences & configuration</p>
                        </div>
                      </div>
                      <ChevronRight size={12} className="text-slate-400" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right side Wallet / Perception Status */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile Hamburger Menu for Admins */}
            {(currentRole as string) === 'admin' && (
              <div className="md:hidden relative" ref={mobileMoreRef}>
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center border border-slate-200 bg-slate-50 shadow-3xs"
                >
                  {isMoreOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
                {isMoreOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 font-sans">
                    {/* Key Admin Links */}
                    <div className="border-b border-slate-100 pb-1.5 mb-1.5 space-y-1">
                      <Link
                        to="/judge"
                        onClick={() => setIsMoreOpen(false)}
                        className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                          isActive('/judge') ? 'bg-purple-50/70 text-purple-950 font-bold border border-purple-100/50' : 'text-slate-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Scale size={16} className="text-amber-600 shrink-0" />
                          <div className="text-left">
                            <p className="font-bold text-xs text-slate-900 leading-tight">Judge Panel</p>
                            <p className="text-[10px] text-slate-500 font-medium">Arbitrate and resolve disputes</p>
                          </div>
                        </div>
                        <ChevronRight size={12} className="text-slate-400" />
                      </Link>

                      <Link
                        to="/treasury"
                        onClick={() => setIsMoreOpen(false)}
                        className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                          isActive('/treasury') ? 'bg-purple-50/70 text-purple-950 font-bold border border-purple-100/50' : 'text-slate-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Landmark size={16} className="text-emerald-600 shrink-0" />
                          <div className="text-left">
                            <p className="font-bold text-xs text-slate-900 leading-tight font-sans">Treasury Admin</p>
                            <p className="text-[10px] text-slate-500 font-medium">Safe multisig treasury status</p>
                          </div>
                        </div>
                        <ChevronRight size={12} className="text-slate-400" />
                      </Link>

                      <Link
                        to="/dao"
                        onClick={() => setIsMoreOpen(false)}
                        className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                          isActive('/dao') ? 'bg-purple-50/70 text-purple-950 font-bold border border-purple-100/50' : 'text-slate-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Users size={16} className="text-purple-600 shrink-0" />
                          <div className="text-left">
                            <p className="font-bold text-xs text-slate-900 leading-tight">DAO</p>
                            <p className="text-[10px] text-slate-500 font-medium">Decentralized governance portal</p>
                          </div>
                        </div>
                        <ChevronRight size={12} className="text-slate-400" />
                      </Link>

                      <Link
                        to="/analytics"
                        onClick={() => setIsMoreOpen(false)}
                        className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                          isActive('/analytics') ? 'bg-purple-50/70 text-purple-950 font-bold border border-purple-100/50' : 'text-slate-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <BarChart3 size={16} className="text-blue-600 shrink-0" />
                          <div className="text-left">
                            <p className="font-bold text-xs text-slate-900 leading-tight">Analytics</p>
                            <p className="text-[10px] text-slate-500 font-medium">Platform stats and reports</p>
                          </div>
                        </div>
                        <ChevronRight size={12} className="text-slate-400" />
                      </Link>
                    </div>

                    {/* Hidden Items on Mobile */}
                    <Link
                      to="/jobs"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                        isActive('/jobs') && !isActive('/jobs/post') ? 'bg-purple-50/70 text-purple-950 font-bold border border-purple-100/50' : 'text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Briefcase size={16} className="text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="font-bold text-xs text-slate-900 leading-tight">Find Jobs</p>
                          <p className="text-[10px] text-slate-500 font-medium font-sans">Explore and manage listings</p>
                        </div>
                      </div>
                      <ChevronRight size={12} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/reputation"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                        isActive('/reputation') ? 'bg-purple-50/70 text-purple-950 font-bold border border-purple-100/50' : 'text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Trophy size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="font-bold text-xs text-slate-900 leading-tight font-sans">SBT Leaderboard</p>
                          <p className="text-[10px] text-slate-500 font-medium font-sans font-sans">View top performers</p>
                        </div>
                      </div>
                      <ChevronRight size={12} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/chat"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                        isActive('/chat') ? 'bg-purple-50/70 text-purple-950 font-bold border border-purple-100/50' : 'text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MessageSquare size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="font-bold text-xs text-slate-900 leading-tight font-sans">Messages</p>
                          <p className="text-[10px] text-slate-500 font-medium font-sans">Communicate with community</p>
                        </div>
                      </div>
                      <ChevronRight size={12} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                        isActive('/dashboard') ? 'bg-purple-50/70 text-purple-950 font-bold border border-purple-100/50' : 'text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Beaker size={16} className="text-purple-650 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="font-bold text-xs text-slate-900 leading-tight font-sans font-sans font-sans">Admin Sandbox</p>
                          <p className="text-[10px] text-slate-500 font-medium font-sans">Test and simulate features</p>
                        </div>
                      </div>
                      <ChevronRight size={12} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/onboarding"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                        isActive('/onboarding') ? 'bg-purple-50/70 text-purple-950 font-bold border border-purple-100/50' : 'text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Settings size={16} className="text-slate-500 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="font-bold text-xs text-slate-900 leading-tight font-sans">Settings</p>
                          <p className="text-[10px] text-slate-500 font-medium font-sans">Preferences & configuration</p>
                        </div>
                      </div>
                      <ChevronRight size={12} className="text-slate-400" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {isConnected && address && (currentRole as string) !== 'visitor' ? (
              <div className="flex items-center gap-2 font-sans">
                <Link
                  to={`/profile/${address}`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-extrabold transition-all hover:bg-purple-100 shadow-2xs"
                >
                  <User size={13} className="text-purple-700 shrink-0" />
                  <span>{truncateAddress(address)}</span>
                  <ChevronDown size={12} className="text-purple-700 shrink-0" />
                </Link>
                <button
                  onClick={disconnectWallet}
                  className="text-xs text-slate-500 hover:text-rose-600 transition-colors px-2 py-1 cursor-pointer font-medium font-sans"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="gradient-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <LogIn size={14} />
                  Connect Wallet
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Login Options Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};
