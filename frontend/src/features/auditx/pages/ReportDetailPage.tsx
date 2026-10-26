import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  ShieldAlert,
  Download,
  Printer,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Code2,
  ArrowLeft,
  Share2,
  Clock,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Seo } from '../../../components/seo/Seo';
import { ErrorState } from '../../../components/common/ErrorState';
import { useWeb3 } from '../../../context/Web3Context';
import { useAuth } from '../../../context/AuthContext';
import { auditxApi, AuditXApiError } from '../api/client';
import { AuditXReport, FindingSeverity, FindingStatus, AuditFinding } from '../api/types';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { connectWallet } = useWeb3();
  const { isAuthenticated } = useAuth();

  const [report, setReport] = useState<AuditXReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<FindingSeverity | 'all'>('all');
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!id) return;

    setIsLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);

    auditxApi.getReport(id).then((rep) => {
      if (!mounted) return;
      if (!rep) {
        setErrorStatus(404);
        setErrorMessage('The requested audit report was not found or has been deleted.');
      } else {
        setReport(rep);
        // Expand first finding by default if exists
        if (rep.findings.length > 0) {
          setExpandedFindings(new Set([rep.findings[0].id]));
        }
      }
    }).catch((err: any) => {
      if (!mounted) return;
      setErrorStatus(err.status || 500);
      setErrorMessage(err.message || 'Failed to load report.');
    }).finally(() => {
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [id]);

  const toggleFinding = (fId: string) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev);
      if (next.has(fId)) next.delete(fId);
      else next.add(fId);
      return next;
    });
  };

  const handleExportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditx_report_${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!report) return;
    if (!confirm('Are you sure you want to permanently delete this report?')) return;
    try {
      await auditxApi.deleteScan(report.scanId || report.id);
      navigate('/auditx/reports');
    } catch (err: any) {
      alert(err.message || 'Failed to delete report');
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Severity color mappings
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

  // Filtered and sorted findings
  const severityRank: Record<FindingSeverity, number> = {
    Critical: 5,
    High: 4,
    Medium: 3,
    Low: 2,
    Informational: 1,
  };

  const filteredFindings = useMemo(() => {
    if (!report) return [];
    return report.findings
      .filter((f) => {
        const matchesSearch =
          f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.contractOrFile.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (f.recommendation && f.recommendation.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesSeverity = selectedSeverity === 'all' || f.severity === selectedSeverity;
        return matchesSearch && matchesSeverity;
      })
      .sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  }, [report, searchQuery, selectedSeverity]);

  // Chart data
  const chartData = useMemo(() => {
    if (!report) return [];
    const colors: Record<FindingSeverity, string> = {
      Critical: '#DC2626',
      High: '#EA580C',
      Medium: '#EAB308',
      Low: '#2563EB',
      Informational: '#64748B',
    };
    return (['Critical', 'High', 'Medium', 'Low', 'Informational'] as FindingSeverity[]).map((sev) => ({
      name: sev,
      count: report.severityCounts[sev] || 0,
      fill: colors[sev],
    }));
  }, [report]);

  // Loading skeleton
  if (isLoading) {
    return (
      <PageContainer className="py-12 space-y-6 w-full text-[#0B0B0F]">
        <Seo routeKey="/auditx/reports" />
        <div className="h-8 bg-slate-200 rounded-xl w-64 animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </PageContainer>
    );
  }

  // Error handling
  if (errorStatus === 403) {
    return (
      <PageContainer className="py-12 w-full text-[#0B0B0F]">
        <Seo routeKey="/auditx/reports" />
        <ErrorState
          variant="403"
          title="Access Restricted to Report"
          description="This scan report belongs to another user account. For your protection and confidentiality, reports are strictly isolated to the authenticated uploader."
          actionText="Return to My Reports"
          onAction={() => navigate('/auditx/reports')}
        />
      </PageContainer>
    );
  }

  if (errorStatus === 404 || !report) {
    return (
      <PageContainer className="py-12 w-full text-[#0B0B0F]">
        <Seo routeKey="/auditx/reports" />
        <ErrorState
          variant="404"
          title="Report Not Found"
          description="The requested audit report was not found or has been deleted."
          actionText="Back to Workspace"
          onAction={() => navigate('/auditx/scan')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6 py-6 w-full text-[#0B0B0F]">
      <Seo routeKey="/auditx/reports" />

      {/* Top Breadcrumb & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/auditx/reports"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to All Reports</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-3xs transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-3xs transition-colors cursor-pointer"
          >
            <Printer size={13} />
            <span>Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleCopyShareLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-3xs transition-colors cursor-pointer"
          >
            <Share2 size={13} />
            <span>{copiedShare ? 'Copied Link!' : 'Share Link'}</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 font-semibold text-xs border border-slate-200 shadow-3xs transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Sample Banner if isSample */}
      {report.isSample && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            STATIC SAMPLE DEMONSTRATION REPORT — Generated with synthetic sample findings
          </span>
          <span className="font-mono text-[11px] text-amber-700">Sample Preview</span>
        </div>
      )}

      {/* Report Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-slate-400">REPORT ID: {report.id}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0047AB] border border-blue-100">
                Automated Static Analysis
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {report.projectName}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Target: {report.targetSummary} • Compiler: {report.compilerVersion} • Language: {report.language}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <div className="text-xs text-slate-500">Scan Executed</div>
            <div className="text-xs font-mono font-bold text-slate-800">
              {new Date(report.createdAt).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Duration: {report.scanDurationMs}ms
            </div>
          </div>
        </div>

        {/* Severity Count Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(['Critical', 'High', 'Medium', 'Low', 'Informational'] as FindingSeverity[]).map((sev) => {
            const count = report.severityCounts[sev] || 0;
            return (
              <div
                key={sev}
                onClick={() => setSelectedSeverity(selectedSeverity === sev ? 'all' : sev)}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedSeverity === sev
                    ? 'border-[#0047AB] ring-2 ring-[#0047AB]/20 bg-blue-50/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  {sev}
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {count}
                </div>
              </div>
            );
          })}
        </div>

        {/* Breakdown Chart */}
        <div className="pt-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Severity Distribution
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Limitations Notice Card */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <ShieldAlert size={18} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Automated Scope & Legal Notice</div>
          <p className="leading-relaxed">
            {report.limitationsNotice} This report is generated through automated static analysis tools and does not constitute a certified or formal third-party audit guarantee.
          </p>
        </div>
      </div>

      {/* Findings Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">
              Vulnerability Findings ({filteredFindings.length} of {report.totalFindings})
            </h3>
            {selectedSeverity !== 'all' && (
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600 font-semibold">
                Filtered: {selectedSeverity}
              </span>
            )}
          </div>

          {/* Search Input & Severity Filter Chips */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search findings..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
              />
            </div>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as any)}
              className="w-full sm:w-auto p-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Informational">Informational</option>
            </select>
          </div>
        </div>

        {/* Findings List */}
        {filteredFindings.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
            <div className="text-sm font-bold text-slate-900">
              No issues detected by automated checks
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Automated rules found zero matching vulnerabilities under the selected criteria. Always conduct manual reviews before transferring significant funds.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFindings.map((finding) => {
              const isExpanded = expandedFindings.has(finding.id);
              return (
                <div key={finding.id} className="py-4">
                  <button
                    type="button"
                    onClick={() => toggleFinding(finding.id)}
                    className="w-full flex items-start justify-between text-left gap-3 hover:text-[#0047AB] transition-colors cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getSeverityBadgeClass(
                            finding.severity
                          )}`}
                        >
                          {finding.severity}
                        </span>
                        <span className="font-bold text-sm text-slate-900">
                          {finding.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                        <span>{finding.contractOrFile}</span>
                        {finding.lineStart && <span>• Lines {finding.lineStart}-{finding.lineEnd || finding.lineStart}</span>}
                        {finding.functionTarget && <span>• Function: {finding.functionTarget}</span>}
                      </div>
                    </div>

                    <div className="p-1 text-slate-400 hover:text-slate-600 shrink-0">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="mt-4 pl-3 sm:pl-4 border-l-2 border-blue-200 space-y-4 pt-1">
                      <div>
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                          Description
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {finding.description}
                        </p>
                      </div>

                      {/* Code Snippet */}
                      {finding.codeSnippet && (
                        <div>
                          <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                            <span>Vulnerable Code Block</span>
                            <span className="font-mono text-[10px] text-slate-400">Read-Only</span>
                          </div>
                          <div className="p-4 bg-slate-900 rounded-xl overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed border border-slate-800">
                            <pre className="whitespace-pre">{finding.codeSnippet}</pre>
                          </div>
                        </div>
                      )}

                      {/* Recommendation */}
                      <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                        <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-700" />
                          <span>Remediation Advice</span>
                        </div>
                        <p className="leading-relaxed">{finding.recommendation}</p>
                      </div>

                      {/* CWE / SWC References */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-slate-500">
                        {finding.swc && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            SWC: {finding.swc}
                          </span>
                        )}
                        {finding.cwe && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            CWE: {finding.cwe}
                          </span>
                        )}
                        {finding.referenceUrl && (
                          <a
                            href={finding.referenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#0047AB] font-semibold hover:underline"
                          >
                            <span>Security Reference Docs</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ReportDetailPage;
