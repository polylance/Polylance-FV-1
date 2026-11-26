import React from 'react';
import { motion } from 'framer-motion';
import { Award, ShieldCheck, Zap } from 'lucide-react';
import { Job, UserProfile } from '../../types';

export interface FeaturesSectionProps {
  jobs?: Job[];
  profiles?: Record<string, UserProfile>;
}

const GUARANTEES = [
  {
    num: '01',
    icon: ShieldCheck,
    title: 'Contract-Locked Escrow',
    description:
      'Milestone funds lock inside an isolated smart contract before work begins and release cleanly upon client approval.',
    image: '/images/showcase/smart-contracts.webp',
    alt: '3D crystal escrow smart contract artwork',
    badge: 'Non-Custodial Vault',
  },
  {
    num: '02',
    icon: Award,
    title: 'Verifiable Proof of Work',
    description:
      'Finished contracts mint a portable Soulbound work record directly to your wallet alongside GitHub and portfolio links.',
    image: '/images/showcase/security-audit.webp',
    alt: '3D architectural security shield and verification rings artwork',
    badge: 'Soulbound Certificate',
  },
  {
    num: '03',
    icon: Zap,
    title: '5% Flat Fee & Instant Settlement',
    description:
      'Transparent 2.5% client and 2.5% builder fee with ~2s Polygon finality directly to your wallet—zero withdrawal delays.',
    image: '/images/showcase/growth-analytics.webp',
    alt: '3D cobalt and crystal ascending analytics sculpture',
    badge: 'Chain 137 Native',
  },
];

export const FeaturesSection: React.FC<FeaturesSectionProps> = () => {
  return (
    <section
      id="guarantees"
      aria-label="Why PolyLance"
      className="w-full bg-white py-16 sm:py-24 border-b border-slate-200/70"
    >
      <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-10 text-left">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl space-y-2"
        >
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[#0A52B8]">
            Escrow &amp; Trust Guarantees
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]"
            style={{ textWrap: 'balance' }}
          >
            Three Guarantees Built Into Every Contract
          </h2>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {GUARANTEES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="h-full"
              >
                <div className="group h-full flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-[#0A52B8]/35 hover:shadow-[0_12px_32px_rgba(10,82,184,0.07)] transition-all duration-300">
                  <div className="space-y-5">
                    {/* Top Row: Step Number + Outline Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#0A52B8] inline-flex items-center gap-1.5">
                        <Icon size={15} className="text-[#0A52B8]" />
                        <span>{item.num}</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600">
                        {item.badge}
                      </span>
                    </div>

                    {/* Studio 3D Visual Header */}
                    <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/70">
                      <img
                        src={item.image}
                        alt={item.alt}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-[#0F172A] leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-[14.5px] leading-relaxed text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
