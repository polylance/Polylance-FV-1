import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Wallet,
  User,
  ChevronRight,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Award,
  FileText,
  Clock,
  Layers,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { truncateAddress, formatTimeAgo, getPolygonScanAddressUrl } from '../utils/formatters';
import { NETWORK_CONFIG } from '../config/contracts';
import { useLiveCurrencyRates } from '../utils/currency';
import { useNavigate } from 'react-router-dom';
import { scrollToSection } from '../utils/scroll';
import { PolygonLogo } from './brand/PolygonLogo';
import { Amount } from './common/Amount';
import { AddressChip } from './common/AddressChip';
import { Button } from './common/Button';
import { Modal } from './overlay/Modal';
import { useDemoMode } from '../context/DemoModeContext';
import { UsdcIcon, UsdtIcon } from './TokenIcon';

interface WalletBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DemoToken {
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  usdPrice: number;
}

export const WalletBalanceModal: React.FC<WalletBalanceModalProps> = ({ isOpen, onClose }) => {
  const { address, balanceNative, balanceUsdc, balanceUsdt, refreshBalances } = useWeb3();
  const { jobs } = usePolyLanceData();
  const { isDemoMode } = useDemoMode();
  const rates = useLiveCurrencyRates();
  const navigate = useNavigate();

  const [copiedTxHash, setCopiedTxHash] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'balances' | 'polygon_history'>('balances');

  const handleCopyTxHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedTxHash(hash);
    setTimeout(() => setCopiedTxHash(null), 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshBalances();
    } catch {
      // silently handle
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  // Live Rates
  const polRateUsd = rates?.cryptoPrices?.POL || 0.42;
  const polNum = parseFloat(balanceNative || '0') || 0;
  const usdcNum = parseFloat(balanceUsdc || '0') || 0;
  const usdtNum = parseFloat(balanceUsdt || '0') || 0;

  const polUsd = polNum * polRateUsd;
  const usdcUsd = usdcNum * 1.0;
  const usdtUsd = usdtNum * 1.0;

  // Extra demo tokens seeded in demo mode to test 8+ tokens scroll
  const demoTokens: DemoToken[] = useMemo(() => {
    if (!isDemoMode) return [];
    return [
      { symbol: 'WETH', name: 'Wrapped Ether', balance: 0.85, decimals: 18, usdPrice: 2850 },
      { symbol: 'DAI', name: 'Dai Stablecoin', balance: 250.0, decimals: 18, usdPrice: 1.0 },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: 0.045, decimals: 8, usdPrice: 65400 },
      { symbol: 'LINK', name: 'Chainlink', balance: 42.5, decimals: 18, usdPrice: 14.8 },
      { symbol: 'QUICK', name: 'QuickSwap', balance: 1850.0, decimals: 18, usdPrice: 0.052 },
    ];
  }, [isDemoMode]);

  const demoTokensUsd = demoTokens.reduce((acc, t) => acc + t.balance * t.usdPrice, 0);
  const totalUsd = polUsd + usdcUsd + usdtUsd + demoTokensUsd;

  // Polygon Transaction History calculation (strictly from real jobs & events)
  const polygonTransactions = useMemo(() => {
    if (!jobs || !address) return [];

    const currentAddr = address.toLowerCase();
    const txList: Array<{
      id: string;
      title: string;
      subtitle?: string;
      jobTitle: string;
      jobId: string;
      amountDisplay?: string;
      tokenSymbol?: string;
      txHash: string;
      timestamp: number;
      type: 'fund' | 'release' | 'submission' | 'dispute' | 'sbt' | 'other';
      isIncoming: boolean;
    }> = [];

    const seenTxHashes = new Set<string>();

    jobs.forEach((job) => {
      const isClient = job.client?.toLowerCase() === currentAddr;
      const isFreelancer = job.freelancer?.toLowerCase() === currentAddr;
      const isJudge = job.dispute?.judge?.toLowerCase() === currentAddr;

      if (!isClient && !isFreelancer && !isJudge) return;

      const events = job.events || [];
      const budgetStr = job.amountEth ? `${job.amountEth} POL` : `${job.amountUsdc || '0'} USDC`;
      const tokenSym = job.paymentTokenSymbol || (job.amountEth ? 'POL' : 'USDC');

      events.forEach((evt) => {
        if (!evt.txHash) return;
        const hashLower = evt.txHash.toLowerCase();
        if (seenTxHashes.has(hashLower)) return;
        seenTxHashes.add(hashLower);

        let type: 'fund' | 'release' | 'submission' | 'dispute' | 'sbt' | 'other' = 'other';
        let title = 'Smart Contract Action';
        let subtitle = `Escrow #${job.id}`;
        let isIncoming = false;

        if (evt.step === 'Created') {
          type = 'fund';
          title = 'Job Escrow Created';
          isIncoming = false;
        } else if (evt.step === 'Funded') {
          type = 'fund';
          title = isClient ? 'Escrow Deposit Funded' : 'Escrow Locked for Milestone';
          isIncoming = !isClient;
        } else if (evt.step === 'Submitted') {
          type = 'submission';
          title = 'Deliverables Submitted to IPFS';
          isIncoming = false;
        } else if (evt.step === 'Completed') {
          type = 'release';
          title = isFreelancer ? 'Escrow Payout Received' : 'Escrow Payment Released';
          isIncoming = isFreelancer;
        } else if (evt.step === 'Minted') {
          type = 'sbt';
          title = 'Reputation Soulbound Token Minted';
          isIncoming = true;
        } else if (evt.step === 'Ruled') {
          type = 'dispute';
          title = isJudge ? 'Arbitration Ruling Issued' : 'Dispute Resolved';
          isIncoming = isFreelancer;
        } else if (evt.step === 'Disputed') {
          type = 'dispute';
          title = 'Dispute Raised on Escrow';
          isIncoming = false;
        }

        txList.push({
          id: `${job.id}-${evt.step}-${evt.timestamp}`,
          title,
          subtitle,
          jobTitle: job.title,
          jobId: job.id,
          amountDisplay: (evt.step === 'Funded' || evt.step === 'Completed') ? budgetStr : undefined,
          tokenSymbol: tokenSym,
          txHash: evt.txHash,
          timestamp: evt.timestamp || job.createdAt || Date.now(),
          type,
          isIncoming,
        });
      });

      if (isFreelancer && job.sbtTxHash && !seenTxHashes.has(job.sbtTxHash.toLowerCase())) {
        seenTxHashes.add(job.sbtTxHash.toLowerCase());
        txList.push({
          id: `${job.id}-sbt-${job.sbtTxHash}`,
          title: 'Reputation Soulbound NFT Minted',
          subtitle: `Verified Attestation for "${job.title}"`,
          jobTitle: job.title,
          jobId: job.id,
          txHash: job.sbtTxHash,
          timestamp: job.completedAt || job.createdAt || Date.now(),
          type: 'sbt',
          isIncoming: true,
        });
      }
    });

    return txList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [jobs, address]);

  const explorerUrl = getPolygonScanAddressUrl(address || '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[#0B0B0F] text-white flex items-center justify-center shrink-0">
            <Wallet size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[#0B0B0F] tracking-tight truncate">
              {view === 'polygon_history' ? 'Polygon Transaction History' : 'Wallet & Balances'}
            </h3>
          </div>
        </div>
      }
      description={
        <div className="flex items-center gap-2 pt-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-[#F6F7F9] border border-[#E5E7EB] text-xs font-medium text-[#4B5563]">
            <PolygonLogo variant="mark" size={12} />
            <span>{NETWORK_CONFIG.chainName || 'Polygon'} ({NETWORK_CONFIG.chainId || '137'})</span>
          </div>
          {address && <AddressChip address={address} showCopy showExplorer truncate />}
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              loading={refreshing}
              icon={<RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />}
            >
              Refresh
            </Button>
            {view === 'polygon_history' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('balances')}
                icon={<ArrowLeft size={13} />}
              >
                Back to balances
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('polygon_history')}
                icon={<Clock size={13} />}
              >
                Tx history ({polygonTransactions.length})
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                navigate(`/profile/${address}?section=reputation-overview`);
                scrollToSection('reputation-overview', 250);
              }}
              icon={<User size={13} />}
            >
              View profile
            </Button>
          </div>
        </div>
      }
    >
      {view === 'balances' ? (
        <div className="space-y-4">
          {/* Total Value Card (Single Dark Surface) */}
          <div className="p-4 rounded-[12px] bg-[#0B0B0F] text-white space-y-1">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
              <span>Total wallet value</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-[#C9DAF2]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0047AB]" />
                Polygon on-chain
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums pt-1">
              ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-xs font-normal text-[#9CA3AF]">USD</span>
            </div>
          </div>

          {/* Scrollable Token List */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-[#6B7280] px-0.5">
              Available assets on Polygon
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto overscroll-contain pr-1">
              {/* 1. Native POL */}
              <div
                onClick={() => setView('polygon_history')}
                className="p-3 rounded-[10px] bg-white border border-[#E5E7EB] hover:border-[#0047AB] hover:bg-[#F6F7F9] transition-colors flex items-center justify-between cursor-pointer group"
                title="Click to view Polygon transaction history"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                    <PolygonLogo variant="mark" size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#0B0B0F]">Polygon Native</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EAF1FB] text-[#0047AB] font-semibold">
                        POL
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B7280] group-hover:text-[#0047AB] flex items-center gap-0.5 mt-0.5">
                      <span>View transactions</span>
                      <ChevronRight size={11} />
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <Amount value={polNum} token="POL" size="sm" />
                </div>
              </div>

              {/* 2. USD Coin (USDC) */}
              <div className="p-3 rounded-[10px] bg-white border border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                    <UsdcIcon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#0B0B0F]">USD Coin</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F6F7F9] text-[#4B5563] font-semibold">
                        USDC
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">USD Stablecoin</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <Amount value={usdcNum} token="USDC" size="sm" />
                </div>
              </div>

              {/* 3. Tether USD (USDT) */}
              <div className="p-3 rounded-[10px] bg-white border border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                    <UsdtIcon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#0B0B0F]">Tether USD</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F6F7F9] text-[#4B5563] font-semibold">
                        USDT
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">USD Stablecoin</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <Amount value={usdtNum} token="USDT" size="sm" />
                </div>
              </div>

              {/* Seeded Demo Tokens (only in demo mode to test 8+ scrollable items) */}
              {demoTokens.map((tok) => (
                <div
                  key={tok.symbol}
                  className="p-3 rounded-[10px] bg-white border border-[#E5E7EB] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center text-xs font-semibold text-[#4B5563] shrink-0">
                      {tok.symbol.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#0B0B0F]">{tok.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F6F7F9] text-[#4B5563] font-semibold">
                          {tok.symbol}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">Sample Token</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-[#0B0B0F] tabular-nums">
                      {tok.balance.toLocaleString()} {tok.symbol}
                    </div>
                    <div className="text-[11px] text-[#6B7280] tabular-nums">
                      ${(tok.balance * tok.usdPrice).toFixed(2)} USD
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* View 2: Polygon Transaction History */
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB]">
            <div className="flex items-center gap-2 text-xs text-[#4B5563]">
              <ShieldCheck size={14} className="text-[#0047AB]" />
              <span>Scoped to your connected wallet</span>
            </div>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0047AB] hover:underline inline-flex items-center gap-1"
            >
              <span>View on PolygonScan</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="space-y-2 max-h-[320px] overflow-y-auto overscroll-contain pr-1">
            {polygonTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6B7280] border border-dashed border-[#E5E7EB] rounded-[8px]">
                No on-chain PolyLance transactions yet for this address.
              </div>
            ) : (
              polygonTransactions.map((tx) => {
                const polygonScanTxUrl = `${NETWORK_CONFIG.blockExplorerUrl || 'https://polygonscan.com'}/tx/${tx.txHash}`;
                const isCopied = copiedTxHash === tx.txHash;

                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-[8px] bg-white border border-[#E5E7EB] space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-[6px] bg-[#F6F7F9] border border-[#E5E7EB] text-[#0047AB] flex items-center justify-center shrink-0">
                          {tx.type === 'release' ? (
                            <ArrowDownLeft size={14} />
                          ) : tx.type === 'fund' ? (
                            <ArrowUpRight size={14} />
                          ) : tx.type === 'sbt' ? (
                            <Award size={14} />
                          ) : tx.type === 'submission' ? (
                            <FileText size={14} />
                          ) : (
                            <Layers size={14} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-[#0B0B0F] truncate">{tx.title}</h4>
                          <p className="text-[11px] text-[#6B7280] truncate">{tx.jobTitle}</p>
                        </div>
                      </div>

                      {tx.amountDisplay && (
                        <span className="text-xs font-semibold text-[#0B0B0F] tabular-nums shrink-0">
                          {tx.isIncoming ? `+${tx.amountDisplay}` : tx.amountDisplay}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1 border-t border-[#F6F7F9]">
                      <span>{formatTimeAgo(tx.timestamp)}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span>{truncateAddress(tx.txHash)}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyTxHash(tx.txHash, e)}
                          className="text-[#6B7280] hover:text-[#0047AB]"
                          title="Copy hash"
                        >
                          {isCopied ? <Check size={11} className="text-[#0047AB]" /> : <Copy size={11} />}
                        </button>
                        <a
                          href={polygonScanTxUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#6B7280] hover:text-[#0047AB]"
                          title="View on PolygonScan"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default WalletBalanceModal;
