import React, { useState } from 'react';
import {
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { NETWORK_CONFIG } from '../config/contracts';
import { Modal } from './overlay/Modal';
import { Button } from './common/Button';
import { AddressChip } from './common/AddressChip';

interface InsufficientFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredAmount: string;
  currentBalance: string;
  tokenSymbol?: string;
  onFundsReceived?: () => void;
}

export const InsufficientFundsModal: React.FC<InsufficientFundsModalProps> = ({
  isOpen,
  onClose,
  requiredAmount,
  currentBalance,
  tokenSymbol = 'POL',
  onFundsReceived,
}) => {
  const { address, refreshBalances } = useWeb3();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const reqNum = parseFloat(requiredAmount) || 0;
  const balNum = parseFloat(currentBalance) || 0;
  const shortfall = Math.max(0, reqNum - balNum);

  const isMainnet =
    String(NETWORK_CONFIG.chainId) === '137' ||
    NETWORK_CONFIG.chainName.toLowerCase().includes('mainnet');

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshBalances();
    } catch {
      // silently handle
    }
    setTimeout(() => {
      setIsRefreshing(false);
      if (balNum >= reqNum && onFundsReceived) {
        onFundsReceived();
      }
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title="Insufficient Wallet Balance"
      description={`You need additional ${tokenSymbol} to complete this escrow funding.`}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-mono text-[#6B7280]">
            {NETWORK_CONFIG.chainName}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              loading={isRefreshing}
              icon={<RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />}
            >
              Check balance
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Shortfall Breakdown Card */}
        <div className="p-3.5 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#4B5563]">Required deposit:</span>
            <span className="font-semibold text-[#0B0B0F] tabular-nums">
              {reqNum.toFixed(4)} {tokenSymbol}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#4B5563]">Current wallet balance:</span>
            <span className="font-semibold text-[#4B5563] tabular-nums">
              {balNum.toFixed(4)} {tokenSymbol}
            </span>
          </div>
          <div className="pt-2 border-t border-[#E5E7EB] flex justify-between items-center text-xs">
            <span className="font-semibold text-[#0B0B0F]">Missing shortfall:</span>
            <span className="font-semibold text-[#0047AB] tabular-nums">
              +{shortfall.toFixed(4)} {tokenSymbol}
            </span>
          </div>
        </div>

        {/* Deposit Address Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#4B5563]">
              Deposit address (Polygon PoS)
            </label>
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="text-[#0047AB] hover:underline text-xs flex items-center gap-1 cursor-pointer"
            >
              <QrCode size={12} />
              <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
            </button>
          </div>

          {address && <AddressChip address={address} showCopy showExplorer truncate={false} />}

          {showQr && address && (
            <div className="p-4 bg-[#F6F7F9] rounded-[10px] border border-[#E5E7EB] flex flex-col items-center justify-center gap-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${address}`}
                alt="Wallet QR Code"
                className="w-32 h-32 rounded-[8px] border border-[#E5E7EB] bg-white p-2"
              />
              <span className="text-[11px] text-[#6B7280]">
                Scan with your mobile wallet or exchange
              </span>
            </div>
          )}
        </div>

        {/* Quick Top-up Channels */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-[#4B5563] block">
            Recommended top-up channels:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {isMainnet ? (
              <>
                <a
                  href="https://portal.polygon.technology/bridge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-[8px] border border-[#E5E7EB] bg-white hover:border-[#0047AB] hover:bg-[#F6F7F9] transition-colors text-xs font-medium text-[#0B0B0F] flex items-center justify-between"
                >
                  <span>Polygon Bridge</span>
                  <ArrowUpRight size={13} className="text-[#6B7280]" />
                </a>
                <a
                  href="https://quickswap.exchange/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-[8px] border border-[#E5E7EB] bg-white hover:border-[#0047AB] hover:bg-[#F6F7F9] transition-colors text-xs font-medium text-[#0B0B0F] flex items-center justify-between"
                >
                  <span>QuickSwap DEX</span>
                  <ArrowUpRight size={13} className="text-[#6B7280]" />
                </a>
              </>
            ) : (
              <>
                <a
                  href="https://faucet.polygon.technology/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-[8px] border border-[#E5E7EB] bg-white hover:border-[#0047AB] hover:bg-[#F6F7F9] transition-colors text-xs font-medium text-[#0B0B0F] flex items-center justify-between"
                >
                  <span>POL Faucet</span>
                  <ArrowUpRight size={13} className="text-[#6B7280]" />
                </a>
                <a
                  href="https://faucet.circle.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-[8px] border border-[#E5E7EB] bg-white hover:border-[#0047AB] hover:bg-[#F6F7F9] transition-colors text-xs font-medium text-[#0B0B0F] flex items-center justify-between"
                >
                  <span>USDC Faucet</span>
                  <ArrowUpRight size={13} className="text-[#6B7280]" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InsufficientFundsModal;
