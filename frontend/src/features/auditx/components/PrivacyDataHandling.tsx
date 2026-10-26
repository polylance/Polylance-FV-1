import React from 'react';
import { Lock, Clock, Trash2, HelpCircle, CheckCircle2 } from 'lucide-react';
import { AuditXCapabilities } from '../api/types';

interface PrivacyDataHandlingProps {
  capabilities?: AuditXCapabilities;
}

export const PrivacyDataHandling: React.FC<PrivacyDataHandlingProps> = ({ capabilities }) => {
  const isConfirmed = capabilities?.privacy?.needsConfirmation === false;
  const retentionDays = capabilities?.retentionDays ?? 30;

  return (
    <section className="py-12 border-b border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-3">
            <span>Data Protection</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Privacy & Code Confidentiality
          </h2>
          <p className="text-sm text-slate-600">
            Smart contract source code uploaded to AuditX is protected under strict isolation controls.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Storage & Handling Directives
            </span>
            {!isConfirmed ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                <HelpCircle size={12} />
                <span>Backend Policy Awaiting Team Confirmation</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 size={12} />
                <span>Confirmed Backend Policy</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* User Isolation */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-[#0047AB] flex items-center justify-center">
                <Lock size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Per-User Isolation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scans and generated reports are keyed strictly to the authenticated uploader wallet. Reports are never made publicly accessible or visible to other marketplace users.
              </p>
            </div>

            {/* Retention Window */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-[#0047AB] flex items-center justify-center">
                <Clock size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">{retentionDays}-Day Auto Retention</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Uploaded code and analysis artifacts are automatically expired and purged from server storage after {retentionDays} days to ensure minimal data footprint.
              </p>
            </div>

            {/* Manual Deletion */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-[#0047AB] flex items-center justify-center">
                <Trash2 size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Instant Manual Deletion</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You can permanently delete any scan and associated report at any time via the user workspace. Deletion purges source files and reports immediately.
              </p>
            </div>
          </div>

          {!isConfirmed && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
              <span className="font-bold">Pending Confirmation: </span>
              The specific encryption-at-rest cipher (e.g. AES-256) and automated 30-day retention schedule are proposed by PolyLance frontend architecture and await final operational confirmation from the backend engine team.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
