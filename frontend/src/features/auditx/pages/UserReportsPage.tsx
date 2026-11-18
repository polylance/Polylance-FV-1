import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Trash2,
  ExternalLink,
  RotateCcw,
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Seo } from '../../../components/seo/Seo';
import { ErrorState } from '../../../components/common/ErrorState';
import { useWeb3 } from '../../../context/Web3Context';
import { useAuth } from '../../../context/AuthContext';
import { auditxApi } from '../api/client';
import { ScanJob, FindingSeverity } from '../api/types';

export const UserReportsPage: React.FC = () => {
  const { connectWallet } = useWeb3();
  const { isAuthenticated } = useAuth();
  const [scans, setScans] = useState<ScanJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'scanning' | 'failed'>('all');

  const loadScans = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await auditxApi.getScans();
      setScans(data);
    } catch (err) {
      console.warn('Failed to fetch scans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadScans();
    }
  }, [isAuthenticated]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this report?')) return;
    try {
      await auditxApi.deleteScan(id);
      loadScans();
    } catch (err: any) {
      alert(err.message || 'Failed to delete report');
    }
  };

  if (!isAuthenticated) {
    return (
      <PageContainer className="py-12 w-full text-[#0B0B0F]">
        <Seo routeKey="/auditx/reports" />
        <ErrorState
          variant="auth-required"
          title="Sign In to View Your Scan Reports"
          description="Your AuditX reports are private and strictly linked to your authenticated wallet address."
          actionText="Connect Wallet"
          onAction={connectWallet}
        />
      </PageContainer>
    );
  }

  const filteredScans = scans.filter((s) => {
    const matchesSearch =
      s.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getSeverityBadge = (severity: FindingSeverity, count: number) => {
    if (count === 0) return null;
    let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
    if (severity === 'Critical') colorClass = 'bg-red-50 text-red-700 border-red-200';
    if (severity === 'High') colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
    if (severity === 'Medium') colorClass = 'bg-yellow-50 text-yellow-800 border-yellow-200';
    if (severity === 'Low') colorClass = 'bg-blue-50 text-blue-700 border-blue-200';

    return (
      <span key={severity} className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${colorClass}`}>
        {count} {severity}
      </span>
    );
  };

  return (
    <PageContainer className="space-y-6 py-6 w-full text-[#0B0B0F]">
      <Seo routeKey="/auditx/reports" />

      <PageHeader
        title="My Security Scan Reports"
        subtitle="Manage your private smart contract analysis history, review findings, and export audit artifacts."
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/auditx/scan"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0047AB] hover:bg-[#003580] text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <Plus size={14} />
              <span>Scan New Code</span>
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name or target..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['all', 'completed', 'scanning', 'failed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-50 text-[#0047AB] border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-[#0047AB]" />
            <span>Loading your reports...</span>
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText size={32} className="mx-auto text-slate-300" />
            <div className="text-sm font-bold text-slate-800">No reports found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery ? 'No reports match your search query.' : 'You have not executed any smart contract scans yet.'}
            </p>
            <div className="pt-2">
              <Link
                to="/auditx/scan"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0047AB] text-white font-semibold text-xs shadow-sm hover:bg-[#003580] transition-colors"
              >
                <Plus size={14} />
                <span>Start First Scan</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredScans.map((scan) => (
              <div key={scan.id} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-base text-slate-900 truncate">
                      {scan.projectName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        scan.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : scan.status === 'scanning'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : scan.status === 'failed'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {scan.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-mono flex flex-wrap items-center gap-2">
                    <span>Target: {scan.targetName}</span>
                    <span>•</span>
                    <span>Compiler: {scan.compilerVersion}</span>
                    <span>•</span>
                    <span>{new Date(scan.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {(['Critical', 'High', 'Medium', 'Low', 'Informational'] as FindingSeverity[]).map((sev) =>
                      getSeverityBadge(sev, scan.severitySummary[sev] || 0)
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {scan.status === 'completed' && (
                    <Link
                      to={`/auditx/reports/${scan.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0047AB] text-xs font-semibold border border-blue-200 transition-colors"
                    >
                      <span>View Full Report</span>
                      <ExternalLink size={12} />
                    </Link>
                  )}
                  <Link
                    to={`/auditx/scan?rescan=${scan.id}`}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Re-scan contract"
                  >
                    <RotateCcw size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(scan.id)}
                    className="p-2 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete report"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default UserReportsPage;
