import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export const AuditXLimitations: React.FC = () => {
  return (
    <section className="py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border-2 border-amber-200/90 bg-amber-50/50 p-6 sm:p-7 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100/80 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert size={20} />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-amber-950">
                Important Limitations & Scope Notice
              </h3>
              <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed font-normal">
                AuditX runs automated static analysis and pattern matching. It does <span className="font-bold">not</span> perform manual line-by-line review, architectural threat modeling, economic simulation, or formal verification.
              </p>
              <ul className="text-xs text-amber-900/80 space-y-1 list-disc list-inside">
                <li>Automated analysis cannot detect every potential vulnerability, business logic flaw, or oracle manipulation vector.</li>
                <li>A clean scan with zero findings does not guarantee that a smart contract is 100% bug-free or safe from exploitation.</li>
                <li>AuditX is an automated developer hygiene tool and is <span className="font-bold">not</span> a substitute for an independent, comprehensive security audit by an accredited third-party audit firm.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
