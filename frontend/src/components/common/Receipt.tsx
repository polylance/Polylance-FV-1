import React from 'react';

export type ReceiptStamp = 'LOCKED' | 'APPROVED' | 'PAID';

export interface ReceiptLineItem {
  label: string;
  value: string;
  muted?: boolean;
}

export interface ReceiptProps {
  title: string;
  subtitle?: string;
  items: ReceiptLineItem[];
  totalLabel: string;
  totalValue: string;
  stamp?: ReceiptStamp;
  hashLine?: string;
  badgeText?: string;
  className?: string;
}

const STAMP_CLASSES: Record<ReceiptStamp, string> = {
  LOCKED: 'bg-[#EFF6FF] text-[#0A52B8] border border-[#BFDBFE]',
  APPROVED: 'bg-[#0A52B8] text-white border border-[#0A52B8]',
  PAID: 'bg-[#0F172A] text-white border border-[#0F172A]',
};

/**
 * Signature Receipt Component:
 * Perforated ticket-like container expressing locked milestone funds, fees, or certificates.
 * Amounts use tabular body figures; monospace is strictly reserved for the hashLine footer.
 */
export const Receipt: React.FC<ReceiptProps> = ({
  title,
  subtitle,
  items,
  totalLabel,
  totalValue,
  stamp = 'LOCKED',
  hashLine,
  badgeText,
  className = '',
}) => {
  return (
    <div className={`relative w-full text-left select-none ${className}`}>
      {/* Perforated Top Edge */}
      <svg
        viewBox="0 0 400 12"
        preserveAspectRatio="none"
        className="w-full h-3 block text-white"
        aria-hidden="true"
      >
        <path
          d="M0,12 L0,6 L10,0 L20,6 L30,0 L40,6 L50,0 L60,6 L70,0 L80,6 L90,0 L100,6 L110,0 L120,6 L130,0 L140,6 L150,0 L160,6 L170,0 L180,6 L190,0 L200,6 L210,0 L220,6 L230,0 L240,6 L250,0 L260,6 L270,0 L280,6 L290,0 L300,6 L310,0 L320,6 L330,0 L340,6 L350,0 L360,6 L370,0 L380,6 L390,0 L400,6 L400,12 Z"
          fill="#FFFFFF"
          stroke="#0B0B0C"
          strokeWidth="2"
        />
        <rect x="2" y="10" width="396" height="3" fill="#FFFFFF" />
      </svg>

      {/* Ticket Body */}
      <div className="bg-white border-x-2 border-[#0B0B0C] px-5 sm:px-6 py-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            {badgeText && (
              <span className="inline-block px-2 py-0.5 text-[12px] font-semibold bg-[#F5F6F8] border border-[#E2E5EA] rounded-[6px] text-[#0B0B0C]">
                {badgeText}
              </span>
            )}
            <h3 className="text-[20px] font-bold text-[#0B0B0C] leading-snug">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[14px] text-[#4B5563] leading-snug">{subtitle}</p>
            )}
          </div>

          {stamp && (
            <span
              className={`shrink-0 px-2.5 py-1 rounded-[6px] text-[12px] font-bold tracking-[0.05em] uppercase ${STAMP_CLASSES[stamp]}`}
            >
              {stamp}
            </span>
          )}
        </div>

        {/* Dashed Receipt Divider */}
        <div className="border-t-2 border-dashed border-[#E2E5EA]" />

        {/* Line Items */}
        <div className="space-y-2.5">
          {items.map((item) => (
            <div key={item.label} className="flex items-baseline justify-between gap-4 text-[14px]">
              <span className={item.muted ? 'text-[#4B5563]' : 'text-[#0B0B0C] font-medium'}>
                {item.label}
              </span>
              <span className="tabular-amount font-semibold text-[#0B0B0C] shrink-0">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Dashed Receipt Divider */}
        <div className="border-t-2 border-dashed border-[#E2E5EA]" />

        {/* Total Line */}
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[15px] font-bold text-[#0B0B0C]">{totalLabel}</span>
          <span className="tabular-amount text-[20px] font-bold text-[#0B0B0C]">
            {totalValue}
          </span>
        </div>

        {/* Monospace strictly for transaction/address hash footer */}
        {hashLine && (
          <div className="pt-2 border-t border-[#E2E5EA] font-mono text-[12px] text-[#4B5563] truncate">
            {hashLine}
          </div>
        )}
      </div>

      {/* Perforated Bottom Edge */}
      <svg
        viewBox="0 0 400 12"
        preserveAspectRatio="none"
        className="w-full h-3 block"
        aria-hidden="true"
      >
        <path
          d="M0,0 L0,6 L10,12 L20,6 L30,12 L40,6 L50,12 L60,6 L70,12 L80,6 L90,12 L100,6 L110,12 L120,6 L130,12 L140,6 L150,12 L160,6 L170,12 L180,6 L190,12 L200,6 L210,12 L220,6 L230,12 L240,6 L250,12 L260,6 L270,12 L280,6 L290,12 L300,6 L310,12 L320,6 L330,12 L340,6 L350,12 L360,6 L370,12 L380,6 L390,12 L400,6 L400,0 Z"
          fill="#FFFFFF"
          stroke="#0B0B0C"
          strokeWidth="2"
        />
        <rect x="2" y="0" width="396" height="2" fill="#FFFFFF" />
      </svg>
    </div>
  );
};

export default Receipt;
