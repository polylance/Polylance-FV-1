import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Radio,
  Youtube,
  Instagram,
  Video,
  Mic,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ArrowRight
} from 'lucide-react';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { truncateAddress } from '../utils/formatters';

interface CreatorCollabBriefModalProps {
  creator: any;
  onClose: () => void;
}

const CreatorCollabBriefModal: React.FC<CreatorCollabBriefModalProps> = ({ creator, onClose }) => {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState(
    creator.creatorProfile?.rateCard?.[0] || { deliverable: 'Dedicated Sponsored Feature', priceUsdc: 500 }
  );
  const [briefNotes, setBriefNotes] = useState('');

  const handleCreateEscrowBrief = () => {
    navigate(
      `/jobs/post?creatorWallet=${creator.wallet}&deliverable=${encodeURIComponent(
        selectedPackage.deliverable
      )}&budget=${selectedPackage.priceUsdc}&category=creators-brand-collabs`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-[16px] max-w-lg w-full p-6 space-y-5 border border-[#E5E7EB] shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FF6A1F]/10 text-[#FF6A1F] flex items-center justify-center font-bold text-xs">
              <Radio size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B0B0F]">Escrow Collab Brief</h3>
              <p className="text-[11px] text-[#6B7280]">
                Proposal for {creator.displayName || truncateAddress(creator.wallet)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#0B0B0F] text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0B0B0F] mb-1.5">
              Select Package / Deliverable
            </label>
            <div className="space-y-2">
              {(creator.creatorProfile?.rateCard || [
                { deliverable: 'Dedicated Sponsored Feature', priceUsdc: 500 },
                { deliverable: '60-Second Mid-Roll Segment', priceUsdc: 250 }
              ]).map((pkg: any, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPackage(pkg)}
                  className={`w-full p-3 rounded-[8px] border text-left flex items-center justify-between cursor-pointer transition-colors ${
                    selectedPackage.deliverable === pkg.deliverable
                      ? 'border-[#0047AB] bg-[#EFF6FF]'
                      : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <span className="text-xs font-medium text-[#0B0B0F]">{pkg.deliverable}</span>
                  <span className="text-xs font-bold text-[#0047AB]">{pkg.priceUsdc} USDC</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B0B0F] mb-1.5">
              Campaign Brief & Target Link
            </label>
            <textarea
              rows={3}
              placeholder="Outline the product key messaging, mandatory call to action, and deadline..."
              value={briefNotes}
              onChange={(e) => setBriefNotes(e.target.value)}
              className="w-full bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] p-2.5 text-xs text-[#0B0B0F] focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
            />
          </div>

          {/* Security & Non-custodial escrow terms */}
          <div className="p-3 bg-[#FBFBFC] border border-[#E5E7EB] rounded-[8px] space-y-1 text-[11px] text-[#4B5563]">
            <div className="flex items-center gap-1.5 font-semibold text-[#0B0B0F]">
              <ShieldCheck size={14} className="text-[#0047AB]" />
              <span>PolyLance Sovereign Escrow Terms</span>
            </div>
            <p>
              Funds remain securely locked on Polygon until the creator submits draft deliverables and
              publishing proof. 2.5% brand fee + 2.5% creator fee applied upon milestone release.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] text-xs font-medium text-[#6B7280] hover:text-[#0B0B0F] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateEscrowBrief}
            className="px-4 py-2 bg-[#0047AB] hover:bg-[#00388A] text-white text-xs font-bold rounded-[8px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Proceed to Escrow Deposit</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const CreatorsDirectoryPage: React.FC = () => {
  const { profiles } = usePolyLanceData();
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [selectedCreatorForBrief, setSelectedCreatorForBrief] = useState<any | null>(null);

  // Extract all profiles with category 6 or creator profiles
  const creatorProfiles = useMemo(() => {
    return Object.entries(profiles || {})
      .map(([wallet, p]) => ({ wallet, ...(p as any) }))
      .filter((p) => p.primaryCategory === 'creators-brand-collabs' || p.creatorProfile);
  }, [profiles]);

  const filteredCreators = useMemo(() => {
    if (platformFilter === 'all') return creatorProfiles;
    return creatorProfiles.filter(
      (c) => c.creatorProfile?.platform?.toLowerCase() === platformFilter.toLowerCase()
    );
  }, [creatorProfiles, platformFilter]);

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'youtube':
        return <Youtube size={14} className="text-[#DC2626]" />;
      case 'instagram':
        return <Instagram size={14} className="text-[#E1306C]" />;
      case 'tiktok':
        return <Video size={14} className="text-[#0B0B0F]" />;
      case 'podcast':
        return <Mic size={14} className="text-[#8B5CF6]" />;
      default:
        return <Radio size={14} className="text-[#FF6A1F]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#0B0B0F] pb-24">
      {/* Header Banner */}
      <div className="bg-white border-b border-[#E5E7EB] pt-12 pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF6A1F]/10 text-[#C2410C] border border-[#FF6A1F]/20">
            <Radio size={14} />
            <span>Category 06 &bull; Sovereign Sponsorships</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0B0B0F]">
            Creators & Brand Collabs
          </h1>

          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
            Direct, escrow-backed brand integrations with YouTube, podcast, and short-form creators.
            No agency middleman markups.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-medium text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-[#0047AB]" />
              Non-custodial milestone release
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-[#0047AB]" />
              Transparent 2.5% + 2.5% protocol fee
            </span>
            <span className="flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-[#FF6A1F]" />
              Clear self-reported vs. verified distinction
            </span>
          </div>
        </div>
      </div>

      {/* Main Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Platforms' },
              { id: 'youtube', label: 'YouTube' },
              { id: 'instagram', label: 'Instagram' },
              { id: 'tiktok', label: 'TikTok / Shorts' },
              { id: 'podcast', label: 'Podcasts' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatformFilter(p.id)}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] transition-[transform,background-color,color] duration-100 ${
                  platformFilter === p.id
                    ? 'bg-[#0047AB] text-white shadow-xs'
                    : 'bg-white text-[#4B5563] hover:text-[#0B0B0F] border border-[#E5E7EB]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Link
            to="/welcome"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] bg-[#0047AB] hover:bg-[#00388A] text-white text-xs font-bold active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] transition-[transform,background-color] duration-150 shadow-xs"
          >
            <PlusCircle size={14} />
            <span>List as Creator</span>
          </Link>
        </div>

        {/* Real Creator Cards or Honest Empty State */}
        {filteredCreators.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-12 text-center max-w-xl mx-auto my-12 space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#FF6A1F]/10 text-[#FF6A1F] flex items-center justify-center mx-auto">
              <Radio size={24} />
            </div>
            <h3 className="text-base font-bold text-[#0B0B0F]">
              No creators registered under this platform filter yet
            </h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Are you a content creator, podcaster, or streamer? Register your rate card and
              accept milestone escrows on Polygon directly from Web3 brands.
            </p>
            <div className="pt-2">
              <Link
                to="/welcome"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0047AB] text-white text-xs font-semibold rounded-[8px] hover:bg-[#00388A] transition-colors"
              >
                <PlusCircle size={14} />
                <span>Create Creator Profile</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {filteredCreators.map((creator) => {
              const profile = creator.creatorProfile || {};
              const isVerified = Boolean(profile.verified);

              return (
                <div
                  key={creator.wallet}
                  className="bg-white border border-[#E5E7EB] ring-1 ring-black/[0.03] hover:border-[#CBD5E1] rounded-[16px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-[transform,box-shadow,border-color] duration-150 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center text-sm font-bold text-[#0B0B0F] overflow-hidden">
                          {creator.avatarUrl ? (
                            <img src={creator.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            creator.wallet.slice(2, 4).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#0B0B0F]">
                            {creator.displayName || truncateAddress(creator.wallet)}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-0.5">
                            {getPlatformIcon(profile.platform)}
                            <span className="font-mono">{profile.handle || '@creator'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Verification Status Badge */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-[4px] border ${
                          isVerified
                            ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                            : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                        }`}
                        title={isVerified ? 'Verified via Platform API' : 'Self-reported by creator'}
                      >
                        {isVerified ? 'Verified' : 'Self-reported'}
                      </span>
                    </div>

                    <p className="text-xs text-[#4B5563] line-clamp-2">
                      {creator.bio || 'Crypto, tech and Web3 creator open for sponsored integrations.'}
                    </p>

                    {/* Stats pills */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-[#F6F7F9] p-2 rounded-[6px] border border-[#E5E7EB]">
                        <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">
                          Audience
                        </span>
                        <span className="text-xs font-bold font-mono tabular-nums text-[#0B0B0F]">
                          {profile.audienceCount ? Number(profile.audienceCount).toLocaleString() : 'Growing'}
                        </span>
                      </div>
                      <div className="bg-[#F6F7F9] p-2 rounded-[6px] border border-[#E5E7EB]">
                        <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">
                          Niche
                        </span>
                        <span className="text-xs font-bold text-[#0B0B0F] truncate block">
                          {profile.niche || 'Web3'}
                        </span>
                      </div>
                    </div>

                    {/* Rate card sample */}
                    {profile.rateCard && profile.rateCard.length > 0 && (
                      <div className="pt-2 border-t border-[#F3F4F6] space-y-1">
                        <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">
                          Starting Escrow Package
                        </span>
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-[#0B0B0F] truncate pr-2">
                            {profile.rateCard[0].deliverable}
                          </span>
                          <span className="font-bold font-mono tabular-nums text-[#0047AB] shrink-0">
                            {profile.rateCard[0].priceUsdc}&nbsp;USDC
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between gap-2">
                    <Link
                      to={`/profile/${creator.wallet}`}
                      className="text-xs font-semibold text-[#6B7280] hover:text-[#0B0B0F] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0047AB] rounded"
                    >
                      View Channel Info
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelectedCreatorForBrief(creator)}
                      className="px-3.5 py-1.5 bg-[#0047AB] hover:bg-[#00388A] text-white text-xs font-bold rounded-[6px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] transition-[transform,background-color] duration-150 cursor-pointer shadow-xs"
                    >
                      Request Collab
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collab Brief Modal */}
      {selectedCreatorForBrief && (
        <CreatorCollabBriefModal
          creator={selectedCreatorForBrief}
          onClose={() => setSelectedCreatorForBrief(null)}
        />
      )}
    </div>
  );
};

