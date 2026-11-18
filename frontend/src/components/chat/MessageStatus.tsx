import React from 'react';
import { Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { MessageDeliveryStatus } from '../../types';

interface MessageStatusProps {
  status: MessageDeliveryStatus;
  seenAt?: number;
  seenByCount?: number;
  sendReadReceipts?: boolean;
  variant?: 'bubble' | 'neutral';
  onRetry?: () => void;
  className?: string;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  seenAt,
  seenByCount,
  sendReadReceipts = true,
  variant = 'bubble',
  onRetry,
  className = '',
}) => {
  // If user disabled read receipts, suppress 'seen' state to 'sent'
  const effectiveStatus = (status === 'seen' && !sendReadReceipts) ? 'sent' : status;

  const seenTimeStr = seenAt ? new Date(seenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const tooltipText = effectiveStatus === 'seen' 
    ? (seenTimeStr ? `Seen at ${seenTimeStr}` : 'Seen')
    : effectiveStatus === 'sent'
    ? 'Sent to server'
    : effectiveStatus === 'sending'
    ? 'Sending...'
    : 'Failed to send';

  if (effectiveStatus === 'failed') {
    return (
      <div 
        className={`inline-flex items-center gap-1 text-[11px] font-medium ${variant === 'bubble' ? 'text-rose-300' : 'text-rose-600'} ${className}`}
        role="status"
        aria-label="Failed to send"
      >
        <AlertCircle size={13} className={`${variant === 'bubble' ? 'text-rose-300' : 'text-rose-600'} shrink-0 stroke-[2.2]`} />
        <span>Failed</span>
        {onRetry && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRetry();
            }}
            className="ml-1 px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white font-semibold text-[10px] inline-flex items-center gap-0.5 transition-colors cursor-pointer"
            title="Retry sending message"
          >
            <RefreshCw size={10} className="shrink-0" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  if (effectiveStatus === 'sending') {
    return (
      <div 
        className={`inline-flex items-center gap-0.5 ${variant === 'bubble' ? 'text-blue-200/80' : 'text-slate-400'} ${className}`}
        role="status"
        aria-label="Sending"
        title="Sending..."
      >
        <Clock size={12} className="stroke-[2.2] animate-pulse" />
      </div>
    );
  }

  if (effectiveStatus === 'seen') {
    return (
      <div 
        className={`inline-flex items-center gap-1 select-none ${className}`}
        role="status"
        aria-label="Seen"
        title={tooltipText}
      >
        {/* Animated Green Tick */}
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 transition-transform duration-300 motion-reduce:transition-none"
        >
          <path 
            d="M5 13L9.5 17.5L19 7" 
            stroke={variant === 'bubble' ? '#34D399' : '#059669'} 
            strokeWidth="2.8" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="seen-tick-path"
          />
        </svg>
        <span className={`text-[11px] font-medium leading-none tracking-tight ${variant === 'bubble' ? 'text-emerald-300' : 'text-emerald-600'}`}>
          {seenByCount && seenByCount > 1 ? `Seen by ${seenByCount}` : 'Seen'}
        </span>
      </div>
    );
  }

  // Default: 'sent' -> ONE blue tick (PolyLance primary blue)
  return (
    <div 
      className={`inline-flex items-center select-none ${variant === 'bubble' ? 'text-blue-200' : 'text-[#0047AB]'} ${className}`}
      role="status"
      aria-label="Sent"
      title={tooltipText}
    >
      <svg 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path 
          d="M5 13L9.5 17.5L19 7" 
          stroke="currentColor" 
          strokeWidth="2.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    </div>
  );
};
