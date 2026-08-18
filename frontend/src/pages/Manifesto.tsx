import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, ShieldCheck, Lock, Scale, 
  ArrowRight, Award, Cpu, TrendingUp, Code2, CheckCircle2, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PolyLanceLogo } from '../components/PolyLanceLogo';

export const Manifesto: React.FC = () => {
  const teamMembers = [
    {
      id: 'akhil',
      initials: 'AM',
      name: 'Akhil Muvva',
      role: 'Founder & CEO / CTO',
      specialty: 'PROTOCOL ARCHITECTURE',
      icon: Cpu,
      accentColor: 'purple',
      specialtyColor: 'text-purple-600',
      badgeStyle: 'bg-purple-50 text-purple-700 border-purple-100',
      avatarGradient: 'from-purple-600 via-indigo-600 to-indigo-700',
      avatarShadow: 'shadow-purple-500/25',
      avatarRing: 'bg-purple-100 border-purple-200',
      iconStyle: 'bg-purple-50 text-purple-600 border-purple-100',
      bottomAccent: 'border-b-purple-600',
      headingColor: 'text-purple-700',
      checkColor: 'text-purple-600',
      bio: 'Lead Architect of the PolyLance protocol. Driven by the mission of decentralized identity, smart contract escrows, and RWA settlement.',
      strengths: [
        'Smart Contract Architecture',
        'RWA & Escrow Systems',
        'Protocol Design'
      ]
    },
    {
      id: 'jhansi',
      initials: 'JK',
      name: 'Jhansi Kupireddy',
      role: 'Co-Founder',
      specialty: 'ECOSYSTEM GROWTH',
      icon: TrendingUp,
      accentColor: 'pink',
      specialtyColor: 'text-pink-600',
      badgeStyle: 'bg-pink-50 text-pink-700 border-pink-100',
      avatarGradient: 'from-pink-500 via-rose-500 to-fuchsia-600',
      avatarShadow: 'shadow-pink-500/25',
      avatarRing: 'bg-pink-100 border-pink-200',
      iconStyle: 'bg-pink-50 text-pink-600 border-pink-100',
      bottomAccent: 'border-b-pink-500',
      headingColor: 'text-pink-700',
      checkColor: 'text-pink-600',
      bio: 'Community & Growth Lead. Building the bridges between Web3 talent and real-world opportunity across the PolyLance ecosystem.',
      strengths: [
        'Community Building',
        'Growth Strategy',
        'Ecosystem Partnerships'
      ]
    },
    {
      id: 'balram',
      initials: 'BT',
      name: 'Balram Taddi',
      role: 'CSO',
      specialty: 'CROSS-CHAIN STRATEGY',
      icon: ShieldCheck,
      accentColor: 'indigo',
      specialtyColor: 'text-indigo-600',
      badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      avatarGradient: 'from-violet-600 via-purple-700 to-indigo-800',
      avatarShadow: 'shadow-indigo-500/25',
      avatarRing: 'bg-indigo-100 border-indigo-200',
      iconStyle: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      bottomAccent: 'border-b-indigo-600',
      headingColor: 'text-indigo-700',
      checkColor: 'text-indigo-600',
      bio: 'Protocol Strategist & Chief Security Officer. Mapping the expansion, cross-chain interoperability, and security of PolyLance across the multichain ecosystem.',
      strengths: [
        'Cross-Chain Interoperability',
        'Security Strategy',
        'Ecosystem Expansion'
      ]
    },
    {
      id: 'sunny',
      initials: 'SP',
      name: 'Sunny Pasumarthi',
      role: 'CMO & Lead Frontend Developer',
      specialty: 'FRONTEND ARCHITECTURE',
      icon: Code2,
      accentColor: 'teal',
      specialtyColor: 'text-teal-600',
      badgeStyle: 'bg-teal-50 text-teal-700 border-teal-100',
      avatarGradient: 'from-emerald-500 via-teal-600 to-cyan-600',
      avatarShadow: 'shadow-teal-500/25',
      avatarRing: 'bg-teal-100 border-teal-200',
      iconStyle: 'bg-teal-50 text-teal-600 border-teal-100',
      bottomAccent: 'border-b-teal-500',
      headingColor: 'text-teal-700',
      checkColor: 'text-teal-600',
      bio: 'Chief Marketing Officer & Lead Frontend Developer for PolyLance. Crafting high-performance UI/UX, responsive Web3 interfaces, and global brand adoption.',
      strengths: [
        'Web3 UI/UX Design',
        'Frontend Architecture',
        'Brand & Growth Marketing'
      ]
    }
  ];

  const manifestoPillars = [
    {
      title: '1. Immutable Meritocracy',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-100',
      description: 'Your career should not depend on centralized platform algorithms. Earned work history belongs to you permanently via ERC-5192 Soulbound Tokens.'
    },
    {
      title: '2. Non-Custodial Financial Escrow',
      icon: Lock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-100',
      description: 'No middleman holds your funds. Escrow vaults are isolated smart contract proxies (EIP-1167) that release funds strictly upon milestone verification.'
    },
    {
      title: '3. Decentralized Peer Arbitration',
      icon: Scale,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 border-rose-100',
      description: 'Disputes are judged transparently by on-chain Arbitrators governed by JudgeDAO, eliminating unfair corporate account suspensions.'
    },
    {
      title: '4. Zero Friction & Privacy',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-100',
      description: 'Sign in with your wallet. Zero invasive KYC or personal data collection. End-to-end encrypted negotiation chat via XMTP protocol.'
    }
  ];

  return (
    <div className="bg-[#F8FAFC] text-[#111827] min-h-screen py-10 md:py-14 font-sans select-none relative overflow-hidden">
      
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-0 w-[500px] h-[400px] bg-blue-200/30 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-teal-200/30 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 sm:space-y-20 relative z-10">
        
        {/* SECTION 1: MANIFESTO HERO HEADER */}
        <section className="text-center max-w-4xl mx-auto space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs font-mono font-bold uppercase tracking-widest shadow-3xs"
          >
            <Sparkles size={13} className="text-purple-600 animate-pulse" />
            <span>The PolyLance Protocol Manifesto</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-headline text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-900"
          >
            DECENTRALIZING THE{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-indigo-600 to-cyan-600">
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
                className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs hover:border-purple-300 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
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
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-50 border border-purple-200/80 text-purple-700 rounded-full text-xs font-mono font-bold uppercase tracking-widest shadow-2xs"
            >
              <Users size={14} className="text-purple-600" />
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

          {/* 4 Team Member Cards Grid (Staggered Scroll Reveal) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {teamMembers.map((m, idx) => {
              const RoleIcon = m.icon;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * idx }}
                  whileHover={{ y: -4 }}
                  className={`bg-white border border-[#E8EAF3] rounded-[28px] p-7 flex flex-col justify-between h-full space-y-6 shadow-2xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 relative overflow-hidden group border-b-4 ${m.bottomAccent}`}
                >
                  {/* Card Top & Body Content */}
                  <div className="space-y-5 relative z-10">
                    
                    {/* Header Row: Circular Avatar + Top-Right Role Icon */}
                    <div className="flex items-start justify-between">
                      {/* Premium Circular Avatar */}
                      <div className={`p-1 ${m.avatarRing} rounded-full border shadow-md shadow-slate-200/50`}>
                        <div className={`w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br ${m.avatarGradient} rounded-full flex items-center justify-center shadow-md ${m.avatarShadow} border-2 border-white transform group-hover:scale-105 transition-transform duration-300`}>
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
                      <div className="pt-1">
                        <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-sans font-bold border ${m.badgeStyle}`}>
                          {m.role}
                        </span>
                      </div>
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

          {/* Bottom Full-Width Mission Statement Pill */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center pt-2"
          >
            <div className="bg-white/90 backdrop-blur-md border border-[#E8EAF3] shadow-xs rounded-full py-3 px-6 text-slate-700 font-medium text-xs sm:text-sm font-sans inline-flex items-center justify-center gap-3 max-w-xl text-center">
              <PolyLanceLogo size={20} />
              <span>Four different minds. One shared mission — building the future of work on-chain.</span>
            </div>
          </motion.div>

        </section>

        {/* SECTION 4: CALL TO ACTION FOOTER BANNER */}
        <section className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 text-center space-y-5 relative overflow-hidden shadow-xl">
          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <h3 className="font-headline font-black text-2xl sm:text-3xl text-white">
              Ready to Join the Decentralized Work Revolution?
            </h3>
            <p className="text-xs sm:text-sm text-purple-200 font-sans font-medium">
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
