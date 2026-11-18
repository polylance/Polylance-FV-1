import React from 'react';
import { motion } from 'framer-motion';
import { Code2, ShieldCheck, Users, CheckCircle2 } from 'lucide-react';

export const WhatAuditXIs: React.FC = () => {
  const personas = [
    {
      title: 'For Freelancers',
      role: 'Deliver with Confidence',
      icon: Code2,
      badge: 'Pre-Delivery Check',
      description: 'Run automated checks on your smart contracts before submitting milestones. Catch avoidable bugs, follow OpenZeppelin best practices, and provide clients with a clear analysis summary.',
      highlights: [
        'Catch common vulnerabilities before review',
        'Verify compiler pragma and NatSpec documentation',
        'Demonstrate code quality to clients'
      ]
    },
    {
      title: 'For Clients',
      role: 'Review Before Escrow Release',
      icon: ShieldCheck,
      badge: 'Escrow Milestone Verification',
      description: 'Validate contractor code deliverables before approving payment release. Confirm that standard security patterns are respected and that high-severity pitfalls are addressed.',
      highlights: [
        'Inspect deliverables without running local CLI tools',
        'Identify missing access controls or unchecked calls',
        'Request revisions based on specific findings'
      ]
    },
    {
      title: 'For Teams & DAOs',
      role: 'Continuous Pre-Audit Hygiene',
      icon: Users,
      badge: 'Pre-Audit Preparation',
      description: 'Clean up straightforward findings before engaging expensive third-party security auditors. Maximize external audit efficiency by eliminating low-hanging fruit in advance.',
      highlights: [
        'Reduce third-party audit scope and overhead',
        'Standardize static checks across internal PRs',
        'Fast turnaround with automated reporting'
      ]
    }
  ];

  return (
    <section className="py-12 border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
            What AuditX Is and Who It Is For
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            A fast, automated analysis workspace built directly into the PolyLance escrow workflow to keep smart contract deliverables secure and accountable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {personas.map((persona, index) => {
            const Icon = persona.icon;
            return (
              <motion.div
                key={persona.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#0047AB] flex items-center justify-center">
                      <Icon size={20} />
                    </div>
                    <span className="text-[11px] font-semibold text-[#0047AB] bg-blue-50/70 border border-blue-100 px-2.5 py-0.5 rounded-full">
                      {persona.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {persona.title}
                  </h3>
                  <div className="text-xs font-medium text-slate-500 mb-3">
                    {persona.role}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    {persona.description}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2">
                  {persona.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
