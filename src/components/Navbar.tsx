import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { PolyLanceLogo } from './PolyLanceLogo';
import { LoginModal } from './LoginModal';
import { Briefcase, PlusCircle, LayoutDashboard, Scale, Lock, BarChart3, User, Award, LogIn, Shield } from 'lucide-react';
import { truncateAddress } from '../utils/formatters';

export const Navbar: React.FC = () => {
  const { isConnected, address, currentRole, isArbitrator, isTreasuryAdmin, disconnectWallet } = useWeb3();
  const location = useLocation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-semibold'
                    }`}
                >
                  <Briefcase size={14} />
                  Marketplace
                </Link>

                <Link
                  to="/reputation"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/reputation')
                      ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-semibold'
                    }`}
                >
                  <Award size={14} />
                  Leaderboard
                </Link>
              </div>
            ) : (
              <>
                {/* 2. FREELANCER PERCEPTION */}
                {currentRole === 'freelancer' && (
                  <>
                    <Link
                      to="/jobs"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/jobs') && !isActive('/jobs/post')
                          ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                          : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-semibold'
                        }`}
                    >
                      <Briefcase size={14} />
                      Find Jobs
                    </Link>

                    <Link
                      to="/reputation"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/reputation')
                          ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                          : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-semibold'
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
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-semibold'
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
                {(isTreasuryAdmin || currentRole === 'admin') && (
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
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-semibold'
                    }`}
                >
                  <Award size={14} />
                  DAO
                </Link>

                {/* 8. ANALYTICS */}
                {currentRole !== 'judge' && (
                  <Link
                    to="/analytics"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive('/analytics')
                        ? 'bg-purple-700 text-white font-extrabold shadow-sm'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-semibold'
                      }`}
                  >
                    <BarChart3 size={14} />
                    Analytics
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right side Wallet / Perception Status */}
          <div className="flex items-center gap-3 shrink-0">
            {isConnected && address && currentRole !== 'visitor' ? (
              <div className="flex items-center gap-2">
                <Link
                  to={`/profile/${address}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-extrabold transition-all hover:bg-purple-100 shadow-2xs"
                >
                  <User size={14} className="text-purple-700" />
                  <span>{truncateAddress(address)}</span>
                </Link>
                <button
                  onClick={disconnectWallet}
                  className="text-xs text-slate-500 hover:text-rose-600 transition-colors px-2 py-1 cursor-pointer font-medium"
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
