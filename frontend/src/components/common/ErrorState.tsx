import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileQuestion, 
  Lock, 
  ShieldAlert, 
  WifiOff, 
  AlertCircle, 
  FolderOpen,
  ArrowLeft,
  Home,
  RefreshCw,
  LogIn
} from 'lucide-react';

export type ErrorStateVariant = 
  | '404' 
  | 'auth-required' 
  | '403' 
  | 'network' 
  | 'empty' 
  | 'error';

export interface ErrorStateProps {
  variant?: ErrorStateVariant;
  title?: string;
  description?: string;
  badge?: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
  compact?: boolean;
}

const VARIANT_CONFIGS: Record<ErrorStateVariant, {
  icon: React.ElementType;
  badge: string;
  badgeClass: string;
  iconBgClass: string;
  iconColorClass: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultActionText: string;
  actionIcon: React.ElementType;
}> = {
  '404': {
    icon: FileQuestion,
    badge: '404 Not Found',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    iconBgClass: 'bg-blue-50 border-blue-200',
    iconColorClass: 'text-[#0047AB]',
    defaultTitle: 'Page Does Not Exist',
    defaultDescription: 'The page or resource you are looking for could not be found or has moved.',
    defaultActionText: 'Back to Home',
    actionIcon: Home,
  },
  'auth-required': {
    icon: LogIn,
    badge: 'Authentication Required',
    badgeClass: 'bg-blue-50 text-[#0047AB] border-blue-200',
    iconBgClass: 'bg-blue-50 border-blue-200',
    iconColorClass: 'text-[#0047AB]',
    defaultTitle: 'Sign In Required',
    defaultDescription: 'Please connect your Polygon wallet and sign in to access this workspace.',
    defaultActionText: 'Connect & Sign In',
    actionIcon: LogIn,
  },
  '403': {
    icon: Lock,
    badge: 'Access Restricted',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    iconBgClass: 'bg-amber-50 border-amber-200',
    iconColorClass: 'text-amber-700',
    defaultTitle: 'Restricted Access',
    defaultDescription: 'You do not have the required permissions or role to access this area.',
    defaultActionText: 'Return to Dashboard',
    actionIcon: ArrowLeft,
  },
  'network': {
    icon: WifiOff,
    badge: 'Network Unavailable',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
    iconBgClass: 'bg-red-50 border-red-200',
    iconColorClass: 'text-red-700',
    defaultTitle: 'Connection Interrupted',
    defaultDescription: 'Unable to connect to the Polygon RPC or backend service. Please check your network.',
    defaultActionText: 'Retry Connection',
    actionIcon: RefreshCw,
  },
  'empty': {
    icon: FolderOpen,
    badge: 'No Items',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    iconBgClass: 'bg-slate-50 border-slate-200',
    iconColorClass: 'text-slate-500',
    defaultTitle: 'Nothing Here Yet',
    defaultDescription: 'There are no active records matching your criteria.',
    defaultActionText: 'Refresh',
    actionIcon: RefreshCw,
  },
  'error': {
    icon: AlertCircle,
    badge: 'System Notice',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
    iconBgClass: 'bg-red-50 border-red-200',
    iconColorClass: 'text-red-700',
    defaultTitle: 'Something Went Wrong',
    defaultDescription: 'An unexpected error occurred while processing your request. Please try again.',
    defaultActionText: 'Try Again',
    actionIcon: RefreshCw,
  },
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  variant = 'error',
  title,
  description,
  badge,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  className = '',
  compact = false,
}) => {
  const config = VARIANT_CONFIGS[variant];
  const Icon = config.icon;
  const ActionIcon = config.actionIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`w-full max-w-lg mx-auto text-center bg-white border border-[#E5E7EB] rounded-2xl shadow-xs ${
        compact ? 'p-6' : 'p-8 sm:p-10'
      } ${className}`}
      role="alert"
    >
      {/* Icon Graphic */}
      <div
        className={`mx-auto mb-5 rounded-2xl border flex items-center justify-center ${
          compact ? 'w-12 h-12' : 'w-16 h-16'
        } ${config.iconBgClass} ${config.iconColorClass}`}
      >
        <Icon className={compact ? 'w-6 h-6' : 'w-8 h-8'} />
      </div>

      {/* Status Badge */}
      <div className="mb-3">
        <span
          className={`inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border ${
            config.badgeClass
          }`}
        >
          {badge || config.badge}
        </span>
      </div>

      {/* Title */}
      <h2
        className={`font-bold text-[#0B0B0F] tracking-tight mb-2 ${
          compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'
        }`}
      >
        {title || config.defaultTitle}
      </h2>

      {/* Description */}
      <p className="text-[#4B5563] text-sm leading-relaxed max-w-md mx-auto mb-8">
        {description || config.defaultDescription}
      </p>

      {/* Action Buttons */}
      {(onAction || onSecondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#0B0B0F] text-sm font-medium border border-[#E5E7EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0047AB]/20"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              {secondaryActionText || 'Go Back'}
            </button>
          )}

          {onAction && (
            <button
              type="button"
              onClick={onAction}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0047AB] hover:bg-[#00388A] active:bg-[#002C6C] text-white text-sm font-medium shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30"
            >
              <ActionIcon className="w-4 h-4" />
              {actionText || config.defaultActionText}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ErrorState;
