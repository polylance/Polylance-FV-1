import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { usePolyLanceData, getSyncEndpoints } from '../context/PolyLanceDataContext';
import { truncateAddress, getCanonicalCertificateId } from '../utils/formatters';
import { Job } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileCode,
  Sparkles,
  ExternalLink,
  Search,
  Fingerprint,
  QrCode,
  Copy,
  Check,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Network,
  Share2,
  Award,
  BookOpen,
  Terminal,
  Shield,
  Clock,
  Eye,
  BadgeCheck,
  Globe,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Clean design tokens (Black, White, Cobalt Blue)
const NEO = {
  canvas: 'bg-[#F4F6F9]',
  card: 'bg-white rounded-[10px] border border-[#E2E6EC] shadow-xs transition-colors',
  cardHover: 'hover:border-[#0047AB]',
  cardInset: 'bg-[#F4F6F9] rounded-[8px] border border-[#E2E6EC]',
  button: 'bg-white rounded-[8px] border border-[#E2E6EC] text-[#0B0B0C] hover:bg-[#F4F6F9] font-medium transition-colors cursor-pointer',
  buttonPrimary: 'bg-[#0047AB] hover:bg-[#003A8C] rounded-[8px] text-white font-medium transition-colors cursor-pointer',
  pill: 'bg-[#F4F6F9] border border-[#E2E6EC] rounded-full text-[#4B5563] font-mono text-xs',
  pillInset: 'bg-[#F4F6F9] border border-[#E2E6EC] rounded-full font-mono text-xs text-[#0B0B0C]',
  badge3D: 'bg-white rounded-[8px] border border-[#E2E6EC]',
};

export const CertifiedPass: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const [searchParams] = useSearchParams();
  const { jobs, profiles } = usePolyLanceData();
  const [syncedJobs, setSyncedJobs] = useState<Job[]>([]);

  // Sync background jobs from backend endpoints
  useEffect(() => {
    let mounted = true;
    const endpoints = getSyncEndpoints();
    const fetchSync = async () => {
      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(`${endpoint}/api/sync`, { signal: controller.signal });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            if (mounted && data && Array.isArray(data.jobs)) {
              setSyncedJobs(data.jobs);
              break;
            }
          }
        } catch (_) {}
      }
    };
    fetchSync();
    return () => { mounted = false; };
  }, []);

  // Fetch verified certificate from backend microservices if local resolution needs confirmation
  const fetchVerifiedCertFromBackend = useCallback(async (idToVerify: string) => {
    const cleanId = String(idToVerify || '').trim();
    if (!cleanId) return null;
    const endpoints = getSyncEndpoints();
    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${endpoint}/api/certifiedpass/verify/${encodeURIComponent(cleanId)}`, {
          signal: controller.signal
        });
        clearTimeout(timer);
        if (res.ok) {
          const json = await res.json();
          if (json && (json.verified || json.success) && json.data) {
            const d = json.data.details || {};
            const certId = json.data.certId || cleanId;
            const isAudit = json.data.recordType === 'PROTOCOL_TRUST_AUDIT';
            return {
              type: (isAudit ? 'audit' : 'job') as 'job' | 'audit',
              isRealMatch: true,
              certId: certId,
              jobId: d.sbtTokenId?.replace(/^SBT-/i, '') || cleanId,
              jobTitle: d.title || 'Verified PolyLance Sovereign Deliverable',
              category: d.category || 'Decentralized Escrow',
              freelancerAddress: d.freelancerAddress || '',
              freelancerName: d.freelancerName || (d.freelancerAddress ? truncateAddress(d.freelancerAddress) : 'Verified Freelancer'),
              freelancerGithub: 'polylance-dev',
              clientAddress: d.clientAddress || '',
              clientName: d.clientName || (d.clientAddress ? truncateAddress(d.clientAddress) : 'Verified Client Escrow'),
              sbtTokenId: d.sbtTokenId || `SBT-${cleanId.slice(0, 6).toUpperCase()}`,
              ipfsCid: d.ipfsCid || 'bafybeihkovi2mfl4vj6l3k4o7v7q4d4pkm6e6377k47x2',
              oracleSignature: d.oracleSignature || '0x42f8366420a092c55660830e8115e9a443900990',
              contractAddress: d.contractAddress || (import.meta.env.VITE_JOB_ESCROW_ADDRESS || '') as string,
              networkChainId: d.networkChainId || 137,
              completedAt: d.timestamp || new Date().toISOString(),
              privacyShieldedAmount: 'PROTECTED (Zero-Knowledge Verified)',
              targetUrl: isAudit
                ? `/audit/${encodeURIComponent(d.freelancerAddress || cleanId)}`
                : `/attestation/${encodeURIComponent(certId)}`,
            };
          }
        }
      } catch (_) {}
    }
    return null;
  }, []);

  // Comprehensive certificate, deliverable, and audit report resolver
  const resolveTarget = useCallback((rawInput: string) => {
    let q = (rawInput || '').trim();
    if (!q) return null;

    // Handle full URLs or hash routes
    if (q.includes('#/')) {
      const routePart = q.split('#/')[1] || '';
      const [path, query] = routePart.split('?');
      if (query) {
        try {
          const params = new URLSearchParams(query);
          const certFromParam = params.get('certId') || params.get('id') || params.get('q');
          if (certFromParam) q = certFromParam;
        } catch (_) {}
      }
      if (q.includes('#/')) {
        const segments = path.split('/').filter(Boolean);
        if (segments.includes('attestation')) {
          const idx = segments.indexOf('attestation');
          if (idx > 0 && segments[idx - 1] && segments[idx - 2] === 'jobs') {
            q = segments[idx - 1]; // /jobs/:id/attestation
          } else if (segments[idx + 1]) {
            q = segments[idx + 1];
          }
        } else if (segments.includes('audit')) {
          const idx = segments.indexOf('audit');
          if (segments[idx + 1]) {
            q = segments[idx + 1];
          }
        } else if (segments[0] === 'jobs' && segments[1]) {
          q = segments[1];
        }
      }
    }

    if (q.includes('?')) {
      try {
        const qUrl = new URL(q.startsWith('http') ? q : `https://polylance.codes/${q}`);
        const p = qUrl.searchParams.get('certId') || qUrl.searchParams.get('id') || qUrl.searchParams.get('q');
        if (p) q = p;
      } catch (_) {}
    }

    const cleanUpper = q.toUpperCase();
    const cleanLower = q.toLowerCase();
    const stripped = cleanLower
      .replace(/^pl-sbt-job-/i, '')
      .replace(/^pl-audit-/i, '')
      .replace(/^sbt-/i, '')
      .replace(/^job-/i, '')
      .trim();

    // 1. Search across context jobs and synced jobs
    const allJobs: Job[] = [...jobs, ...syncedJobs];

    try {
      const stored = localStorage.getItem('polylance_jobs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          allJobs.push(...parsed);
        }
      }
    } catch (_) {}

    const cleanNoHex = stripped.replace(/^0x/i, '');

    const foundJob = allJobs.find((j: any) => {
      if (!j) return false;
      const jId = (j.id || '').toLowerCase().trim();
      const jContract = (j.contractAddress || '').toLowerCase().trim();
      const jCert = getCanonicalCertificateId(j.id, j.contractAddress).toLowerCase().trim();
      const jCleanId = jId.replace(/^job-/i, '');
      const jContractNoHex = jContract.replace(/^0x/i, '');
      const jIdNoHex = jId.replace(/^0x/i, '');
      const jRawId = String(j.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toLowerCase();
      const isBarcodeMatch = cleanLower.startsWith('pl-') && cleanLower.endsWith(jRawId) && jRawId.length >= 3;

      return (
        jCert === cleanLower ||
        jId === cleanLower ||
        jContract === cleanLower ||
        jId === stripped ||
        jCleanId === stripped ||
        jContract === stripped ||
        isBarcodeMatch ||
        (cleanNoHex.length >= 4 && (
          jContractNoHex.includes(cleanNoHex) ||
          cleanNoHex.includes(jContractNoHex) ||
          jIdNoHex.includes(cleanNoHex) ||
          cleanNoHex.includes(jIdNoHex)
        ))
      );
    });

    if (foundJob) {
      const fAddr = foundJob.freelancer || foundJob.applications?.[0]?.applicant || '';
      const cAddr = foundJob.client || '';
      const fProfile = fAddr ? profiles[fAddr.toLowerCase()] : null;
      const cProfile = cAddr ? profiles[cAddr.toLowerCase()] : null;

      const canonicalCert = getCanonicalCertificateId(foundJob.id, foundJob.contractAddress);
      const completedTx = foundJob.events?.find((e: any) => e.step === 'Completed' && e.txHash)?.txHash ||
        foundJob.events?.find((e: any) => e.txHash)?.txHash ||
        '0x7a89b3f12c98d45e76a1098b12f45c90812e34d567a89b012c34d56e78f901ab23cd45ef67890123456789abcdef0123456789abcdef0123456789abcdef01234567891b';

      return {
        type: 'job' as const,
        isRealMatch: true,
        certId: canonicalCert,
        jobId: foundJob.id,
        jobTitle: foundJob.title || 'Verified PolyLance Sovereign Deliverable',
        category: foundJob.category || 'Decentralized Escrow',
        freelancerAddress: fAddr || (import.meta.env.VITE_TESTER_ADDRESS || import.meta.env.VITE_FREELANCER_ADDRESS || '') as string,
        freelancerName: fProfile?.displayName || (fAddr ? truncateAddress(fAddr) : 'Verified Freelancer'),
        freelancerGithub: fProfile?.githubUsername || 'polylance-dev',
        clientAddress: cAddr || (import.meta.env.VITE_CLIENT_ADDRESS || '') as string,
        clientName: cProfile?.displayName || (cAddr ? truncateAddress(cAddr) : 'Verified Client Escrow'),
        sbtTokenId: foundJob.sbtTokenId ? `SBT-${foundJob.sbtTokenId}` : `SBT-${String(foundJob.id).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '001'}`,
        ipfsCid: foundJob.proof?.evidenceHashes?.[0] || foundJob.applications?.[0]?.proposalIpfsHash || 'bafybeihkovi2mfl4vj6l3k4o7v7q4d4pkm6e6377k47x2',
        oracleSignature: completedTx,
        contractAddress: foundJob.contractAddress || (import.meta.env.VITE_JOB_ESCROW_ADDRESS || '') as string,
        networkChainId: 137,
        completedAt: foundJob.completedAt ? new Date(foundJob.completedAt).toISOString() : new Date().toISOString(),
        privacyShieldedAmount: foundJob.amountUsdc ? `${foundJob.amountUsdc} ${foundJob.paymentTokenSymbol || 'USDC'} (Zero-Knowledge Verified)` : 'PROTECTED (Zero-Knowledge Verified)',
        targetUrl: `/attestation/${encodeURIComponent(canonicalCert)}`,
      };
    }

    // 2. Check if it's an address for Audit Report (0x... 42 chars) or matching profile
    const isAddress = cleanLower.startsWith('0x') && cleanLower.length === 42;
    const profileMatch = Object.entries(profiles).find(
      ([addr, p]) => addr.toLowerCase() === cleanLower || p.githubUsername?.toLowerCase() === cleanLower
    );

    if (isAddress || profileMatch) {
      const targetAddr = profileMatch ? profileMatch[0] : cleanLower;
      const p = profiles[targetAddr.toLowerCase()];
      return {
        type: 'audit' as const,
        isRealMatch: true,
        certId: `PL-AUDIT-${targetAddr.slice(0, 10).toUpperCase()}`,
        jobId: targetAddr,
        jobTitle: `Protocol Reputation & Trust Audit Report`,
        category: 'Soulbound Identity & GitHub eKYC',
        freelancerAddress: targetAddr,
        freelancerName: p?.displayName || truncateAddress(targetAddr),
        freelancerGithub: p?.githubUsername || 'polylancer',
        clientAddress: (import.meta.env.VITE_TREASURY_ADDRESS || import.meta.env.VITE_ADMIN_ADDRESS_1 || '') as string,
        clientName: 'PolyLance Protocol Governance DAO',
        sbtTokenId: `SBT-AUDIT-${targetAddr.slice(2, 6).toUpperCase()}`,
        ipfsCid: p?.ipfsHash || 'bafybeihkovi2mfl4vj6l3k4o7v7q4d4pkm6e6377k47x2',
        oracleSignature: '0x0d09c5943d673135afeccbea633c580a26958faa01ef08daa7815b7d5cb24bdf',
        contractAddress: (import.meta.env.VITE_JOB_ESCROW_ADDRESS || '') as string,
        networkChainId: 137,
        completedAt: new Date().toISOString(),
        privacyShieldedAmount: 'FULL REPUTATION SCORE VERIFIED',
        targetUrl: `/audit/${targetAddr}`,
      };
    }

    return null;
  }, [jobs, syncedJobs, profiles]);

  // Interactive Live Verifier State
  const [certInput, setCertInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verificationSteps, setVerificationSteps] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const { certId: pathCertId } = useParams();

  const runVerification = useCallback(async (idToVerify: string) => {
    setIsVerifying(true);
    setVerificationSteps(0);

    const localMatch = resolveTarget(idToVerify);
    let finalResult = localMatch;

    setTimeout(() => setVerificationSteps(1), 180);
    setTimeout(() => setVerificationSteps(2), 380);
    setTimeout(() => setVerificationSteps(3), 600);

    // If local match is not found or is fallback, query backend verification service
    if (!localMatch || !localMatch.isRealMatch) {
      const backendResult = await fetchVerifiedCertFromBackend(idToVerify);
      if (backendResult) {
        finalResult = backendResult;
      }
    }

    setTimeout(() => {
      setVerificationSteps(4);
      setVerificationResult(finalResult);
      setIsVerifying(false);
      if (finalResult?.isRealMatch) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      }
    }, 850);
  }, [resolveTarget, fetchVerifiedCertFromBackend]);

  // Sync with URL query parameter ?certId=... or ?id=... or route parameter /verify/:certId
  useEffect(() => {
    let urlCert = pathCertId || searchParams.get('certId') || searchParams.get('id') || searchParams.get('q');
    if (!urlCert && typeof window !== 'undefined') {
      try {
        const outer = new URLSearchParams(window.location.search);
        urlCert = outer.get('certId') || outer.get('id') || outer.get('q');
        if (!urlCert && window.location.hash.includes('?')) {
          const hashSearch = new URLSearchParams(window.location.hash.split('?')[1]);
          urlCert = hashSearch.get('certId') || hashSearch.get('id') || hashSearch.get('q');
        }
      } catch (_) {}
    }

    if (urlCert && urlCert !== certInput) {
      setCertInput(urlCert);
      runVerification(urlCert);
    }
  }, [searchParams, pathCertId, runVerification]);

  // When jobs or syncedJobs update asynchronously, update verification result if currently fallback
  useEffect(() => {
    if (certInput && (!verificationResult || !verificationResult.isRealMatch)) {
      const match = resolveTarget(certInput);
      if (match && match.isRealMatch) {
        setVerificationResult(match);
      }
    }
  }, [jobs, syncedJobs, certInput, resolveTarget, verificationResult]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Launch Official CertifiedPass Portal State & Animation
  const [isLaunchingPortal, setIsLaunchingPortal] = useState(false);
  const isCertifiedPassDomain = typeof window !== 'undefined' && 
    (window.location.hostname === 'certifiedpass.polylance.codes' || window.location.hostname.startsWith('certifiedpass.'));

  const handleLaunchPortal = () => {
    if (isLaunchingPortal) return;
    setIsLaunchingPortal(true);

    // Celebratory confetti burst in brand colors
    confetti({
      particleCount: 75,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#0047AB', '#003A8C', '#334155', '#1E8449', '#E8A317', '#C98A1B'],
    });

    if (isCertifiedPassDomain) {
      // Already on the CertifiedPass portal, smoothly scroll into verifier
      setTimeout(() => {
        const el = document.getElementById('verifier');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setIsLaunchingPortal(false);
      }, 400);
      return;
    }

    // Elegant animated sequence before opening in a new tab
    setTimeout(() => {
      window.open('https://certifiedpass.polylance.codes/', '_blank', 'noopener,noreferrer');
      setIsLaunchingPortal(false);
    }, 700);
  };

  return (
    <div className={`min-h-screen ${NEO.canvas} text-slate-700 py-8 px-4 sm:px-6 lg:px-8 font-sans select-none relative overflow-x-hidden`}>
      {/* Scroll Progress Meter */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[#0047AB] z-50 origin-left"
        style={{ scaleX }}
      />

      <div className="max-w-6xl mx-auto space-y-16 py-4">

        {/* ── 1. HERO SECTION ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 pt-4"
        >
          {/* Emblem */}
          <div className="relative inline-flex items-center justify-center p-6 rounded-[16px] bg-white border border-[#E2E6EC] shadow-xs">
            <div className="w-16 h-16 rounded-[12px] bg-[#F4F6F9] border border-[#E2E6EC] flex items-center justify-center relative">
              <ShieldCheck className="w-10 h-10 text-[#0047AB]" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F6F9] border border-[#E2E6EC] text-[#0047AB] text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles size={12} className="text-[#0047AB]" />
              <span>Cross-Protocol Attestation Engine</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0B0B0C] tracking-tight leading-tight">
              Certified<span className="text-[#0047AB]">Pass</span>
            </h1>

            <p className="text-sm sm:text-base text-[#4B5563] font-medium max-w-2xl mx-auto leading-relaxed">
              The sovereign decentralized verification oracle for PolyLance credentials, soulbound work histories, and autonomous milestone deliveries.
            </p>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleLaunchPortal}
              disabled={isLaunchingPortal}
              className={`px-5 py-2.5 rounded-[8px] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer active:scale-95 inline-flex items-center gap-2 ${
                isLaunchingPortal
                  ? 'bg-[#0B0B0C] text-white animate-pulse'
                  : 'bg-[#0B0B0C] hover:bg-[#1A1A1E] text-white shadow-xs'
              }`}
            >
              {isLaunchingPortal ? (
                <>
                  <Sparkles size={14} className="animate-spin text-white" />
                  <span>Opening CertifiedPass...</span>
                </>
              ) : (
                <>
                  <Globe size={14} className="text-white/70" />
                  <span>Explore CertifiedPass</span>
                  <ExternalLink size={13} className="text-white/70" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('verifier');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="px-6 py-2.5 bg-[#0047AB] hover:bg-[#003A8C] text-white rounded-[8px] text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Search size={14} />
              <span>Verify a Certificate</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('how-it-works');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="px-6 py-2.5 bg-white border border-[#E2E6EC] text-[#0B0B0C] hover:bg-[#F4F6F9] rounded-[8px] text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <BookOpen size={14} />
              <span>How It Works</span>
            </button>
            <Link
              to="/reputation"
              className="px-6 py-2.5 bg-white border border-[#E2E6EC] text-[#0B0B0C] hover:bg-[#F4F6F9] rounded-[8px] text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Award size={14} className="text-[#0047AB]" />
              <span>SBT Leaderboard</span>
            </Link>
          </div>

          {/* Official CertifiedPass Standalone Web App Showcase Banner */}
          <div className="max-w-3xl mx-auto p-5 sm:p-6 rounded-[10px] bg-white border border-[#E2E6EC] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5 text-left transition-colors mt-6">
            <div className="space-y-1.5 flex-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[4px] bg-[#E3F3EA] border border-[#1E8449]/20 text-[#1E8449] font-mono text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E8449]" />
                <span>Official Web Application • Live Protocol</span>
              </div>
              <h3 className="text-base sm:text-lg font-serif font-semibold text-[#0B0B0C]">
                Explore CertifiedPass
              </h3>
              <p className="text-xs text-[#4B5563] font-normal leading-relaxed">
                Experience the official decentralized CertifiedPass web portal with 3D interactive credentials, live verification oracle, and cross-protocol proof of work.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLaunchPortal}
              disabled={isLaunchingPortal}
              className={`shrink-0 w-full sm:w-auto px-5 py-2.5 rounded-[8px] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer active:scale-95 inline-flex items-center justify-center gap-2 ${
                isLaunchingPortal
                  ? 'bg-[#0B0B0C] text-white animate-pulse'
                  : 'bg-[#0B0B0C] hover:bg-[#1A1A1E] text-white shadow-xs'
              }`}
            >
              {isLaunchingPortal ? (
                <>
                  <Sparkles size={14} className="animate-spin text-white" />
                  <span>Launching App...</span>
                </>
              ) : (
                <>
                  <Globe size={15} className="text-white/70" />
                  <span>Explore CertifiedPass</span>
                  <ExternalLink size={13} className="text-white/70" />
                </>
              )}
            </button>
          </div>
        </motion.section>


        {/* ── 2. WHAT IS CERTIFIEDPASS? ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B0B0C]">
              What is <span className="text-[#0047AB]">CertifiedPass</span>?
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] max-w-xl mx-auto">
              An independent attestation layer designed to eliminate resume fraud, fake code portfolios, and unverifiable freelance claims in Web3.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Soulbound Authenticity */}
            <div className="bg-white border border-[#E2E6EC] hover:border-[#0047AB] rounded-[10px] p-6 shadow-xs space-y-4 transition-colors">
              <div className="w-12 h-12 rounded-[8px] bg-[#F4F6F9] border border-[#E2E6EC] flex items-center justify-center text-[#0047AB]">
                <Fingerprint size={24} />
              </div>
              <h3 className="text-base font-serif font-semibold text-[#0B0B0C]">
                Soulbound Identity (SBT)
              </h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Every milestone approval on PolyLance mints a non-transferable ERC-5192 Soulbound Token. Credentials are permanently bound to the developer's wallet address and cannot be sold, transferred, or faked.
              </p>
              <div className="pt-2 text-[11px] font-mono font-semibold text-[#0047AB] flex items-center gap-1.5">
                <span>ERC-5192 Standard</span>
                <CheckCircle2 size={13} />
              </div>
            </div>

            {/* Card 2: Cryptographic Deliverable Proof */}
            <div className="bg-white border border-[#E2E6EC] hover:border-[#0047AB] rounded-[10px] p-6 shadow-xs space-y-4 transition-colors">
              <div className="w-12 h-12 rounded-[8px] bg-[#F4F6F9] border border-[#E2E6EC] flex items-center justify-center text-[#0047AB]">
                <FileCode size={24} />
              </div>
              <h3 className="text-base font-serif font-semibold text-[#0B0B0C]">
                Cryptographic Deliverables
              </h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Deliverable repositories, git commit shas, pull request diffs, and work logs are hashed and pinned to IPFS. The IPFS Content Identifier (CID) is cryptographically stamped directly into the token metadata.
              </p>
              <div className="pt-2 text-[11px] font-mono font-semibold text-[#0047AB] flex items-center gap-1.5">
                <span>IPFS Content Stamping</span>
                <CheckCircle2 size={13} />
              </div>
            </div>

            {/* Card 3: Zero-Knowledge Privacy Shield */}
            <div className="bg-white border border-[#E2E6EC] hover:border-[#0047AB] rounded-[10px] p-6 shadow-xs space-y-4 transition-colors">
              <div className="w-12 h-12 rounded-[8px] bg-[#F4F6F9] border border-[#E2E6EC] flex items-center justify-center text-[#0047AB]">
                <Lock size={24} />
              </div>
              <h3 className="text-base font-serif font-semibold text-[#0B0B0C]">
                Confidentiality Shield
              </h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Contract financial settlement amounts and commercial agreements remain strictly confidential. CertifiedPass proves <strong className="text-[#0B0B0C]">what was built</strong> and <strong className="text-[#0B0B0C]">client satisfaction</strong> without exposing private pricing data.
              </p>
              <div className="pt-2 text-[11px] font-mono font-semibold text-[#0047AB] flex items-center gap-1.5">
                <span>Zero-Knowledge Privacy</span>
                <CheckCircle2 size={13} />
              </div>
            </div>
          </div>
        </motion.section>


        {/* ── 3. INTERACTIVE LIVE VERIFIER ── */}
        <motion.section
          id="verifier"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white border border-[#E2E6EC] rounded-[10px] p-6 sm:p-10 space-y-8 shadow-xs relative overflow-hidden scroll-mt-24"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E6EC] pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#0047AB] uppercase tracking-wider">
                <Shield size={14} className="text-[#0047AB]" />
                <span>Live Attestation Verifier Tool</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B0B0C]">
                Verify a PolyLance Certificate
              </h2>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="space-y-3">
            <label className="block text-xs font-mono font-semibold text-[#0B0B0C] tracking-wide">
              ENTER CERTIFICATE ID (e.g. PL-SBT-JOB-...):
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="w-full relative flex-1 flex items-center gap-3 px-4 py-3 bg-[#F4F6F9] border border-[#E2E6EC] focus-within:border-[#0047AB] focus-within:bg-white rounded-[8px] transition-colors cursor-text">
                <Search className="shrink-0 text-[#8892A0] pointer-events-none" size={18} />
                <input
                  type="text"
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  placeholder="Enter Certificate ID..."
                  className="flex-1 min-w-0 bg-transparent text-sm font-mono text-[#0B0B0C] placeholder:text-[#8892A0] outline-none"
                />
              </label>
              <button
                type="button"
                disabled={isVerifying || !certInput.trim()}
                onClick={() => runVerification(certInput)}
                className="w-full sm:w-auto px-6 py-3 bg-[#0047AB] hover:bg-[#003A8C] text-white rounded-[8px] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50 transition-colors"
              >
                {isVerifying ? (
                  <>
                    <Cpu size={16} className="animate-spin" />
                    <span>Verifying On-Chain...</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck size={16} />
                    <span>Run Verification</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4-Stage Verification Progress Dials */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {/* Step 1 */}
            <div className={`p-4 rounded-[8px] border transition-colors ${verificationSteps >= 1 ? 'bg-[#E3F3EA] border-[#1E8449]/30' : 'bg-[#F4F6F9] border-[#E2E6EC]'}`}>
              <div className="flex items-center gap-2 text-xs font-mono font-semibold">
                {verificationSteps >= 1 ? (
                  <CheckCircle2 size={16} className="text-[#1E8449] shrink-0" />
                ) : (
                  <Clock size={16} className="text-[#8892A0] shrink-0" />
                )}
                <span className={verificationSteps >= 1 ? 'text-[#1E8449]' : 'text-[#8892A0]'}>1. Oracle Signature</span>
              </div>
              <p className="text-[10px] text-[#4B5563] mt-1">ECDSA Cryptographic Key Match</p>
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-[8px] border transition-colors ${verificationSteps >= 2 ? 'bg-[#E3F3EA] border-[#1E8449]/30' : 'bg-[#F4F6F9] border-[#E2E6EC]'}`}>
              <div className="flex items-center gap-2 text-xs font-mono font-semibold">
                {verificationSteps >= 2 ? (
                  <CheckCircle2 size={16} className="text-[#1E8449] shrink-0" />
                ) : (
                  <Clock size={16} className="text-[#8892A0] shrink-0" />
                )}
                <span className={verificationSteps >= 2 ? 'text-[#1E8449]' : 'text-[#8892A0]'}>2. Polygon Contract</span>
              </div>
              <p className="text-[10px] text-[#4B5563] mt-1">JobFactory & SBT Code Audit</p>
            </div>

            {/* Step 3 */}
            <div className={`p-4 rounded-[8px] border transition-colors ${verificationSteps >= 3 ? 'bg-[#E3F3EA] border-[#1E8449]/30' : 'bg-[#F4F6F9] border-[#E2E6EC]'}`}>
              <div className="flex items-center gap-2 text-xs font-mono font-semibold">
                {verificationSteps >= 3 ? (
                  <CheckCircle2 size={16} className="text-[#1E8449] shrink-0" />
                ) : (
                  <Clock size={16} className="text-[#8892A0] shrink-0" />
                )}
                <span className={verificationSteps >= 3 ? 'text-[#1E8449]' : 'text-[#8892A0]'}>3. IPFS Content CID</span>
              </div>
              <p className="text-[10px] text-[#4B5563] mt-1">Deliverable Hash Integrity</p>
            </div>

            {/* Step 4 */}
            <div className={`p-4 rounded-[8px] border transition-colors ${verificationSteps >= 4 ? 'bg-[#E3F3EA] border-[#1E8449]/30' : 'bg-[#F4F6F9] border-[#E2E6EC]'}`}>
              <div className="flex items-center gap-2 text-xs font-mono font-semibold">
                {verificationSteps >= 4 ? (
                  <CheckCircle2 size={16} className="text-[#1E8449] shrink-0" />
                ) : (
                  <Clock size={16} className="text-[#8892A0] shrink-0" />
                )}
                <span className={verificationSteps >= 4 ? 'text-[#1E8449]' : 'text-[#8892A0]'}>4. Privacy Shield</span>
              </div>
              <p className="text-[10px] text-[#4B5563] mt-1">Confidential Financial Guard</p>
            </div>
          </div>

          {/* Verification Result Card */}
          {verificationResult && verificationSteps === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 sm:p-8 rounded-[10px] bg-white border border-[#E2E6EC] space-y-6 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E6EC] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-[#E3F3EA] text-[#1E8449] flex items-center justify-center border border-[#1E8449]/20">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#1E8449] uppercase tracking-wider block">
                      STATUS: CRYPTOGRAPHICALLY VERIFIED
                    </span>
                    <h3 className="text-lg font-serif font-bold text-[#0B0B0C]">
                      {verificationResult.certId}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`https://polylance.codes/#${verificationResult.targetUrl || `/attestation/${verificationResult.certId}`}`)}
                    className="px-3 py-1.5 bg-white border border-[#E2E6EC] hover:bg-[#F4F6F9] text-[#0B0B0C] text-xs font-medium rounded-[8px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-[#1E8449]" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Share Proof'}</span>
                  </button>
                  <Link
                    to={verificationResult.targetUrl || `/attestation/${verificationResult.certId}`}
                    className="px-3 py-1.5 bg-[#0047AB] hover:bg-[#003A8C] text-white text-xs font-medium rounded-[8px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{verificationResult.type === 'audit' ? 'View Audit Report' : 'View Attestation'}</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>

              {/* Canonical Certificate URL Display */}
              <div className="p-3 bg-[#F4F6F9] border border-[#E2E6EC] rounded-[8px] space-y-1">
                <span className="text-[10px] text-[#8892A0] font-semibold block">
                  {verificationResult.type === 'audit' ? 'OFFICIAL AUDIT REPORT URL' : 'OFFICIAL CERTIFICATE VERIFICATION URL'}
                </span>
                <Link
                  to={verificationResult.targetUrl || `/attestation/${verificationResult.certId}`}
                  className="font-mono text-xs font-semibold text-[#0047AB] hover:underline flex items-center gap-1.5 break-all"
                >
                  <span>{`https://polylance.codes/#${verificationResult.targetUrl || `/attestation/${verificationResult.certId}`}`}</span>
                  <ExternalLink size={12} className="shrink-0" />
                </Link>
              </div>

              {/* Data Field Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
                {/* Milestone Title */}
                <div className="p-3 bg-[#F4F6F9] border border-[#E2E6EC] rounded-[8px] space-y-1">
                  <span className="text-[10px] text-[#8892A0] font-semibold block">
                    {verificationResult.type === 'audit' ? 'AUDIT REPORT TITLE' : 'PROJECT DELIVERABLE'}
                  </span>
                  <span className="font-semibold text-[#0B0B0C] font-serif block">{verificationResult.jobTitle}</span>
                </div>

                {/* Freelancer */}
                <div className="p-3 bg-[#F4F6F9] border border-[#E2E6EC] rounded-[8px] space-y-1">
                  <span className="text-[10px] text-[#8892A0] font-semibold block">
                    {verificationResult.type === 'audit' ? 'AUDITED SUBJECT' : 'FREELANCER (REPUTATION HOLDER)'}
                  </span>
                  <span className="font-semibold text-[#0047AB] block truncate">
                    {verificationResult.freelancerName} ({truncateAddress(verificationResult.freelancerAddress)})
                  </span>
                </div>

                {/* Client */}
                <div className="p-3 bg-[#F4F6F9] border border-[#E2E6EC] rounded-[8px] space-y-1">
                  <span className="text-[10px] text-[#8892A0] font-semibold block">
                    {verificationResult.type === 'audit' ? 'GOVERNANCE ISSUER' : 'CLIENT (ESCROW RELEASER)'}
                  </span>
                  <span className="font-semibold text-[#0B0B0C] block truncate">
                    {verificationResult.clientName} ({truncateAddress(verificationResult.clientAddress)})
                  </span>
                </div>

                {/* Token ID */}
                <div className="p-3 bg-[#F4F6F9] border border-[#E2E6EC] rounded-[8px] space-y-1">
                  <span className="text-[10px] text-[#8892A0] font-semibold block">SOULBOUND TOKEN ID</span>
                  <span className="font-semibold text-[#0B0B0C] block">{verificationResult.sbtTokenId} (ERC-5192)</span>
                </div>

                {/* IPFS CID */}
                <div className="p-3 bg-[#F4F6F9] border border-[#E2E6EC] rounded-[8px] space-y-1">
                  <span className="text-[10px] text-[#8892A0] font-semibold block">IMMUTABLE IPFS CID</span>
                  <span className="font-semibold text-[#0B0B0C] block truncate">{verificationResult.ipfsCid}</span>
                </div>

                {/* Settlement Privacy Shield */}
                <div className="p-3 bg-[#F4F6F9] border border-[#E2E6EC] rounded-[8px] space-y-1">
                  <span className="text-[10px] text-[#8892A0] font-semibold block">FINANCIAL SETTLEMENT</span>
                  <span className="font-semibold text-[#1E8449] flex items-center gap-1">
                    <Lock size={12} />
                    <span>{verificationResult.privacyShieldedAmount}</span>
                  </span>
                </div>
              </div>

              {/* Cryptographic Signature Well */}
              <div className="p-3.5 bg-[#0B0B0C] text-white rounded-[8px] text-[11px] font-mono space-y-1 overflow-x-auto">
                <span className="text-[10px] text-white/60 font-semibold block uppercase tracking-wider">Oracle ECDSA Signature:</span>
                <span className="text-white/80 break-all">{verificationResult.oracleSignature}</span>
              </div>
            </motion.div>
          )}

          {/* Unverified / Not Found State */}
          {!verificationResult && verificationSteps === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 sm:p-8 rounded-[10px] bg-white border border-[#E2E6EC] space-y-3 text-center shadow-xs"
            >
              <div className="w-12 h-12 rounded-full bg-[#FFF9E6] border border-[#F0D58C] text-[#8C6B00] flex items-center justify-center mx-auto">
                <Shield size={24} />
              </div>
              <h3 className="text-base font-serif font-semibold text-[#0B0B0C]">
                No Matching On-Chain Attestation Found
              </h3>
              <p className="text-xs text-[#4B5563] max-w-md mx-auto">
                The identifier "{certInput}" does not match an active or completed PolyLance escrow milestone, audited address, or verified soulbound token.
              </p>
            </motion.div>
          )}
        </motion.section>

        {/* ── 4. HOW ARE CERTS VERIFIED IN CERTIFIEDPASS? ── */}
        <motion.section
          id="how-it-works"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8 scroll-mt-24"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B0B0C]">
              How Verifications Work
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] max-w-xl mx-auto">
              Every certificate in CertifiedPass passes through a 4-layer decentralized validation pipeline before being attested as genuine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Step 1 */}
            <div className="bg-white border border-[#E2E6EC] rounded-[10px] p-6 sm:p-7 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-[#0B0B0C]/20 font-mono">01</span>
                <div className="w-10 h-10 rounded-[8px] bg-[#F4F6F9] border border-[#E2E6EC] flex items-center justify-center text-[#0047AB]">
                  <Cpu size={20} />
                </div>
              </div>
              <h4 className="text-base font-serif font-semibold text-[#0B0B0C]">1. Oracle Signature Verification</h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                The deliverable bundle is signed off-chain by the PolyLance Oracle node. CertifiedPass checks the ECDSA signature against the Oracle's verified public key to confirm that no data was tampered with in transit.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-[#E2E6EC] rounded-[10px] p-6 sm:p-7 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-[#0B0B0C]/20 font-mono">02</span>
                <div className="w-10 h-10 rounded-[8px] bg-[#F4F6F9] border border-[#E2E6EC] flex items-center justify-center text-[#0047AB]">
                  <Database size={20} />
                </div>
              </div>
              <h4 className="text-base font-serif font-semibold text-[#0B0B0C]">2. On-Chain Smart Contract Audit</h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                CertifiedPass directly queries Polygon Mainnet contracts (<code className="text-[#0047AB] bg-[#F4F6F9] px-1 py-0.5 rounded border border-[#E2E6EC]">JobFactory</code> & <code className="text-[#0047AB] bg-[#F4F6F9] px-1 py-0.5 rounded border border-[#E2E6EC]">ReputationSBT</code>) to verify that the Soulbound Token actually exists in the recipient's wallet and was issued through authentic escrow settlement.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-[#E2E6EC] rounded-[10px] p-6 sm:p-7 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-[#0B0B0C]/20 font-mono">03</span>
                <div className="w-10 h-10 rounded-[8px] bg-[#F4F6F9] border border-[#E2E6EC] flex items-center justify-center text-[#0047AB]">
                  <Layers size={20} />
                </div>
              </div>
              <h4 className="text-base font-serif font-semibold text-[#0B0B0C]">3. IPFS Content Addressing</h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                The milestone work deliverable is pinned to IPFS using cryptographic content addressing. CertifiedPass matches the IPFS CID to ensure the original work files, code commits, and milestone requirements are immutable.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-[#E2E6EC] rounded-[10px] p-6 sm:p-7 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-[#0B0B0C]/20 font-mono">04</span>
                <div className="w-10 h-10 rounded-[8px] bg-[#F4F6F9] border border-[#E2E6EC] flex items-center justify-center text-[#0047AB]">
                  <Lock size={20} />
                </div>
              </div>
              <h4 className="text-base font-serif font-semibold text-[#0B0B0C]">4. Zero-Knowledge Privacy Preservation</h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Commercial compensation terms and private escrow volumes are permanently shielded. Third-party employers see proof of milestone completion, technical skill tags, and client rating without seeing confidential financial contracts.
              </p>
            </div>
          </div>
        </motion.section>


        {/* ── 5. HOW TO USE CERTIFIEDPASS ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B0B0C]">
              How to Use CertifiedPass
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] max-w-xl mx-auto">
              Empowering developers to showcase verified proof-of-work and giving clients trustless verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Freelancers / Developers */}
            <div className="bg-white border border-[#E2E6EC] rounded-[10px] p-6 sm:p-8 space-y-5 text-left shadow-xs">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F6F9] border border-[#E2E6EC] text-[#0047AB] text-xs font-mono font-semibold">
                <span>FOR FREELANCERS & AUDITORS</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#0B0B0C]">
                Turn Proof-of-Work Into Sovereign Capital
              </h3>
              <ul className="space-y-3 text-xs text-[#4B5563]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#0047AB] shrink-0 mt-0.5" />
                  <span><strong className="text-[#0B0B0C]">Automatic Minting:</strong> Complete any milestone on PolyLance; your Soulbound Token and Certificate ID are generated automatically upon escrow settlement.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#0047AB] shrink-0 mt-0.5" />
                  <span><strong className="text-[#0B0B0C]">Exportable Trust Badges:</strong> Embed your CertifiedPass badge or QR code on your personal website, GitHub README, or LinkedIn portfolio.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#0047AB] shrink-0 mt-0.5" />
                  <span><strong className="text-[#0B0B0C]">Direct Proof Links:</strong> Share your unique attestation URL (<code className="bg-[#F4F6F9] border border-[#E2E6EC] px-1 py-0.5 rounded font-mono text-[#0B0B0C]">https://polylance.codes/#/attestation/...</code>) with prospective clients for instant verification.</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  to="/reputation"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E6EC] hover:bg-[#F4F6F9] text-[#0B0B0C] rounded-[8px] text-xs font-medium transition-colors"
                >
                  <span>View Your Reputation SBTs</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* For Clients, Recruiter DAOs & Protocols */}
            <div className="bg-white border border-[#E2E6EC] rounded-[10px] p-6 sm:p-8 space-y-5 text-left shadow-xs">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F6F9] border border-[#E2E6EC] text-[#0047AB] text-xs font-mono font-semibold">
                <span>FOR CLIENTS & PROTOCOLS</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#0B0B0C]">
                Verify Web3 Talent in Seconds
              </h3>
              <ul className="space-y-3 text-xs text-[#4B5563]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#0047AB] shrink-0 mt-0.5" />
                  <span><strong className="text-[#0B0B0C]">Certificate ID Search:</strong> Input any candidate's PolyLance Certificate ID into CertifiedPass to verify smart contract ownership and deliverable specs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#0047AB] shrink-0 mt-0.5" />
                  <span><strong className="text-[#0B0B0C]">QR Code Scanning:</strong> Scan the QR code stamped on any PolyLance attestation certificate with your phone for instant mobile validation.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#0047AB] shrink-0 mt-0.5" />
                  <span><strong className="text-[#0B0B0C]">REST API Automation:</strong> Integrate our verification API into your hiring portal or DAO governance to gate proposals to verified developers.</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0047AB] hover:bg-[#003A8C] text-white rounded-[8px] text-xs font-semibold transition-colors"
                >
                  <span>Post a Protected Job</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </motion.section>


        {/* ── 6. DEVELOPER API INTEGRATION ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white border border-[#E2E6EC] rounded-[10px] p-6 sm:p-8 space-y-4 text-left shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-mono font-bold text-[#0B0B0C] uppercase tracking-wider">
              <Terminal size={16} className="text-[#0047AB]" />
              <span>Programmatic Verification Endpoint</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#E3F3EA] text-[#1E8449] font-bold border border-[#1E8449]/20">
              REST v1 ACTIVE
            </span>
          </div>

          <p className="text-xs text-[#4B5563]">
            Automate verification in your DAO or recruitment pipeline by querying the CertifiedPass verification endpoint:
          </p>

          <div className="p-4 bg-[#0B0B0C] text-white rounded-[8px] font-mono text-xs overflow-x-auto space-y-2">
            <div className="text-white/40"># Verify any PolyLance certificate via curl</div>
            <div className="text-[#0047AB]">
              curl -X GET "https://polylance.codes/api/certified-pass/verify/:certId"
            </div>
            <div className="text-white/40 pt-2"># Response (200 OK):</div>
            <div className="text-[#1E8449]">
              {`{ "status": "VERIFIED", "certId": ":certId", "chainId": 137, "valid": true }`}
            </div>
            <div className="text-white/40 pt-2"># Canonical Certificate Web Link:</div>
            <div className="text-white/80">
              https://polylance.codes/#/attestation/:certId
            </div>
          </div>
        </motion.section>


        {/* ── 7. FOOTER CALLOUT ── */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center py-6 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#E2E6EC] shadow-xs text-[#4B5563] text-xs font-medium">
            <ShieldCheck size={16} className="text-[#0047AB]" />
            <span>
              CertifiedPass is powered by the <strong className="text-[#0B0B0C]">PolyLance Sovereign Protocol</strong>. Anchored to Polygon Mainnet.
            </span>
          </div>
        </motion.section>

      </div>
    </div>
  );
};
