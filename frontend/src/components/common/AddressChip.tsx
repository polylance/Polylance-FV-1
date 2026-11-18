import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { toChecksumAddress, truncateAddress, getPolygonScanAddressUrl } from '../../utils/formatters';

export interface AddressChipProps {
  address?: string;
  showCopy?: boolean;
  showExplorer?: boolean;
  className?: string;
  truncate?: boolean;
}

export const AddressChip: React.FC<AddressChipProps> = ({
  address,
  showCopy = true,
  showExplorer = false,
  className = '',
  truncate = true
}) => {
  const [copied, setCopied] = useState(false);
  if (!address) return null;

  const checksummed = toChecksumAddress(address);
  const displayAddress = truncate ? truncateAddress(checksummed) : checksummed;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!checksummed) return;
    navigator.clipboard.writeText(checksummed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span
      title={checksummed}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] font-mono text-xs text-[#0B0B0F] select-all ${className}`}
    >
      <span className="truncate">{displayAddress}</span>
      {showCopy && (
        <button
          type="button"
          onClick={handleCopy}
          className="text-[#4B5563] hover:text-[#0047AB] p-0.5 rounded transition-colors cursor-pointer shrink-0"
          title="Copy address"
          aria-label="Copy address"
        >
          {copied ? <Check size={11} className="text-[#0047AB]" /> : <Copy size={11} />}
        </button>
      )}
      {showExplorer && (
        <a
          href={getPolygonScanAddressUrl(checksummed)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#4B5563] hover:text-[#0047AB] p-0.5 rounded transition-colors shrink-0"
          title="View on PolygonScan"
          aria-label="View on PolygonScan"
        >
          <ExternalLink size={11} />
        </a>
      )}
    </span>
  );
};

export default AddressChip;
