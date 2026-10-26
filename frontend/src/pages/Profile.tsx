import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { UserProfile, Job } from '../types';
import {
  truncateAddress,
  getDeterministicSbtId,
  getCanonicalCertificateId,
  getCertifiedPassVerifyUrl,
  buildVerifyUrl,
  toChecksumAddress,
  formatTimeAgo,
  copyToClipboard,
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
  Eye,
  EyeOff,
  Lock,
  Download,
  Copy,
} from 'lucide-react';
import { GithubEkycCard } from '../components/GithubEkycCard';
import { GithubVerifyModal } from '../components/GithubVerifyModal';
import { PageContainer } from '../components/layout/PageContainer';
import { Avatar } from '../components/common/Avatar';
import { AddressChip } from '../components/common/AddressChip';
import { Amount } from '../components/common/Amount';
import { TokenAmount } from '../components/common/TokenAmount';
import { getJobAmounts } from '../lib/amounts/getJobAmounts';
import { Tabs, TabItem } from '../components/common/Tabs';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { Input, Textarea, TagInput } from '../components/common/FormControls';
import { calculateReputationScores, getReputationTier } from '../utils/reputation';
import { CompactTierChip } from '../components/common/TierEmblem';
import { PolygonLogo } from '../components/brand/PolygonLogo';
import { CONTRACTS } from '../config/contracts';
import { renderCertificate, renderCertificateToPng, svgToDataUri, KNOWN_ONCHAIN_TOKENS } from '../utils/certificateGenerator';
import { Seo } from '../components/seo/Seo';
import { buildProfileSeo } from '../seo/templates';

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

  const userProfile = useMemo(() => {
    return ((userProfileKey ? profiles[userProfileKey] : null) || {
      address: profileAddr || '',
      displayName: profileAddr ? `${profileAddr.slice(0, 6)}...${profileAddr.slice(-4)}` : 'Anonymous Member',
      bio: 'No biography has been written yet.',
      avatarUrl: '',
      skills: [],
      githubVerified: false,
      reputationSbtCount: 0,
    }) as UserProfile;
  }, [userProfileKey, profiles, profileAddr]);

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
    setEditHeadline(userProfile.primaryCategory || 'Web3 Full-Stack Developer');
    setEditBio(userProfile.bio || '');
    setEditSkills(userProfile.skills || []);
  }, [userProfile.displayName, userProfile.primaryCategory, userProfile.bio, userProfile.skills]);

  const handleShareProfile = async () => {
    if (typeof window !== 'undefined') {
      const ok = await copyToClipboard(window.location.href);
      if (ok) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
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

  // Presentation-level filter to hide test/sandbox jobs per user decision
  const isTestJob = (j: Partial<Job> | null | undefined): boolean => {
    if (!j) return true;
    const title = (j.title || '').trim().toLowerCase();
    const id = String(j.id || '').toLowerCase().trim();
    return (
      id.startsWith('mock-') ||
      id.startsWith('test-') ||
      id.startsWith('demo-') ||
      id.startsWith('sample-') ||
      title.includes('test ') ||
      title.startsWith('test') ||
      title.includes('testing') ||
      title.includes('sample') ||
      title.includes('demo') ||
      title.includes('check new filebase db') ||
      title.includes('check the entire polylance') ||
      title.includes('creation of landing page') ||
      title.includes('need to create admin page') ||
      title.includes('full lifecycle test') ||
      title.includes('reaching sbt leaderboard topper')
    );
  };

  // Visibility storage: Default public for Proof of Work, private for Patronage
  const [visibilityMap, setVisibilityMap] = useState<Record<string, 'public' | 'private'>>(() => {
    try {
      const saved = localStorage.getItem('polylance_certificates_visibility');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [certRoleFilter, setCertRoleFilter] = useState<'all' | 'work' | 'patronage'>('all');
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);
  const [copiedCertId, setCopiedCertId] = useState<string | null>(null);

  const toggleVisibility = (certKey: string, defaultVis: 'public' | 'private') => {
    setVisibilityMap((prev) => {
      const current = prev[certKey] || defaultVis;
      const next: 'public' | 'private' = current === 'public' ? 'private' : 'public';
      const updated: Record<string, 'public' | 'private'> = { ...prev, [certKey]: next };
      try {
        localStorage.setItem('polylance_certificates_visibility', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const completedFreelancerCertificates = useMemo(
    () => completedFreelancerJobs.filter((j) => !isTestJob(j)),
    [completedFreelancerJobs]
  );

  const clientJobs = useMemo(
    () => jobs.filter((j) => j.client?.toLowerCase() === profileAddr?.toLowerCase()),
    [jobs, profileAddr]
  );
  const completedClientJobs = useMemo(
    () => clientJobs.filter((j) => j.status === 'Completed'),
    [clientJobs]
  );

  const completedClientCertificates = useMemo(
    () => completedClientJobs.filter((j) => !isTestJob(j)),
    [completedClientJobs]
  );

  // Distinct client name lookup
  const getClientDisplayName = (clientAddress: string) => {
    const key = Object.keys(profiles).find((k) => k.toLowerCase() === clientAddress.toLowerCase());
    return key && profiles[key]?.displayName ? profiles[key].displayName : truncateAddress(clientAddress);
  };

  // Unified list of certificates for this profile owner
  const allProfileCertificates = useMemo(() => {
    const list: Array<{
      id: string;
      job: Job;
      variant: 'work' | 'patronage';
      roleLabel: string;
      sbtId: number;
      onchainTokenId?: number;
      certificateNo: number;
      counterpartyName: string;
      counterpartyAddr: string;
      tokenAmt: number;
      tokenSym: string;
      completedAt: number;
      visibility: 'public' | 'private';
      certKey: string;
    }> = [];

    // Freelancer Proof of Work
    for (const job of completedFreelancerCertificates) {
      const known = (job.id ? KNOWN_ONCHAIN_TOKENS[job.id.toLowerCase()] : null) ||
        (job.sbtTokenId ? KNOWN_ONCHAIN_TOKENS[String(job.sbtTokenId)] : null);
      const onchainTokenId = job.onchainTokenId ?? known?.onchainTokenId;
      const certificateNo = job.certificateNo ?? known?.certificateNo ?? (job.sbtTokenId ? Number(job.sbtTokenId) : getDeterministicSbtId(job.id));
      const sbtId = onchainTokenId !== undefined ? onchainTokenId : certificateNo;
      const certKey = `work_${job.id}_${sbtId}`;
      const vis = visibilityMap[certKey] || 'public';
      const amounts = getJobAmounts(job, undefined, undefined, 'freelancer');
      const tokenSym = amounts.token;
      const tokenAmt = parseFloat(amounts.settled || amounts.effectiveAmount || '0');

      list.push({
        id: job.id,
        job,
        variant: 'work',
        roleLabel: 'Proof of Work',
        sbtId,
        onchainTokenId,
        certificateNo,
        counterpartyName: getClientDisplayName(job.client),
        counterpartyAddr: job.client,
        tokenAmt,
        tokenSym,
        completedAt: job.completedAt || job.createdAt || Date.now(),
        visibility: vis,
        certKey,
      });
    }

    // Client Patronage
    for (const job of completedClientCertificates) {
      const known = (job.id ? KNOWN_ONCHAIN_TOKENS[job.id.toLowerCase()] : null) ||
        (job.sbtTokenId ? KNOWN_ONCHAIN_TOKENS[String(job.sbtTokenId)] : null);
      const onchainTokenId = job.onchainTokenId ?? known?.onchainTokenId;
      const certificateNo = job.certificateNo ?? known?.certificateNo ?? (job.sbtTokenId ? Number(job.sbtTokenId) : getDeterministicSbtId(job.id));
      const sbtId = onchainTokenId !== undefined ? onchainTokenId : certificateNo;
      const certKey = `patronage_${job.id}_${sbtId}`;
      const vis = visibilityMap[certKey] || 'private';
      const amounts = getJobAmounts(job, undefined, undefined, 'client');
      const tokenSym = amounts.token;
      const tokenAmt = parseFloat(amounts.settled || amounts.effectiveAmount || '0');

      list.push({
        id: job.id,
        job,
        variant: 'patronage',
        roleLabel: 'Patronage',
        sbtId,
        onchainTokenId,
        certificateNo,
        counterpartyName: job.freelancer ? (profiles?.[job.freelancer.toLowerCase()]?.displayName || truncateAddress(job.freelancer)) : 'Assigned Talent',
        counterpartyAddr: job.freelancer || '',
        tokenAmt,
        tokenSym,
        completedAt: job.completedAt || job.createdAt || Date.now(),
        visibility: vis,
        certKey,
      });
    }

    return list.sort((a, b) => b.completedAt - a.completedAt);
  }, [completedFreelancerCertificates, completedClientCertificates, visibilityMap, profiles]);

  // Scoped by viewer permissions:
  // Owner sees all certificates with controls. Public visitors see only public certificates.
  const visibleCertificates = useMemo(() => {
    return allProfileCertificates.filter((item) => {
      if (!isOwnProfile && item.visibility === 'private') return false;
      if (certRoleFilter === 'work' && item.variant !== 'work') return false;
      if (certRoleFilter === 'patronage' && item.variant !== 'patronage') return false;
      return true;
    });
  }, [allProfileCertificates, isOwnProfile, certRoleFilter]);

  const devVolumeHandled = useMemo(() => {
    return completedFreelancerJobs.reduce((sum, j) => {
      const earnedFraction = j.dispute?.resolved ? (j.dispute.rulingBps ?? 0) / 10000 : 1.0;
      return sum + parseFloat(getJobAmounts(j, undefined, undefined, 'freelancer').effectiveAmount || '0') * earnedFraction;
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

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'portfolio', label: 'Portfolio', badge: completedFreelancerJobs.length },
    { id: 'certificates', label: 'Certificates', badge: visibleCertificates.length },
    { id: 'reviews', label: 'Reviews', badge: completedFreelancerJobs.length },
  ];

  const profileSeo = buildProfileSeo({
    address: userProfile.address,
    displayName: userProfile.displayName,
    bio: userProfile.bio,
    skills: userProfile.skills,
    completedJobsCount: completedFreelancerJobs.length,
    isPublic: Boolean(userProfile.isPublic),
  });

  return (
    <PageContainer className="py-8">
      <Seo customConfig={profileSeo} extraData={{ profile: userProfile }} />
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
                  const ja = getJobAmounts(job, undefined, undefined, 'freelancer');
                  const tokenAmt = ja.settled || ja.effectiveAmount;
                  const known = (job.id ? KNOWN_ONCHAIN_TOKENS[job.id.toLowerCase()] : null) ||
                    (job.sbtTokenId ? KNOWN_ONCHAIN_TOKENS[String(job.sbtTokenId)] : null);
                  const onchainTokenId = job.onchainTokenId ?? known?.onchainTokenId;
                  const certNo = job.certificateNo ?? known?.certificateNo ?? (job.sbtTokenId || getDeterministicSbtId(job.id));
                  const displayTokenId = onchainTokenId !== undefined ? onchainTokenId : certNo;
                  const verifyUrl = buildVerifyUrl(String(certNo), onchainTokenId);

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
                          <TokenAmount amount={tokenAmt} token={ja.token} />
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs text-[#0047AB] flex-wrap gap-2">
                        <Link
                          to={`/certificate/${displayTokenId}${onchainTokenId !== undefined ? `?token=${onchainTokenId}&cert=${certNo}` : `?cert=${certNo}`}`}
                          className="hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>SBT #{displayTokenId}</span>
                          <ExternalLink size={12} />
                        </Link>
                        <div className="flex items-center gap-2.5">
                          {onchainTokenId !== undefined && (
                            <a
                              href={`https://polygonscan.com/nft/${CONTRACTS.ReputationSBT}/${onchainTokenId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#8247E5] hover:underline flex items-center gap-1 font-medium text-xs"
                              title="View Soulbound NFT on Polygonscan"
                            >
                              <PolygonLogo variant="mark" size={11} />
                              <span>Polygonscan</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                          <Link
                            to={verifyUrl}
                            className="text-[#4B5563] hover:text-[#0B0B0F] hover:underline flex items-center gap-1"
                          >
                            <span>Verify</span>
                            <ExternalLink size={12} />
                          </Link>
                        </div>
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
          <div className="space-y-6">
            {/* Summary Top Banner */}
            <div className="p-4 sm:p-5 bg-white border border-[#E5E7EB] rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-[#0B0B0F]">Soulbound Work Certificates</h3>
                  <span className="px-2 py-0.5 rounded-[6px] bg-[#EFF6FF] text-[#0047AB] font-mono text-xs font-bold">
                    {visibleCertificates.length} verified
                  </span>
                </div>
                <p className="text-xs text-[#4B5563]">
                  Non-transferable proof of completed milestone contracts (ERC-5192) permanently minted on Polygon PoS.
                </p>
              </div>

              {/* Verified on Polygon Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] text-xs font-medium text-[#0B0B0F]">
                <PolygonLogo variant="mark" size={15} />
                <span>Secured on Polygon PoS</span>
              </div>
            </div>

            {/* Role Switcher Filter (Only if account has both Proof of Work & Patronage) */}
            {allProfileCertificates.some(c => c.variant === 'work') && allProfileCertificates.some(c => c.variant === 'patronage') && (
              <div className="flex items-center gap-2 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCertRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-[8px] border transition-colors cursor-pointer ${
                    certRoleFilter === 'all'
                      ? 'bg-[#0047AB] text-white border-[#0047AB] font-semibold'
                      : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:text-[#0B0B0F]'
                  }`}
                >
                  All ({allProfileCertificates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCertRoleFilter('work')}
                  className={`px-3 py-1.5 rounded-[8px] border transition-colors cursor-pointer ${
                    certRoleFilter === 'work'
                      ? 'bg-[#0047AB] text-white border-[#0047AB] font-semibold'
                      : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:text-[#0B0B0F]'
                  }`}
                >
                  Proof of Work ({allProfileCertificates.filter(c => c.variant === 'work').length})
                </button>
                <button
                  type="button"
                  onClick={() => setCertRoleFilter('patronage')}
                  className={`px-3 py-1.5 rounded-[8px] border transition-colors cursor-pointer ${
                    certRoleFilter === 'patronage'
                      ? 'bg-[#0047AB] text-white border-[#0047AB] font-semibold'
                      : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:text-[#0B0B0F]'
                  }`}
                >
                  Patronage ({allProfileCertificates.filter(c => c.variant === 'patronage').length})
                </button>
              </div>
            )}

            {visibleCertificates.length === 0 ? (
              <EmptyState
                title="No certificates available"
                description={
                  isOwnProfile
                    ? "Completed milestone contracts will automatically mint soulbound certificates to your wallet."
                    : "This profile has not made any certificates public yet."
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {visibleCertificates.map((item) => {
                  const sbtId = item.sbtId;
                  const isWork = item.variant === 'work';
                  const certParams = item.onchainTokenId !== undefined
                    ? `?token=${item.onchainTokenId}&cert=${item.certificateNo}`
                    : `?cert=${item.certificateNo}`;
                  const certViewUrl = `/certificate/${sbtId}${certParams}`;
                  const verifyUrl = buildVerifyUrl(String(item.certificateNo), item.onchainTokenId);

                  let certDataUri = '';
                  try {
                    const svg = renderCertificate({
                      tokenId: sbtId,
                      variant: item.variant,
                      jobId: item.job.id,
                      jobTitle: item.job.title,
                      category: item.job.category,
                      recipientAddress: item.job.freelancer || userProfile.address,
                      recipientName: isWork ? userProfile.displayName : item.counterpartyName,
                      clientAddress: item.job.client,
                      clientName: isWork ? item.counterpartyName : userProfile.displayName,
                      amount: item.tokenAmt,
                      tokenSymbol: item.tokenSym,
                      completedAt: item.completedAt,
                    });
                    certDataUri = svgToDataUri(svg);
                  } catch {
                    certDataUri = '';
                  }

                  const handleDownloadThisPng = async () => {
                    try {
                      setDownloadingCertId(String(sbtId));
                      const svg = renderCertificate({
                        tokenId: sbtId,
                        variant: item.variant,
                        jobId: item.job.id,
                        jobTitle: item.job.title,
                        category: item.job.category,
                        recipientAddress: item.job.freelancer || userProfile.address,
                        recipientName: isWork ? userProfile.displayName : item.counterpartyName,
                        clientAddress: item.job.client,
                        clientName: isWork ? item.counterpartyName : userProfile.displayName,
                        amount: item.tokenAmt,
                        tokenSymbol: item.tokenSym,
                        completedAt: item.completedAt,
                      });
                      const blob = await renderCertificateToPng(svg);
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `PolyLance-Certificate-PL-SBT-${sbtId}.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error('Download PNG failed:', err);
                    } finally {
                      setDownloadingCertId(null);
                    }
                  };

                  const handleShareThisCert = async () => {
                    const fullUrl = `${window.location.origin}/#/certificate/${sbtId}${certParams}`;
                    const ok = await copyToClipboard(fullUrl);
                    if (ok) {
                      setCopiedCertId(String(sbtId));
                      setTimeout(() => setCopiedCertId(null), 2000);
                    }
                  };

                  return (
                    <div
                      key={item.certKey}
                      className="p-5 bg-white border border-[#E5E7EB] hover:border-[#0047AB] rounded-[14px] space-y-4 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        {/* Certificate Visual Preview Thumbnail (A4 Landscape aspect) */}
                        <Link
                          to={certViewUrl}
                          className="shrink-0 w-full sm:w-44 aspect-[1414/1000] rounded-[8px] overflow-hidden border border-[#E5E7EB] hover:border-[#0047AB] bg-[#FAFAF8] shadow-xs group transition-all"
                          title="Click to view full certificate"
                        >
                          {certDataUri ? (
                            <img
                              src={certDataUri}
                              alt={`Soulbound Certificate PL-SBT #${sbtId}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
                              <Award size={24} className="text-[#0047AB] mb-1" />
                              <span className="text-[9px] font-mono font-bold text-[#0047AB]">PL-SBT #{sbtId}</span>
                            </div>
                          )}
                        </Link>

                        {/* Certificate Details */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-[6px] border ${
                                isWork 
                                  ? 'bg-[#EFF6FF] text-[#0047AB] border-[#BFDBFE]' 
                                  : 'bg-[#F4F4F5] text-[#0B0B0F] border-[#E4E4E7]'
                              }`}>
                                {item.roleLabel} · PL-SBT #{sbtId}
                              </span>
                              {item.certificateNo !== undefined && item.certificateNo !== item.sbtId && (
                                <span className="text-[10px] font-mono text-[#6B7280]">
                                  Cert #{item.certificateNo}
                                </span>
                              )}
                            </div>
                            
                            {/* Visibility Badge */}
                            <div className="flex items-center gap-1.5">
                              {item.visibility === 'public' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Eye size={10} />
                                  <span>Public</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                                  <Lock size={10} />
                                  <span>Private</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <h4 className="text-sm font-semibold text-[#0B0B0F] line-clamp-2" title={item.job.title}>
                            {item.job.title}
                          </h4>

                          <div className="flex items-center gap-1.5 text-xs text-[#4B5563] flex-wrap">
                            <span>Payout:</span>
                            <Amount value={item.tokenAmt} token={item.tokenSym} showFiat={true} inline={true} tokenClassName="font-medium text-[#0B0B0F]" />
                          </div>

                          <div className="text-[11px] text-[#6B7280] flex items-center gap-1 truncate">
                            <ShieldCheck size={12} className="text-[#0047AB] shrink-0" />
                            <span className="truncate">
                              {isWork ? `Client: ${item.counterpartyName}` : `Contractor: ${item.counterpartyName}`}
                            </span>
                          </div>

                          <div className="text-[10.5px] text-[#9CA3AF]">
                            Settled {formatTimeAgo(item.completedAt)}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs gap-2 flex-wrap">
                        <Link
                          to={certViewUrl}
                          className="text-[#0047AB] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>View certificate</span>
                          <ExternalLink size={12} />
                        </Link>

                        <div className="flex items-center gap-3">
                          <Link
                            to={verifyUrl}
                            className="text-[#6B7280] hover:text-[#0B0B0F] hover:underline flex items-center gap-1 font-medium"
                          >
                            <ShieldCheck size={12} className="text-[#0047AB]" />
                            <span>Verify</span>
                            <ExternalLink size={11} />
                          </Link>

                          {item.onchainTokenId !== undefined && (
                            <a
                              href={`https://polygonscan.com/nft/${CONTRACTS.ReputationSBT}/${item.onchainTokenId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#8247E5] hover:underline flex items-center gap-1 font-medium"
                              title="View Soulbound NFT on Polygonscan"
                            >
                              <PolygonLogo variant="mark" size={11} />
                              <span>Polygonscan</span>
                              <ExternalLink size={10} />
                            </a>
                          )}

                          {/* Share button (public only) */}
                          {item.visibility === 'public' && (
                            <button
                              type="button"
                              onClick={handleShareThisCert}
                              className="text-[#6B7280] hover:text-[#0B0B0F] flex items-center gap-1 cursor-pointer"
                              title="Copy share link"
                            >
                              <Share2 size={12} />
                              <span>{copiedCertId === String(sbtId) ? 'Copied' : 'Share'}</span>
                            </button>
                          )}

                          {/* Owner controls: Download & Visibility toggle */}
                          {isOwnProfile && (
                            <>
                              <button
                                type="button"
                                onClick={handleDownloadThisPng}
                                disabled={downloadingCertId === String(sbtId)}
                                className="text-[#6B7280] hover:text-[#0B0B0F] flex items-center gap-1 cursor-pointer"
                                title="Download PNG"
                              >
                                <Download size={12} />
                                <span>{downloadingCertId === String(sbtId) ? '...' : 'Download'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleVisibility(item.certKey, isWork ? 'public' : 'private')}
                                className="text-[#4B5563] hover:text-[#0047AB] flex items-center gap-1 cursor-pointer font-medium"
                                title={item.visibility === 'public' ? 'Make private (hidden from public visitors)' : 'Make public (visible to everyone)'}
                              >
                                {item.visibility === 'public' ? <EyeOff size={12} /> : <Eye size={12} />}
                                <span>{item.visibility === 'public' ? 'Hide' : 'Show'}</span>
                              </button>
                            </>
                          )}
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
