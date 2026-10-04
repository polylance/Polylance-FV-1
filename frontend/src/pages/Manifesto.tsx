import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, ShieldCheck, Lock, Scale, 
  ArrowRight, Award, Cpu, TrendingUp, Code2, CheckCircle2, Users, LineChart, ExternalLink, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Manifesto: React.FC = () => {
  const teamMembers = [
    {
      id: 'akhil',
      initials: 'AM',
      name: 'Akhil Muvva',
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
    <div className="bg-[#F8FAFC] text-[#111827] min-h-screen py-10 md:py-14 font-sans select-none relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto space-y-16 sm:space-y-20 relative z-10">
        
        {/* SECTION 1: MANIFESTO HERO HEADER */}
        <section className="text-center max-w-4xl mx-auto space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-full text-xs font-mono font-bold uppercase tracking-widest shadow-3xs"
          >
            <Sparkles size={13} className="text-[#0047AB] animate-pulse" />
            <span>The PolyLance Protocol Manifesto</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-headline text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-900"
          >
            DECENTRALIZING THE{' '}
            <span className="text-[#0047AB]">
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
                        <div className={`w-16 h-16 sm:w-18 sm:h-18 ${m.avatarBg} rounded-full flex items-center justify-center shadow-md ${m.avatarShadow} border-2 border-white transform group-hover:scale-105 transition-transform duration-300`}>
                          <span className="font-headline font-black text-white text-2xl tracking-tight drop-shadow-sm">
                            {m.initials}
                          </span>
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

        {/* SECTION 4: CALL TO ACTION FOOTER BANNER */}
        <section className="bg-[#0B0B0C] text-white rounded-3xl p-8 sm:p-10 text-center space-y-5 relative overflow-hidden shadow-xl">
          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <h3 className="font-headline font-black text-2xl sm:text-3xl text-white">
              Ready to Join the Decentralized Work Revolution?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-sans font-medium">
              Start freelancing or hiring talent with on-chain escrows and permanent soulbound reputation.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/jobs"
                className="px-8 py-3.5 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-headline font-bold text-sm flex items-center gap-2 shadow-lg transition-all hover:scale-105 cursor-pointer"
              >
                <span>Browse Marketplace</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/security"
                className="px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-headline font-bold text-sm transition-all hover:scale-105 cursor-pointer"
              >
                Inspect Contract Audits
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
