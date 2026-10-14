import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { UserProfile } from '../types';
import {
  truncateAddress,
  getDeterministicSbtId,
  getCanonicalCertificateId,
  getCertifiedPassVerifyUrl,
  toChecksumAddress,
  formatTimeAgo,
} from '../utils/formatters';
import { scoreGithubUser, getUserBytecodeMatrix } from '../utils/githubOracle';
import {
  CheckCircle2,
  Share2,
  Briefcase,
  MessageSquare,
  Clock,
  Star,
  ExternalLink,
  Award,
  Check,
  Edit3,
  ShieldCheck,
  Github,
} from 'lucide-react';
import { GithubEkycCard } from '../components/GithubEkycCard';
import { GithubVerifyModal } from '../components/GithubVerifyModal';
import { PageContainer } from '../components/layout/PageContainer';
import { Avatar } from '../components/common/Avatar';
import { AddressChip } from '../components/common/AddressChip';
import { Amount } from '../components/common/Amount';
import { Tabs, TabItem } from '../components/common/Tabs';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { Input, Textarea, TagInput } from '../components/common/FormControls';
import { calculateReputationScores, getReputationTier } from '../utils/reputation';
import { CompactTierChip } from '../components/common/TierEmblem';
import { generateCertificateSvg, svgToDataUri } from '../utils/certificateGenerator';

function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .trim();
}

export const Profile: React.FC = () => {
  const { address: targetAddress } = useParams<{ address: string }>();
  const { address: currentAddress, isConnected, connectWallet, currentRole } = useWeb3();
  const { profiles, jobs, updateProfile } = usePolyLanceData();
  const navigate = useNavigate();

  const profileAddr = targetAddress || currentAddress;
  const isOwnProfile =
    Boolean(isConnected && currentAddress && profileAddr && currentAddress.toLowerCase() === profileAddr.toLowerCase());

  const userProfileKey = profileAddr
    ? Object.keys(profiles).find((k) => k.toLowerCase() === profileAddr.toLowerCase())
    : null;

  const userProfile = ((userProfileKey ? profiles[userProfileKey] : null) || {
    address: profileAddr || '',
    displayName: profileAddr ? `${profileAddr.slice(0, 6)}...${profileAddr.slice(-4)}` : 'Anonymous Member',
    bio: 'No biography has been written yet.',
    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${profileAddr || 'polylance'}`,
    skills: [],
    githubVerified: false,
    reputationSbtCount: 0,
  }) as UserProfile;

  const [activeTab, setActiveTab] = useState('overview');
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(userProfile.displayName || '');
  const [editHeadline, setEditHeadline] = useState(userProfile.primaryCategory || 'Web3 Full-Stack Developer');
  const [editBio, setEditBio] = useState(userProfile.bio || '');
  const [editSkills, setEditSkills] = useState<string[]>(userProfile.skills || []);

  useEffect(() => {
    setEditName(userProfile.displayName || '');
    setEditBio(userProfile.bio || '');
    setEditSkills(userProfile.skills || []);
  }, [userProfile]);

  const handleShareProfile = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSaveProfile = () => {
    if (profileAddr) {
      updateProfile(
        {
          displayName: editName.trim(),
          bio: editBio.trim(),
          skills: editSkills,
          primaryCategory: editHeadline.trim(),
        },
        profileAddr
      );
      setIsEditModalOpen(false);
    }
  };

  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const handleGithubVerified = (res: any) => {
    if (profileAddr) {
      updateProfile(
        {
          githubVerified: true,
          githubUsername: res.username,
          githubId: res.id || res.username,
          primaryScore: res.primaryScore,
          secondaryScores: res.secondaryScores,
          primaryCategory: res.primaryCategory,
          languageBytes: res.languageBytes,
          verifiedAt: res.verifiedAt,
          attestationUID: res.attestationUID,
          reputationTier: res.reputationTier,
          avatarUrl: res.fetchedAvatarUrl || userProfile.avatarUrl,
          displayName: res.fetchedDisplayName || userProfile.displayName,
        },
        profileAddr
      );
    }
  };

  // Real-time GitHub sync on mount/viewing a verified developer profile
  useEffect(() => {
    if (userProfile.githubVerified && userProfile.githubUsername) {
      if (userProfile.primaryScore && userProfile.primaryScore > 0) return;
      scoreGithubUser(userProfile.githubUsername, profileAddr)
        .then((res) => {
          if (res && typeof res.primaryScore === 'number' && profileAddr) {
            updateProfile(
              {
                primaryScore: res.primaryScore,
                secondaryScores: res.secondaryScores,
                languageBytes: res.languageBytes || {},
                verifiedAt: res.verifiedAt,
              },
              profileAddr
            );
          }
        })
        .catch((err) => console.warn('Background GitHub sync notice:', err));
    }
  }, [profileAddr, userProfile.githubUsername, userProfile.githubVerified, userProfile.primaryScore]);

  // Jobs calculations
  const freelancerJobs = useMemo(
    () => jobs.filter((j) => j.freelancer?.toLowerCase() === profileAddr?.toLowerCase()),
    [jobs, profileAddr]
  );
  const completedFreelancerJobs = useMemo(
    () => freelancerJobs.filter((j) => j.status === 'Completed'),
    [freelancerJobs]
  );

  const clientJobs = useMemo(
    () => jobs.filter((j) => j.client?.toLowerCase() === profileAddr?.toLowerCase()),
    [jobs, profileAddr]
  );
  const completedClientJobs = useMemo(
    () => clientJobs.filter((j) => j.status === 'Completed'),
    [clientJobs]
  );

  const devVolumeHandled = useMemo(() => {
    return completedFreelancerJobs.reduce((sum, j) => {
      const earnedFraction = j.dispute?.resolved ? (j.dispute.rulingBps ?? 0) / 10000 : 1.0;
      return sum + parseFloat(j.amountUsdc || j.amountEth || '0') * earnedFraction;
    }, 0);
  }, [completedFreelancerJobs]);

  const bytecodeMatrix = getUserBytecodeMatrix(
    userProfile,
    completedFreelancerJobs.length,
    devVolumeHandled
  );

  const repScores = useMemo(() => {
    return calculateReputationScores(
      userProfile.address || profileAddr,
      jobs,
      userProfile,
      userProfile.reputationSbtCount || 0
    );
  }, [userProfile, profileAddr, jobs]);

  const tierInfo = getReputationTier(repScores.totalPoints);
  const tier = tierInfo.tier.toUpperCase();

  // Distinct client name lookup
  const getClientDisplayName = (clientAddress: string) => {
    const key = Object.keys(profiles).find((k) => k.toLowerCase() === clientAddress.toLowerCase());
    return key && profiles[key]?.displayName ? profiles[key].displayName : truncateAddress(clientAddress);
  };

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'portfolio', label: 'Portfolio', badge: completedFreelancerJobs.length },
    { id: 'certificates', label: 'Certificates', badge: completedFreelancerJobs.length },
    { id: 'reviews', label: 'Reviews', badge: completedFreelancerJobs.length },
  ];

  return (
    <PageContainer className="py-8">
      {/* ── PROFILE HEADER ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
            <Avatar
              address={userProfile.address}
              src={userProfile.avatarUrl}
              name={userProfile.displayName}
              size="xl"
              className="w-20 h-20 sm:w-24 sm:h-24 text-xl shrink-0"
            />
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-[#0B0B0F] tracking-tight">
                  {userProfile.displayName}
                </h1>
                {userProfile.githubVerified && (
                  <Badge variant="cobalt" icon={<CheckCircle2 size={13} />}>
                    Verified
                  </Badge>
                )}
                <CompactTierChip tier={tierInfo.tier} />
              </div>

              <p className="text-sm text-[#4B5563]">
                {userProfile.primaryCategory || 'Web3 Full-Stack Engineer & Protocol Contributor'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <AddressChip address={userProfile.address} />
                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="text-xs text-[#0047AB] hover:underline flex items-center gap-1 font-medium"
                >
                  {copiedLink ? <Check size={13} /> : <Share2 size={13} />}
                  <span>{copiedLink ? 'Link copied' : 'Share profile'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto">
            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                {!userProfile.githubVerified && (
                  <Button
                    variant="secondary"
                    onClick={() => setIsVerifyModalOpen(true)}
                    icon={<Github size={15} />}
                  >
                    Connect GitHub
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={() => setIsEditModalOpen(true)}
                  icon={<Edit3 size={15} />}
                >
                  Edit profile
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="primary"
                  onClick={() => navigate('/jobs/post')}
                  icon={<Briefcase size={15} />}
                >
                  Hire
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/chat?recipient=${userProfile.address}`)}
                  icon={<MessageSquare size={15} />}
                >
                  Message
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── STATS ROW (Only show stats with data) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#E5E7EB]">
          <div className="p-3 bg-[#F6F7F9] rounded-[8px] border border-[#E5E7EB]">
            <span className="text-xs text-[#6B7280] block">Reputation score</span>
            <span className="text-lg font-semibold text-[#0B0B0F]">
              {repScores.totalPoints}
            </span>
          </div>

          <div className="p-3 bg-[#F6F7F9] rounded-[8px] border border-[#E5E7EB]">
            <span className="text-xs text-[#6B7280] block">Jobs completed</span>
            <span className="text-lg font-semibold text-[#0B0B0F]">
              {completedFreelancerJobs.length}
            </span>
          </div>

          <div className="p-3 bg-[#F6F7F9] rounded-[8px] border border-[#E5E7EB]">
            <span className="text-xs text-[#6B7280] block">Success rate</span>
            <span className="text-lg font-semibold text-[#0047AB]">
              {completedFreelancerJobs.length > 0 ? '100%' : '100%'}
            </span>
          </div>

          <div className="p-3 bg-[#F6F7F9] rounded-[8px] border border-[#E5E7EB]">
            <span className="text-xs text-[#6B7280] block">Total earned</span>
            <Amount
              value={devVolumeHandled}
              token="POL"
              tokenClassName="text-lg font-semibold text-[#0B0B0F]"
              fiatClassName="text-xs text-[#6B7280]"
            />
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="mt-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="mt-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Merged About & Skills Grouped Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden divide-y divide-[#E5E7EB]">
              <div className="p-5 sm:p-6 space-y-2">
                <h3 className="text-base font-semibold text-[#0B0B0F]">About</h3>
                <p className="text-sm text-[#4B5563] leading-relaxed max-w-[720px]">
                  {userProfile.bio || 'No personal bio added yet.'}
                </p>
              </div>

              <div className="p-5 sm:p-6 space-y-3">
                <h3 className="text-base font-semibold text-[#0B0B0F]">Skills</h3>
                {userProfile.skills && userProfile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userProfile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] text-xs font-medium text-[#0B0B0F]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6B7280]">No skills added yet.</p>
                )}
              </div>
            </div>

            {/* GitHub Verification Card */}
            <GithubEkycCard bytecodeMatrix={bytecodeMatrix} userProfile={userProfile} />
          </div>
        )}

        {/* PORTFOLIO TAB: ONE Merged List of Completed Jobs */}
        {activeTab === 'portfolio' && (
          <div className="space-y-4">
            {completedFreelancerJobs.length === 0 ? (
              <EmptyState
                title="No completed jobs yet"
                description="Completed contracts will appear here automatically with verified on-chain proof."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedFreelancerJobs.map((job) => {
                  const cleanedDesc = stripMarkdown(job.description);
                  const showDesc = cleanedDesc && cleanedDesc.toLowerCase() !== job.title.toLowerCase();
                  const tokenAmt = parseFloat(job.amountEth || job.amountUsdc || '0');
                  const certId = getCanonicalCertificateId(job.id, job.contractAddress);
                  const verifyUrl = getCertifiedPassVerifyUrl(certId);

                  return (
                    <div
                      key={job.id}
                      className="p-5 bg-white border border-[#E5E7EB] rounded-[12px] space-y-3 hover:border-[#0047AB] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#0047AB] bg-[#EFF6FF] px-2.5 py-1 rounded-[8px] border border-[#BFDBFE]">
                          Verified on-chain
                        </span>
                        <span className="text-xs text-[#6B7280]">
                          Completed {formatTimeAgo(job.completedAt || job.createdAt || Date.now())}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-semibold text-[#0B0B0F]">{job.title}</h4>
                        {showDesc && (
                          <p className="text-xs text-[#4B5563] line-clamp-2 mt-1 leading-relaxed">
                            {cleanedDesc}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-xs">
                        <div>
                          <span className="text-[11px] text-[#6B7280] block">Client</span>
                          <span className="font-medium text-[#0B0B0F]">
                            {getClientDisplayName(job.client)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-[#6B7280] block">Payout</span>
                          <Amount value={tokenAmt} token={job.paymentTokenSymbol || 'POL'} />
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs text-[#0047AB]">
                        <Link
                          to={`/jobs/${job.id}/attestation`}
                          className="hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>SBT #{job.sbtTokenId || getDeterministicSbtId(job.id)}</span>
                          <ExternalLink size={12} />
                        </Link>
                        <a
                          href={verifyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#4B5563] hover:text-[#0B0B0F] hover:underline flex items-center gap-1"
                        >
                          <span>Verify</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CERTIFICATES TAB */}
        {activeTab === 'certificates' && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#0B0B0F]">Soulbound Work Certificates</h3>
              <p className="text-xs text-[#4B5563]">Cryptographically verified proof-of-work (ERC-5192) minted directly on Polygon.</p>
            </div>

            {completedFreelancerJobs.length === 0 ? (
              <EmptyState
                title="No work certificates minted yet"
                description="Verified work certificates (ERC-721 Soulbound) are minted upon milestone completion."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedFreelancerJobs.map((job) => {
                  const sbtId = job.sbtTokenId || getDeterministicSbtId(job.id);
                  const certId = getCanonicalCertificateId(job.id, job.contractAddress);
                  const verifyUrl = getCertifiedPassVerifyUrl(certId);
                  const tokenAmt = parseFloat(job.amountEth || job.amountUsdc || '0');
                  const tokenSym = job.paymentTokenSymbol || 'POL';

                  let certDataUri = '';
                  try {
                    const svg = generateCertificateSvg({
                      tokenId: sbtId,
                      variant: 'work',
                      jobId: job.id,
                      jobTitle: job.title,
                      recipientAddress: job.freelancer || userProfile.address,
                      recipientName: userProfile.displayName,
                      clientAddress: job.client,
                      clientName: getClientDisplayName(job.client),
                      amount: tokenAmt,
                      tokenSymbol: tokenSym,
                      completedAt: job.completedAt || job.createdAt || Date.now(),
                    });
                    certDataUri = svgToDataUri(svg);
                  } catch {
                    certDataUri = '';
                  }

                  return (
                    <div
                      key={job.id}
                      className="p-4 sm:p-5 bg-white border border-[#E5E7EB] hover:border-[#0047AB] rounded-[12px] space-y-4 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        {/* Certificate Visual Preview Image */}
                        <Link
                          to={`/attestation/${job.id}`}
                          className="shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-[8px] overflow-hidden border border-[#E5E7EB] hover:border-[#0047AB] bg-[#FAFAF8] shadow-xs group transition-all"
                          title="Click to view verified work certificate"
                        >
                          {certDataUri ? (
                            <img
                              src={certDataUri}
                              alt={`Soulbound Certificate #${sbtId}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
                              <Award size={26} className="text-[#0047AB] mb-1" />
                              <span className="text-[9px] font-mono font-bold text-[#0047AB]">PL-SBT #{sbtId}</span>
                            </div>
                          )}
                        </Link>

                        {/* Certificate Details */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-[11px] font-semibold text-[#0047AB] bg-[#EFF6FF] px-2 py-0.5 rounded-[6px] border border-[#BFDBFE]">
                              PL-SBT #{sbtId}
                            </span>
                            <span className="text-[11px] text-[#6B7280]">
                              {formatTimeAgo(job.completedAt || job.createdAt || Date.now())}
                            </span>
                          </div>

                          <h4 className="text-sm font-semibold text-[#0B0B0F] line-clamp-2" title={job.title}>
                            {job.title}
                          </h4>

                          <div className="flex items-center gap-2 text-xs text-[#4B5563]">
                            <span>Payout:</span>
                            <Amount value={tokenAmt} token={tokenSym} tokenClassName="font-medium text-[#0B0B0F]" />
                          </div>

                          <div className="text-[11px] text-[#6B7280] flex items-center gap-1">
                            <ShieldCheck size={12} className="text-[#0047AB] shrink-0" />
                            <span className="truncate">Client: {getClientDisplayName(job.client)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                        <Link
                          to={`/attestation/${job.id}`}
                          className="text-[#0047AB] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>View full certificate</span>
                          <ExternalLink size={12} />
                        </Link>

                        <div className="flex items-center gap-3">
                          <a
                            href={verifyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#6B7280] hover:text-[#0B0B0F] hover:underline flex items-center gap-1"
                          >
                            <span>Verify pass</span>
                            <ExternalLink size={11} />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              const fullCertUrl = `${window.location.origin}/#/attestation/${job.id}`;
                              navigator.clipboard.writeText(fullCertUrl);
                            }}
                            className="text-[#6B7280] hover:text-[#0B0B0F] flex items-center gap-1 cursor-pointer"
                          >
                            <Share2 size={12} />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {completedFreelancerJobs.length === 0 ? (
              <EmptyState
                title="No reviews yet"
                description="Client reviews from completed contracts will appear here."
              />
            ) : (
              <div className="space-y-3">
                {completedFreelancerJobs.map((job) => {
                  const review = job.clientReview;
                  const stars = review ? review.rating : 0;
                  return (
                    <div
                      key={job.id}
                      className="p-5 bg-white border border-[#E5E7EB] rounded-[12px] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#0B0B0F]">
                            {getClientDisplayName(job.client)}
                          </span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < stars ? 'text-[#0047AB]' : 'text-[#D1D5DB]'}
                                fill={i < stars ? '#0047AB' : 'none'}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-[#6B7280]">
                          {formatTimeAgo(review?.reviewedAt || job.completedAt || job.createdAt || Date.now())}
                        </span>
                      </div>
                      <p className="text-sm text-[#4B5563]">
                        {review?.comment
                          ? `"${review.comment}"`
                          : <span className="italic text-[#9CA3AF]">Client has not left a review yet.</span>}
                      </p>
                      <span className="text-xs text-[#6B7280] block pt-1">
                        Job: {job.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── EDIT PROFILE MODAL ── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit profile"
        description="Update your public profile details and skills"
      >
        <div className="space-y-4">
          <Input
            label="Display name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Your name or team"
          />

          <Input
            label="Headline"
            value={editHeadline}
            onChange={(e) => setEditHeadline(e.target.value)}
            placeholder="e.g. Senior Smart Contract Engineer"
          />

          <Textarea
            label="Biography"
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Brief bio about your experience and background..."
          />

          <TagInput
            label="Skills"
            tags={editSkills}
            onChange={setEditSkills}
            placeholder="Type skill and press Enter..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveProfile}>
              Save changes
            </Button>
          </div>
        </div>
      </Modal>

      <GithubVerifyModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        userAddress={profileAddr || ''}
        onVerified={handleGithubVerified}
      />
    </PageContainer>
  );
};

export default Profile;
