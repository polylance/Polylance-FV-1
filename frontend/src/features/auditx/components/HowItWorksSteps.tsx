import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Cpu, AlertTriangle, RefreshCw } from 'lucide-react';

export const HowItWorksSteps: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Submit Code or Address',
      desc: 'Upload .sol files, drop a .zip archive, paste raw Solidity, or supply a verified Polygon contract address.',
      icon: Upload,
    },
    {
      num: '02',
      title: 'Automated Analysis Runs',
      desc: 'The scanner runs static analysis, pattern matching, and AST checks in an isolated, sandboxed environment.',
      icon: Cpu,
    },
    {
      num: '03',
      title: 'Review Ranked Findings',
      desc: 'Inspect severity-ranked findings (Critical to Informational) with code line references and mitigation guidance.',
      icon: AlertTriangle,
    },
    {
      num: '04',
      title: 'Fix and Re-Scan',
      desc: 'Apply recommended corrections, re-run analysis in seconds, and track verification progress across iterations.',
      icon: RefreshCw,
    },
  ];

  return (
    <section className="py-12 bg-slate-50/60 border-y border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0047AB] text-xs font-semibold mb-3">
            <span>Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            How AuditX Works in 4 Steps
          </h2>
          <p className="text-sm text-slate-600">
            From raw Solidity code to clear, actionable security insights in under 30 seconds.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Connector Line for Desktop */}
          <div className="hidden md:block absolute top-1/4 left-12 right-12 h-0.5 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 z-0" />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.1 }}
                className="relative z-10 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-[#0047AB] flex items-center justify-center font-bold">
                      <Icon size={22} />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.desc}
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
