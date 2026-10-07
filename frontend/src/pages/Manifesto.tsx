import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ShieldCheck, Lock, Scale, 
  ArrowRight, Award, Cpu, TrendingUp, Code2, CheckCircle2, Users, LineChart, ExternalLink, Shield,
  X, Maximize2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Manifesto: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string; role: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    if (selectedImage) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  const teamMembers = [
    {
      id: 'akhil',
      initials: 'AM',
      name: 'Akhil Muvva',
      image: '/akhil-avatar.png',
      fullImage: '/founder-akhil.png',
      role: 'Founder & CEO / CTO',
      specialty: 'PROTOCOL ARCHITECTURE',
      productBadge: {
        name: 'AuditX',
        label: 'Security Engine',
        link: '/auditx',
        title: 'Explore AuditX Automated Security Engine',
        icon: ShieldCheck,
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100 hover:border-emerald-300',
        dotClass: 'bg-emerald-500',
        iconClass: 'text-emerald-600',
      },
      icon: Cpu,
      accentColor: 'blue',
      specialtyColor: 'text-[#0047AB]',
      badgeStyle: 'bg-slate-100 text-slate-800 border-slate-200',
      avatarBg: 'bg-[#0B0B0C]',
      avatarShadow: 'shadow-slate-900/10',
      avatarRing: 'bg-slate-100 border-slate-200',
      iconStyle: 'bg-slate-100 text-[#0047AB] border-slate-200',
      bottomAccent: 'border-b-[#0047AB]',
      headingColor: 'text-slate-900',
      checkColor: 'text-[#0047AB]',
      bio: 'Lead Architect of the PolyLance protocol & Creator of AuditX. Pioneering sovereign identity, smart contract escrows, and automated bytecode security verification.',
      strengths: [
        'Smart Contract Architecture',
        'AuditX Security Framework',
        'Protocol & RWA Escrow Design'
      ]
    },
    {
      id: 'balram',
      initials: 'BT',
      name: 'Balram Taddi',
      role: 'Chief Security Officer (CSO)',
      specialty: 'CROSS-CHAIN STRATEGY',
      icon: ShieldCheck,
      accentColor: 'slate',
      specialtyColor: 'text-slate-700',
      badgeStyle: 'bg-slate-100 text-slate-800 border-slate-200',
      avatarBg: 'bg-[#0B0B0C]',
      avatarShadow: 'shadow-slate-900/10',
      avatarRing: 'bg-slate-100 border-slate-200',
      iconStyle: 'bg-slate-100 text-slate-700 border-slate-200',
      bottomAccent: 'border-b-slate-700',
      headingColor: 'text-slate-900',
      checkColor: 'text-slate-700',
      bio: 'Chief Security Officer. Safeguarding protocol expansion, cross-chain interoperability, and enterprise infrastructure across the multichain ecosystem.',
      strengths: [
        'Cross-Chain Interoperability',
        'Security Architecture',
        'Ecosystem Expansion'
      ]
    },
    {
      id: 'neeraj',
      initials: 'NC',
      name: 'Neeraj Chennamsetty',
      role: 'Chief Financial Officer (CFO)',
      specialty: 'FINANCIAL STRATEGY',
      icon: LineChart,
      accentColor: 'amber',
      specialtyColor: 'text-amber-700',
      badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
      avatarBg: 'bg-[#0B0B0C]',
      avatarShadow: 'shadow-slate-900/10',
      avatarRing: 'bg-amber-50 border-amber-200',
      iconStyle: 'bg-amber-50 text-amber-700 border-amber-200',
      bottomAccent: 'border-b-amber-600',
      headingColor: 'text-slate-900',
      checkColor: 'text-amber-700',
      bio: 'Chief Financial Officer. Spearheading capital architecture, sustainable tokenomics, treasury reserves, and enterprise Web3 business modeling.',
      strengths: [
        'Business Strategies',
        'Financial Growth & Modeling',
        'Treasury & Capital Management'
      ]
    },
    {
      id: 'sunny',
      initials: 'SP',
      name: 'Sunny Pasumarthi',
      image: '/sunny-avatar.png',
      fullImage: '/dev.sunny.png',
      role: 'CMO & Lead Frontend Developer',
      specialty: 'FRONTEND ARCHITECTURE',
      productBadge: {
        name: 'CertifiedPass',
        label: 'Credential Oracle',
        link: '/certifiedpass',
        title: 'Explore CertifiedPass On-Chain Credential Oracle',
        icon: Award,
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 hover:border-slate-300',
        dotClass: 'bg-[#0047AB]',
        iconClass: 'text-[#0047AB]',
      },
      icon: Code2,
      accentColor: 'blue',
      specialtyColor: 'text-[#0047AB]',
      badgeStyle: 'bg-slate-100 text-slate-800 border-slate-200',
      avatarBg: 'bg-[#0B0B0C]',
      avatarShadow: 'shadow-slate-900/10',
      avatarRing: 'bg-slate-100 border-slate-200',
      iconStyle: 'bg-slate-100 text-[#0047AB] border-slate-200',
      bottomAccent: 'border-b-[#0047AB]',
      headingColor: 'text-slate-900',
      checkColor: 'text-[#0047AB]',
      bio: 'Chief Marketing Officer & Lead Frontend Developer for PolyLance & Creator of CertifiedPass. Crafting next-generation Web3 experiences and sovereign credential verification.',
      strengths: [
        'Web3 UI/UX Design',
        'CertifiedPass Credential Oracle',
        'Brand & Growth Marketing'
      ]
    }
  ];

  const manifestoPillars = [
    {
      title: '1. Immutable Meritocracy',
      icon: Award,
      color: 'text-[#0047AB]',
      bgColor: 'bg-slate-100 border-slate-200',
      description: 'Your career should not depend on centralized platform algorithms. Earned work history belongs to you permanently via ERC-5192 Soulbound Tokens.'
    },
    {
      title: '2. Non-Custodial Financial Escrow',
      icon: Lock,
      color: 'text-slate-800',
      bgColor: 'bg-slate-100 border-slate-200',
      description: 'No middleman holds your funds. Escrow vaults are isolated smart contract proxies (EIP-1167) that release funds strictly upon milestone verification.'
    },
    {
      title: '3. Decentralized Peer Arbitration',
      icon: Scale,
      color: 'text-slate-800',
      bgColor: 'bg-slate-100 border-slate-200',
      description: 'Disputes are judged transparently by on-chain Arbitrators governed by JudgeDAO, eliminating unfair corporate account suspensions.'
    },
    {
      title: '4. Zero Friction & Privacy',
      icon: ShieldCheck,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border-emerald-200',
      description: 'Sign in with your wallet. Zero invasive KYC or personal data collection. End-to-end encrypted negotiation chat via XMTP protocol.'
    }
  ];

  return (
    <div className="bg-transparent text-[#111827] w-full font-sans select-none relative overflow-hidden py-4 pb-16">
      
      <div className="w-full space-y-16 sm:space-y-20 relative z-10">
        
        {/* SECTION 1: MANIFESTO HERO HEADER */}
        <section className="text-center max-w-4xl mx-auto space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#EBF3FF] border border-[#00D2FF]/30 text-[#0047AB] rounded-full text-xs font-mono font-bold uppercase tracking-widest shadow-2xs"
          >
            <Sparkles size={13} className="text-[#0066FF] animate-pulse" />
            <span>The PolyLance Protocol Manifesto</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-headline text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-900"
          >
            DECENTRALIZING THE{' '}
            <span className="bg-gradient-to-r from-[#0047AB] via-[#0066FF] to-[#00D2FF] bg-clip-text text-transparent">
              FUTURE OF WORK
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed font-sans font-medium max-w-3xl mx-auto"
          >
            We are building a global, permissionless labor market where reputation is soulbound, payments are escrowed on-chain, and work history cannot be censored or deleted by any corporation.
          </motion.p>
        </section>

        {/* SECTION 2: 4 MANIFESTO PILLARS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {manifestoPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * idx }}
                whileHover={{ y: -5 }}
                className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs hover:border-slate-400 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
              >
                <div className={`w-12 h-12 rounded-2xl ${pillar.bgColor} border flex items-center justify-center shrink-0 shadow-3xs group-hover:scale-105 transition-transform duration-300`}>
                  <Icon size={24} className={pillar.color} />
                </div>
                <h3 className="font-headline font-bold text-lg text-slate-900">
                  {pillar.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {pillar.description}
                </p>
              </motion.div>
            );
          })}
        </section>

        {/* SECTION 3: REDESIGNED POLYLANCE CORE / EXECUTIVE TEAM SECTION */}
        <section className="space-y-10 pt-4">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-full text-xs font-mono font-bold uppercase tracking-widest shadow-2xs"
            >
              <Users size={14} className="text-[#0047AB]" />
              <span>THE POLYLANCE CORE</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="font-headline font-extrabold text-3xl sm:text-4xl md:text-5xl text-slate-900 tracking-tight"
            >
              Meet the Minds Behind PolyLance
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="text-slate-600 text-sm sm:text-base font-sans max-w-2xl mx-auto font-medium leading-relaxed"
            >
              Builders. Strategists. Innovators. United by a vision to revolutionize freelancing through decentralization.
            </motion.p>
          </div>

          {/* 4 Executive Team Member Cards Grid (Upgraded 4-column layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-7 text-left">
            {teamMembers.map((m, idx) => {
              const RoleIcon = m.icon;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * idx }}
                  whileHover={{ y: -5 }}
                  className={`bg-white border border-[#E8EAF3] rounded-[26px] p-6 sm:p-7 flex flex-col justify-between h-full space-y-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_-6px_rgba(0,0,0,0.1)] hover:border-slate-300 transition-all duration-300 relative overflow-hidden group border-b-4 ${m.bottomAccent}`}
                >
                  {/* Card Top & Body Content */}
                  <div className="space-y-5 relative z-10">
                    
                    {/* Header Row: Circular Avatar + Top-Right Role Icon */}
                    <div className="flex items-start justify-between">
                      {/* Premium Circular Avatar */}
                      <div className={`p-1 ${m.avatarRing} rounded-full border shadow-md shadow-slate-200/50`}>
                        <div
                          onClick={() => {
                            if (m.fullImage) {
                              setSelectedImage({
                                url: m.fullImage,
                                name: m.name,
                                role: m.role,
                              });
                            }
                          }}
                          onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && m.fullImage) {
                              e.preventDefault();
                              setSelectedImage({
                                url: m.fullImage,
                                name: m.name,
                                role: m.role,
                              });
                            }
                          }}
                          role={m.fullImage ? 'button' : undefined}
                          tabIndex={m.fullImage ? 0 : undefined}
                          title={m.fullImage ? `Click to view full photo of ${m.name}` : undefined}
                          aria-label={m.fullImage ? `View full photo of ${m.name}` : undefined}
                          className={`w-16 h-16 sm:w-18 sm:h-18 ${m.avatarBg} rounded-full flex items-center justify-center shadow-md ${m.avatarShadow} border-2 border-white transform group-hover:scale-105 transition-transform duration-300 overflow-hidden relative ${
                            m.fullImage ? 'cursor-pointer hover:ring-2 hover:ring-[#0047AB] focus:ring-2 focus:ring-[#0047AB] focus:outline-none' : ''
                          }`}
                        >
                          {m.image ? (
                            <>
                              <img
                                src={m.image}
                                alt={m.name}
                                className="w-full h-full object-cover rounded-full"
                                loading="eager"
                              />
                              {m.fullImage && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                                  <Maximize2 size={16} strokeWidth={2.5} className="drop-shadow-md" />
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="font-headline font-black text-white text-2xl tracking-tight drop-shadow-sm">
                              {m.initials}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Top-Right Specialty Role Icon */}
                      <div className={`p-2.5 rounded-2xl border ${m.iconStyle} shadow-2xs flex items-center justify-center shrink-0`}>
                        <RoleIcon size={18} />
                      </div>
                    </div>

                    {/* Member Specialty & Name */}
                    <div className="space-y-1.5 pt-1">
                      <span className={`font-mono text-[11px] font-extrabold tracking-wider uppercase block ${m.specialtyColor}`}>
                        {m.specialty}
                      </span>
                      
                      <h3 className="font-headline font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                        {m.name}
                      </h3>

                      {/* Role Pill Badge */}
                      <div className="pt-0.5">
                        <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-sans font-bold border ${m.badgeStyle}`}>
                          {m.role}
                        </span>
                      </div>

                      {/* Dedicated Product Venture Badge (AuditX for Akhil / CertifiedPass for Sunny) */}
                      {m.productBadge && (
                        <div className="pt-2">
                          <Link
                            to={m.productBadge.link}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-all duration-200 shadow-2xs hover:shadow-xs hover:scale-[1.02] cursor-pointer ${m.productBadge.badgeClass}`}
                            title={m.productBadge.title}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${m.productBadge.dotClass} animate-pulse`} />
                            <m.productBadge.icon size={13} className={m.productBadge.iconClass} />
                            <span className="font-extrabold tracking-tight">{m.productBadge.name}</span>
                            <span className="text-[10px] opacity-75 font-normal">({m.productBadge.label})</span>
                            <ExternalLink size={10} className="opacity-60 ml-0.5" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Member Description */}
                    <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                      "{m.bio}"
                    </p>
                  </div>

                  {/* Card Footer: Core Strengths Section */}
                  <div className="border-t border-slate-100 pt-4 space-y-2.5 relative z-10">
                    <h4 className={`font-headline font-bold text-xs uppercase tracking-wider ${m.headingColor}`}>
                      Core Strengths
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-600 font-sans font-medium">
                      {m.strengths.map((s) => (
                        <li key={s} className="flex items-center gap-2">
                          <CheckCircle2 size={14} className={`${m.checkColor} shrink-0`} />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </motion.div>
              );
            })}
          </div>



        </section>

        {/* SECTION 4: CALL TO ACTION FOOTER BANNER (REDESIGNED WITH POLYLANCE LOGO COLOR & ELECTRIC BLUE) */}
        <section className="bg-[#0B0B0C] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-2xl border border-[#0066FF]/25 hover:border-[#00D2FF]/40 transition-all duration-500 group">
          {/* Ambient PolyLance Logo & Electric Blue Radial Glows */}
          <div 
            className="absolute top-0 right-0 w-96 h-96 pointer-events-none rounded-full blur-3xl opacity-35 transition-opacity group-hover:opacity-50"
            style={{
              background: 'radial-gradient(circle, rgba(0, 210, 255, 0.4) 0%, rgba(0, 102, 255, 0.2) 40%, transparent 70%)'
            }}
          />
          <div 
            className="absolute -bottom-20 -left-20 w-96 h-96 pointer-events-none rounded-full blur-3xl opacity-30 transition-opacity group-hover:opacity-45"
            style={{
              background: 'radial-gradient(circle, rgba(0, 71, 171, 0.5) 0%, rgba(0, 102, 255, 0.15) 50%, transparent 75%)'
            }}
          />

          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            {/* Electric Protocol Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0066FF]/10 border border-[#00D2FF]/30 text-[#00D2FF] text-xs font-mono font-semibold tracking-wider uppercase shadow-[0_0_15px_rgba(0,210,255,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] animate-pulse" />
              <span>THE SOVEREIGN LABOR PROTOCOL</span>
            </div>

            {/* Glowing Gradient Headline */}
            <h3 className="font-headline font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
              Ready to Join the{' '}
              <span className="bg-gradient-to-r from-white via-[#00D2FF] to-[#0066FF] bg-clip-text text-transparent">
                Decentralized Work Revolution?
              </span>
            </h3>

            <p className="text-xs sm:text-base text-slate-300 font-sans font-medium max-w-xl mx-auto leading-relaxed">
              Start freelancing or hiring talent with on-chain escrows, instant settlement, and permanent soulbound reputation.
            </p>

            {/* High-Contrast Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
              <Link
                to="/jobs"
                className="px-8 py-3.5 bg-white hover:bg-slate-50 !text-[#0B0B0C] rounded-2xl font-headline font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-[0_4px_20px_rgba(0,102,255,0.3)] hover:shadow-[0_6px_28px_rgba(0,210,255,0.55)] transition-all hover:scale-105 cursor-pointer group/btn border border-white"
                style={{ color: '#0B0B0C' }}
              >
                <span className="!text-[#0B0B0C] font-extrabold" style={{ color: '#0B0B0C' }}>
                  Browse Marketplace
                </span>
                <ArrowRight size={17} className="!text-[#0047AB] group-hover/btn:translate-x-1 group-hover/btn:!text-[#0066FF] transition-all" />
              </Link>

              <Link
                to="/security"
                className="px-7 py-3.5 bg-white/[0.06] hover:bg-[#0066FF]/20 border border-[#0066FF]/35 hover:border-[#00D2FF]/60 !text-white rounded-2xl font-headline font-bold text-sm sm:text-base transition-all hover:scale-105 cursor-pointer flex items-center gap-2 backdrop-blur-xs shadow-xs"
              >
                <ShieldCheck size={17} className="text-[#00D2FF]" />
                <span className="text-white">Inspect Contract Audits</span>
              </Link>
            </div>

            {/* Micro Feature Badges */}
            <div className="flex flex-wrap items-center justify-center gap-5 pt-4 text-[11px] sm:text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FF]" />
                <span>Zero Custodial Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
                <span>Polygon Mainnet Escrows</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0047AB]" />
                <span>ERC-5192 Soulbound Merit</span>
              </div>
            </div>
          </div>
        </section>

      {/* Full-size Photo Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-xl w-full bg-[#0B0B0C] border border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
                aria-label="Close full photo view"
              >
                <X size={18} />
              </button>

              {/* Photo Display */}
              <div className="w-full flex items-center justify-center overflow-hidden rounded-xl bg-white/5 border border-white/10 p-1">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  className="w-full max-h-[75vh] object-contain rounded-lg"
                />
              </div>

              {/* Caption */}
              <div className="pt-3 w-full text-center">
                <h4 className="text-white font-headline font-bold text-base sm:text-lg">
                  {selectedImage.name}
                </h4>
                <p className="text-xs font-mono text-slate-400">
                  {selectedImage.role}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
};
