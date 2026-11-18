import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Shield,
  ExternalLink,
  Code2
} from 'lucide-react';
import { STATIC_SAMPLE_REPORT } from '../api/mockAdapter';
import { FindingSeverity } from '../api/types';

export const SampleReportCard: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>('samp_find_001');

  const report = STATIC_SAMPLE_REPORT;

  const getSeverityBadgeClass = (severity: FindingSeverity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'High':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Medium':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <section id="sample-report" className="py-12 bg-slate-50/60 border-b border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0047AB] text-xs font-semibold mb-3">
            <span>Report Preview</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Sample Security Report
          </h2>
          <p className="text-sm text-slate-600">
            A static demonstration showing how AuditX presents automated analysis findings. (Illustrative sample data only; not PolyLance internal protocol audit results).
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Sample Banner */}
          <div className="bg-amber-50/90 border-b border-amber-200/70 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              STATIC SAMPLE REPORT — For Demonstration Only
            </span>
            <span className="font-mono text-[11px] text-amber-700">Sample ID: rep_sample_preview_01</span>
          </div>

          {/* Header Info */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText size={18} className="text-[#0047AB]" />
                <h3 className="text-lg font-bold text-slate-900">
                  {report.projectName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Compiler: {report.compilerVersion} • Target: {report.targetSummary} • Scan Duration: {report.scanDurationMs}ms
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/auditx/reports/sample"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0047AB] text-xs font-semibold border border-blue-200 transition-colors"
              >
                <span>Full Sample View</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>

          {/* Severity Breakdown Strip */}
          <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-200/70 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(['Critical', 'High', 'Medium', 'Low', 'Informational'] as FindingSeverity[]).map((sev) => {
              const count = report.severityCounts[sev] || 0;
              return (
                <div key={sev} className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-center">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    {sev}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Findings List */}
          <div className="p-6 divide-y divide-slate-100">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Sample Findings Breakdown ({report.findings.length})
            </div>

            {report.findings.map((f) => {
              const isExpanded = expandedId === f.id;
              return (
                <div key={f.id} className="py-3">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : f.id)}
                    className="w-full flex items-center justify-between text-left py-1 hover:text-[#0047AB] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 uppercase ${getSeverityBadgeClass(
                          f.severity
                        )}`}
                      >
                        {f.severity}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {f.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 shrink-0 ml-2">
                      <span className="text-xs font-mono hidden sm:inline text-slate-500">
                        {f.contractOrFile}:{f.lineStart}
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pl-2 sm:pl-4 border-l-2 border-blue-200 space-y-3 pt-1">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {f.description}
                      </p>

                      {f.codeSnippet && (
                        <div className="p-3 bg-slate-900 rounded-xl overflow-x-auto text-[11px] font-mono text-slate-200">
                          <pre>{f.codeSnippet}</pre>
                        </div>
                      )}

                      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                        <span className="font-bold text-emerald-900">Recommendation: </span>
                        {f.recommendation}
                      </div>

                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-mono">
                        {f.swc && <span className="bg-slate-100 px-2 py-0.5 rounded">SWC: {f.swc}</span>}
                        {f.cwe && <span className="bg-slate-100 px-2 py-0.5 rounded">CWE: {f.cwe}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Disclaimer */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <Shield size={14} className="text-slate-400 shrink-0" />
            <span>
              Sample output demonstrates layout and ranking only. Real user reports remain private to the uploader.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
