import React from 'react';
import { motion } from 'motion/react';
import {
  FolderSearch,
  AlertTriangle,
  WifiOff,
  Gauge,
  SearchX,
  ShieldAlert,
  Hourglass,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  LogIn,
  Search,
  ExternalLink
} from 'lucide-react';
import { PolyLanceLogo } from './PolyLanceLogo';

// ── 1. EMPTY STATE ──────────────────────────────────────────────────────────
export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data yet',
  description = 'Nothing to show here. Once there is activity, it will appear here.',
  actionText = 'Explore Opportunities',
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-10 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto ${className}`}>
      {/* 3D Purple Folder Search Illustration */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-500/15 via-indigo-500/10 to-purple-400/20 flex items-center justify-center border border-purple-200/60 shadow-inner">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
            <FolderSearch size={32} className="stroke-[1.75]" />
          </div>
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-purple-200 flex items-center justify-center text-purple-600 shadow-md">
          <Search size={14} className="stroke-[2.5]" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-7 leading-relaxed">{description}</p>

      {actionText && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// ── 2. LOADING STATE ────────────────────────────────────────────────────────
export interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Loading...',
  description = 'Fetching the latest data from the blockchain.',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-10 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto ${className}`}>
      {/* 3D PolyLance Logo with Pulsing Ring */}
      <div className="relative mb-6 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.06, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-indigo-500/15 flex items-center justify-center border border-blue-200/60 shadow-inner"
        >
          <PolyLanceLogo size={52} className="filter drop-shadow-md" />
        </motion.div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6 leading-relaxed">{description}</p>

      {/* Smooth Progress Bar */}
      <div className="w-56 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="w-1/2 h-full bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 rounded-full"
        />
      </div>
    </div>
  );
};

// ── 3. ERROR STATE ──────────────────────────────────────────────────────────
export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  onDashboard?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = "We couldn't process your request. Please try again.",
  onRetry,
  onDashboard,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-10 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto ${className}`}>
      {/* 3D Glowing Red Triangle Badge */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-24 h-24 rounded-3xl bg-red-50 flex items-center justify-center border border-red-200/60 shadow-inner">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/25">
            <AlertTriangle size={32} className="stroke-[2]" />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-7 leading-relaxed">{description}</p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5 cursor-pointer"
          >
            Try Again
          </button>
        )}
        {onDashboard && (
          <button
            onClick={onDashboard}
            className="px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

// ── 4. NO INTERNET / OFFLINE STATE ──────────────────────────────────────────
export interface NoInternetStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const NoInternetState: React.FC<NoInternetStateProps> = ({
  title = 'No internet connection',
  description = 'You are offline. Please check your connection and try again.',
  onRetry,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-10 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto ${className}`}>
      {/* 3D Satellite / Connection Lost Illustration */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-24 h-24 rounded-3xl bg-indigo-50/80 flex items-center justify-center border border-indigo-200/60 shadow-inner">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <WifiOff size={32} className="stroke-[1.75]" />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-7 leading-relaxed">{description}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 cursor-pointer"
        >
          <RotateCcw size={15} /> Retry
        </button>
      )}
    </div>
  );
};

// ── 5. SLOW NETWORK STATE ───────────────────────────────────────────────────
export interface SlowNetworkStateProps {
  title?: string;
  description?: string;
  onContinue?: () => void;
  className?: string;
}

export const SlowNetworkState: React.FC<SlowNetworkStateProps> = ({
  title = 'Slow network detected',
  description = 'This might take a while. Please wait while we optimize the connection.',
  onContinue,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-10 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto ${className}`}>
      {/* 3D Speedometer Gauge Illustration */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-24 h-24 rounded-3xl bg-cyan-50 flex items-center justify-center border border-cyan-200/60 shadow-inner">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
            <Gauge size={32} className="stroke-[1.75]" />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-7 leading-relaxed">{description}</p>

      {onContinue && (
        <button
          onClick={onContinue}
          className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-xs"
        >
          Continue Anyway
        </button>
      )}
    </div>
  );
};

// ── 6. NO SEARCH RESULT STATE ───────────────────────────────────────────────
export interface NoSearchResultStateProps {
  title?: string;
  description?: string;
  onClear?: () => void;
  className?: string;
}

export const NoSearchResultState: React.FC<NoSearchResultStateProps> = ({
  title = 'No results found',
  description = "We couldn't find anything matching your search.",
  onClear,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-10 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto ${className}`}>
      {/* 3D Magnifying Glass Search Illustration */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-24 h-24 rounded-3xl bg-purple-50 flex items-center justify-center border border-purple-200/60 shadow-inner">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
            <SearchX size={32} className="stroke-[1.75]" />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-7 leading-relaxed">{description}</p>

      {onClear && (
        <button
          onClick={onClear}
          className="px-6 py-2.5 rounded-xl bg-white border border-purple-200 hover:bg-purple-50/50 text-purple-700 font-medium text-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-xs"
        >
          Clear Search
        </button>
      )}
    </div>
  );
};

// ── 7. PERMISSION DENIED / ACCESS DENIED STATE ──────────────────────────────
export interface PermissionDeniedStateProps {
  title?: string;
  description?: string;
  onBack?: () => void;
  className?: string;
}

export const PermissionDeniedState: React.FC<PermissionDeniedStateProps> = ({
  title = 'Access denied',
  description = "You don't have permission to access this resource.",
  onBack,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-10 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto ${className}`}>
      {/* 3D Glassmorphic Shield Lock Illustration */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-24 h-24 rounded-3xl bg-purple-50/90 flex items-center justify-center border border-purple-200/60 shadow-inner">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-purple-600/25">
            <ShieldAlert size={32} className="stroke-[1.75]" />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-7 leading-relaxed">{description}</p>

      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-xs"
        >
          <ArrowLeft size={15} /> Go Back
        </button>
      )}
    </div>
  );
};

// ── 8. SESSION EXPIRED STATE ────────────────────────────────────────────────
export interface SessionExpiredStateProps {
  title?: string;
  description?: string;
  onLogin?: () => void;
  className?: string;
}

export const SessionExpiredState: React.FC<SessionExpiredStateProps> = ({
  title = 'Session expired',
  description = 'Your session has expired for security reasons. Please login again.',
  onLogin,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-10 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto ${className}`}>
      {/* 3D Purple Hourglass Illustration */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-24 h-24 rounded-3xl bg-indigo-50/80 flex items-center justify-center border border-indigo-200/60 shadow-inner">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
            <Hourglass size={32} className="stroke-[1.75]" />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-7 leading-relaxed">{description}</p>

      {onLogin && (
        <button
          onClick={onLogin}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 cursor-pointer"
        >
          <LogIn size={15} /> Login Again
        </button>
      )}
    </div>
  );
};

// ── 9. FORM VALIDATION COMPONENT / STATE ────────────────────────────────────
export interface FormValidationCardProps {
  className?: string;
  onSubmit?: (data: any) => void;
}

export const FormValidationCard: React.FC<FormValidationCardProps> = ({ className = '', onSubmit }) => {
  const [fullName, setFullName] = React.useState('John Doe');
  const [email, setEmail] = React.useState('john@');
  const [wallet, setWallet] = React.useState('0x123...abcd');
  const [budget, setBudget] = React.useState('-100');

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isBudgetValid = parseFloat(budget) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ fullName, email, wallet, budget });
    }
  };

  return (
    <div className={`p-6 sm:p-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs text-left max-w-md w-full ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name (Valid) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
          <div className="relative">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <CheckCircle2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
          </div>
        </div>

        {/* Email Address (Invalid with helper text) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 focus:outline-none transition-colors ${
                isEmailValid ? 'border-emerald-500 focus:border-emerald-500' : 'border-rose-400 focus:border-rose-500'
              }`}
            />
            {!isEmailValid && <XCircle size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-500" />}
          </div>
          {!isEmailValid && <p className="text-[11px] text-rose-500 mt-1 font-medium">Please enter a valid email address</p>}
        </div>

        {/* Wallet Address (Valid) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Wallet Address</label>
          <div className="relative">
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <CheckCircle2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
          </div>
        </div>

        {/* Proposal Budget (Invalid) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Proposal Budget (USDC)</label>
          <div className="relative">
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-mono text-slate-900 focus:outline-none transition-colors ${
                isBudgetValid ? 'border-emerald-500 focus:border-emerald-500' : 'border-rose-400 focus:border-rose-500'
              }`}
            />
            {!isBudgetValid && <XCircle size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-500" />}
          </div>
          {!isBudgetValid && <p className="text-[11px] text-rose-500 mt-1 font-medium">Amount must be greater than 0</p>}
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 cursor-pointer"
          >
            Submit Proposal
          </button>
        </div>
      </form>
    </div>
  );
};

// ── 10. SUCCESS STATE ───────────────────────────────────────────────────────
export interface SuccessStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title = 'Success!',
  description = 'Your proposal has been submitted successfully.',
  actionText = 'View Proposal',
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-10 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto ${className}`}>
      {/* 3D Emerald Checkmark Badge */}
      <div className="relative mb-6 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center border border-emerald-200/60 shadow-inner"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
            <CheckCircle2 size={34} className="stroke-[2]" />
          </div>
        </motion.div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-7 leading-relaxed">{description}</p>

      {actionText && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
