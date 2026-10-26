import React from 'react';
import { motion } from 'framer-motion';
import { Bug, Layers, FileDown, RefreshCw } from 'lucide-react';

export const HowItHelps: React.FC = () => {
  const benefits = [
    {
      title: 'Catch Common Issues Early',
      description: 'Identify syntax issues, missing modifiers, unsafe type casting, and reentrancy loops before code reaches production or review.',
      icon: Bug,
    },
    {
      title: 'Severity Ranking & Recommendations',
      description: 'Prioritize fixes with clear Critical, High, Medium, Low, and Informational tiers paired with actionable remediation steps.',
      icon: Layers,
    },
    {
      title: 'Exportable Reports to Share',
      description: 'Download JSON data or export clean print-ready summaries to share findings and proof of verification with clients and auditors.',
      icon: FileDown,
    },
    {
      title: 'Re-Scan After Fixes',
      description: 'Iterate quickly with rapid re-scans to confirm that applied changes resolve reported issues without creating regressions.',
      icon: RefreshCw,
    },
  ];

  return (
    <section className="py-12 border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0047AB] text-xs font-semibold mb-3">
            <span>Benefits</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            How AuditX Helps Your Workflow
          </h2>
          <p className="text-sm text-slate-600">
            Purpose-built utilities designed to make smart contract development transparent, repeatable, and collaborative.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-colors"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#0047AB] flex items-center justify-center mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {b.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
