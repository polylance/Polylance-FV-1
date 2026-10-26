import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Layers, FileCode, HardDrive } from 'lucide-react';
import { AuditXCapabilities } from '../api/types';

interface AuditXSupportedSpecsProps {
  capabilities?: AuditXCapabilities;
}

export const AuditXSupportedSpecs: React.FC<AuditXSupportedSpecsProps> = ({ capabilities }) => {
  const maxMb = capabilities ? Math.round(capabilities.maxTotalSizeBytes / (1024 * 1024)) : 10;
  const maxFiles = capabilities?.maxFilesCount ?? 20;
  const compilers = capabilities?.supportedCompilers ?? ['v0.8.28', 'v0.8.26', 'v0.8.24', 'v0.8.20'];

  return (
    <section className="py-12 border-t border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Supported Specifications & Quotas
          </h2>
          <p className="text-sm text-slate-600">
            Read directly from the active scanning engine configuration.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Supported Languages */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileCode size={16} className="text-[#0047AB]" />
              <span>Languages & Formats</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>• Language: <span className="font-semibold text-slate-800">Solidity</span></div>
              <div>• Formats: <span className="font-semibold text-slate-800">.sol, .zip archive</span></div>
              <div>• Targets: <span className="font-semibold text-slate-800">Files, Code snippet, Polygon address</span></div>
            </div>
          </div>

          {/* Size Limits */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <HardDrive size={16} className="text-[#0047AB]" />
              <span>Upload Limits</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>• Max Total Size: <span className="font-semibold text-slate-800">{maxMb} MB</span></div>
              <div>• Max File Count: <span className="font-semibold text-slate-800">{maxFiles} files</span></div>
              <div>• Sandbox: <span className="font-semibold text-slate-800">Ephemeral unprivileged container</span></div>
            </div>
          </div>

          {/* Pricing & Free Tier */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Layers size={16} className="text-[#0047AB]" />
              <span>Pricing & Quota</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>• Current Tier: <span className="font-semibold text-emerald-700">Free Preview</span></div>
              <div>• Daily Allowance: <span className="font-semibold text-slate-800">15 scans / day</span></div>
              <div>• Cost: <span className="font-semibold text-slate-800">0 MATIC / POL (Gas-free)</span></div>
            </div>
          </div>
        </div>

        {/* Final CTA Strip */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-3xl p-8 sm:p-10 text-center space-y-4">
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            Ready to scan your smart contract?
          </h3>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Upload your Solidity files or enter a verified Polygon contract address to start automated security checks now.
          </p>
          <div className="pt-2">
            <Link
              to="/auditx/scan"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0047AB] text-white font-semibold text-sm shadow-sm hover:bg-[#003580] transition-colors"
            >
              <span>Open Scan Workspace</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
