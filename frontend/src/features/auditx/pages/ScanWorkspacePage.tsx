import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload,
  FileCode,
  Globe,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Play,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Clock,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Seo } from '../../../components/seo/Seo';
import { ErrorState } from '../../../components/common/ErrorState';
import { useWeb3 } from '../../../context/Web3Context';
import { useAuth } from '../../../context/AuthContext';
import { auditxApi } from '../api/client';
import {
  AuditXCapabilities,
  ScanJob,
  ScanTargetType,
  CreateScanPayload,
  FindingSeverity
} from '../api/types';

export const ScanWorkspacePage: React.FC = () => {
  const { address, connectWallet } = useWeb3();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active scan tracking (resilient to page reload via ?activeScan=id)
  const activeScanParam = searchParams.get('activeScan');

  const [capabilities, setCapabilities] = useState<AuditXCapabilities | null>(null);
  const [targetType, setTargetType] = useState<ScanTargetType>('files');
  const [projectName, setProjectName] = useState('');
  const [language, setLanguage] = useState('Solidity');
  const [compilerVersion, setCompilerVersion] = useState('v0.8.24');
  const [notes, setNotes] = useState('');

  // Tab inputs
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  // Consent & UI states
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [activeScan, setActiveScan] = useState<ScanJob | null>(null);
  const [recentScans, setRecentScans] = useState<ScanJob[]>([]);
  const [isLoadingScans, setIsLoadingScans] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [completedToast, setCompletedToast] = useState<{ scanId: string; projectName: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pollTimerRef = useRef<any>(null);

  // Load capabilities & recent scans
  useEffect(() => {
    let mounted = true;
    auditxApi.getCapabilities().then((caps) => {
      if (mounted) {
        setCapabilities(caps);
        if (caps.supportedCompilers && caps.supportedCompilers.length > 0) {
          setCompilerVersion(caps.supportedCompilers[2] || caps.supportedCompilers[0]);
        }
      }
    }).catch((err) => {
      console.warn('[AuditX] Capabilities fetch notice:', err);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const loadRecentScans = async () => {
    if (!isAuthenticated) return;
    setIsLoadingScans(true);
    try {
      const scans = await auditxApi.getScans();
      setRecentScans(scans);
    } catch (err: any) {
      if (err.status === 429) {
        setServiceError('Rate limit exceeded. Please wait a moment before querying scans.');
      }
    } finally {
      setIsLoadingScans(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadRecentScans();
    }
  }, [isAuthenticated]);

  // Resume active scan if param exists
  useEffect(() => {
    if (activeScanParam && isAuthenticated) {
      auditxApi.getScan(activeScanParam).then((scan) => {
        if (scan) {
          setActiveScan(scan);
        }
      }).catch(() => {});
    }
  }, [activeScanParam, isAuthenticated]);

  // Polling lifecycle worker with exponential backoff and cleanup
  useEffect(() => {
    if (!activeScan) return;
    if (activeScan.status === 'completed' || activeScan.status === 'failed' || activeScan.status === 'cancelled') {
      return;
    }

    let delay = 1000;
    let cancelled = false;

    const poll = async () => {
      try {
        const updated = await auditxApi.getScan(activeScan.id);
        if (cancelled) return;
        if (updated) {
          setActiveScan(updated);
          if (updated.status === 'completed') {
            setCompletedToast({ scanId: updated.id, projectName: updated.projectName });
            loadRecentScans();
            return;
          }
          if (updated.status === 'failed' || updated.status === 'cancelled') {
            loadRecentScans();
            return;
          }
        }
        delay = Math.min(delay * 1.3, 4000);
        pollTimerRef.current = setTimeout(poll, delay);
      } catch (err: any) {
        if (cancelled) return;
        if (err.status === 429) {
          pollTimerRef.current = setTimeout(poll, 5000);
        } else {
          pollTimerRef.current = setTimeout(poll, 3000);
        }
      }
    };

    pollTimerRef.current = setTimeout(poll, delay);

    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [activeScan?.id, activeScan?.status]);

  // File drop & selection handlers
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    setInlineError(null);
    const maxFiles = capabilities?.maxFilesCount ?? 20;
    const maxTotalBytes = capabilities?.maxTotalSizeBytes ?? 10 * 1024 * 1024;
    const allowed = capabilities?.allowedExtensions ?? ['.sol', '.zip'];

    const validNewFiles: File[] = [];

    for (const f of newFiles) {
      const lower = f.name.toLowerCase();
      const hasValidExt = allowed.some((ext) => lower.endsWith(ext));
      if (!hasValidExt) {
        setInlineError(`File "${f.name}" has an unsupported extension. Allowed: ${allowed.join(', ')}`);
        return;
      }
      if (f.size === 0) {
        setInlineError(`File "${f.name}" is empty (0 bytes).`);
        return;
      }
      // Check duplicate
      if (uploadedFiles.some((existing) => existing.name === f.name)) {
        continue;
      }
      validNewFiles.push(f);
    }

    const combined = [...uploadedFiles, ...validNewFiles];
    if (combined.length > maxFiles) {
      setInlineError(`Maximum file count exceeded. Maximum allowed is ${maxFiles} files.`);
      return;
    }

    const totalSize = combined.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > maxTotalBytes) {
      setInlineError(`Total size exceeds ${Math.round(maxTotalBytes / (1024 * 1024))}MB limit.`);
      return;
    }

    setUploadedFiles(combined);
    if (!projectName && combined[0]) {
      setProjectName(combined[0].name.replace(/\.[^/.]+$/, ''));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit scan
  const handleSubmitScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    setServiceError(null);

    if (!consentChecked) {
      setInlineError('Please check the consent box confirming you own or have permission to analyze this code.');
      return;
    }

    if (targetType === 'files' && uploadedFiles.length === 0) {
      setInlineError('Please select at least one .sol contract or .zip file to scan.');
      return;
    }

    if (targetType === 'code' && (!codeSnippet || codeSnippet.trim().length < 15)) {
      setInlineError('Please enter at least 15 characters of valid Solidity code.');
      return;
    }

    if (targetType === 'address') {
      const cleanAddr = contractAddress.trim();
      const isValid = /^0x[a-fA-F0-9]{40}$/.test(cleanAddr);
      if (!isValid) {
        setInlineError('Invalid Polygon contract address format. Must be a 42-character hex address (0x...).');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: CreateScanPayload = {
        targetType,
        projectName: projectName.trim() || (targetType === 'address' ? contractAddress.slice(0, 10) : 'Untitled Scan'),
        language,
        compilerVersion,
        notes: notes.trim() || undefined,
        files: targetType === 'files' ? uploadedFiles : undefined,
        codeSnippet: targetType === 'code' ? codeSnippet : undefined,
        contractAddress: targetType === 'address' ? contractAddress.trim() : undefined,
        chainId: 137,
      };

      const newJob = await auditxApi.createScan(payload);
      setActiveScan(newJob);
      setSearchParams({ activeScan: newJob.id });
      loadRecentScans();
    } catch (err: any) {
      console.error('[AuditX] Submit error:', err);
      if (err.status === 429) {
        setServiceError('Rate limit exceeded: You have reached the scan quota limit. Please try again shortly.');
      } else {
        setInlineError(err.message || 'Failed to initiate scan. Please check your network and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelActiveScan = async () => {
    if (!activeScan) return;
    try {
      await auditxApi.cancelScan(activeScan.id);
      setActiveScan((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    } catch (err) {
      console.warn('Cancel failed:', err);
    }
  };

  const handleDeleteScan = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this scan and report?')) return;
    try {
      await auditxApi.deleteScan(id);
      if (activeScan?.id === id) {
        setActiveScan(null);
        setSearchParams({});
      }
      loadRecentScans();
    } catch (err: any) {
      alert(err.message || 'Failed to delete scan');
    }
  };

  // Auth gate check
  if (!isAuthenticated) {
    return (
      <PageContainer className="py-12 w-full text-[#0B0B0F]">
        <Seo routeKey="/auditx/scan" />
        <ErrorState
          variant="auth-required"
          title="Connect Wallet to Open AuditX Workspace"
          description="Sign in with your Polygon wallet to upload contracts, initiate automated security scans, and manage your private reports."
          actionText="Connect & Sign In"
          onAction={connectWallet}
        />
      </PageContainer>
    );
  }

  const getSeverityBadge = (severity: FindingSeverity, count: number) => {
    if (count === 0) return null;
    let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
    if (severity === 'Critical') colorClass = 'bg-red-50 text-red-700 border-red-200';
    if (severity === 'High') colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
    if (severity === 'Medium') colorClass = 'bg-yellow-50 text-yellow-800 border-yellow-200';
    if (severity === 'Low') colorClass = 'bg-blue-50 text-blue-700 border-blue-200';

    return (
      <span key={severity} className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${colorClass}`}>
        {count} {severity[0]}
      </span>
    );
  };

  return (
    <PageContainer className="space-y-6 py-6 w-full text-[#0B0B0F]">
      <Seo routeKey="/auditx/scan" />

      {/* Header */}
      <PageHeader
        title="AuditX Code Scanning Workspace"
        subtitle="Upload smart contract deliverables, paste Solidity source, or inspect verified Polygon contracts with automated AST analysis."
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/auditx/reports"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs transition-colors"
            >
              <FileText size={14} className="text-slate-500" />
              <span>My Scan Reports ({recentScans.length})</span>
            </Link>
          </div>
        }
      />

      {/* Service Error Alert */}
      {serviceError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{serviceError}</span>
          </div>
          <button
            type="button"
            onClick={() => setServiceError(null)}
            className="text-red-700 hover:text-red-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Completed Toast Banner */}
      {completedToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>
              Scan completed for <span className="font-bold">{completedToast.projectName}</span>!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/auditx/reports/${completedToast.scanId}`}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1"
            >
              <span>View Report</span>
              <ArrowRight size={12} />
            </Link>
            <button
              type="button"
              onClick={() => setCompletedToast(null)}
              className="p-1 text-emerald-700 hover:text-emerald-900"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Active Scan Lifecycle Card (If active) */}
      {activeScan && activeScan.status !== 'completed' && activeScan.status !== 'failed' && activeScan.status !== 'cancelled' && (
        <div className="bg-white rounded-3xl border border-blue-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Loader2 size={18} className="text-[#0047AB] animate-spin" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeScan.status === 'queued' ? 'Analysis Queued...' : 'Scanning Smart Contract AST...'}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Scan ID: {activeScan.id} • Project: {activeScan.projectName}
                </p>
              </div>
            </div>

            {activeScan.canCancel && (
              <button
                type="button"
                onClick={handleCancelActiveScan}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel Scan
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>{activeScan.status === 'queued' ? 'Awaiting worker allocation' : 'Running pattern detection rules'}</span>
              <span>{activeScan.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#0047AB] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(activeScan.progress, 5)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Upload Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Target Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={() => { setTargetType('files'); setInlineError(null); }}
            className={`flex-1 py-3.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              targetType === 'files'
                ? 'bg-white text-[#0047AB] border-b-2 border-[#0047AB]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload size={14} />
            <span>Upload Files (.sol, .zip)</span>
          </button>

          <button
            type="button"
            onClick={() => { setTargetType('code'); setInlineError(null); }}
            className={`flex-1 py-3.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              targetType === 'code'
                ? 'bg-white text-[#0047AB] border-b-2 border-[#0047AB]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode size={14} />
            <span>Paste Code</span>
          </button>

          <button
            type="button"
            onClick={() => { setTargetType('address'); setInlineError(null); }}
            className={`flex-1 py-3.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              targetType === 'address'
                ? 'bg-white text-[#0047AB] border-b-2 border-[#0047AB]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe size={14} />
            <span>Verified Polygon Contract</span>
          </button>
        </div>

        {/* Tab Content Form */}
        <form onSubmit={handleSubmitScan} className="p-6 sm:p-8 space-y-6">
          {/* Target: Files */}
          {targetType === 'files' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0047AB] border border-blue-100 flex items-center justify-center mx-auto mb-3">
                  <Upload size={22} />
                </div>
                <div className="text-sm font-bold text-slate-800 mb-1">
                  Click to browse or drag & drop Solidity contracts
                </div>
                <p className="text-xs text-slate-500">
                  Supports multiple <span className="font-mono text-slate-700">.sol</span> files and <span className="font-mono text-slate-700">.zip</span> archives (up to 10MB total)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".sol,.zip"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Uploaded File List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Selected Files ({uploadedFiles.length})
                  </div>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileCode size={14} className="text-[#0047AB] shrink-0" />
                          <span className="font-mono font-medium text-slate-800 truncate">
                            {f.name}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            ({(f.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Target: Paste Code */}
          {targetType === 'code' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Solidity Source Code
              </label>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="// SPDX-License-Identifier: MIT&#10;pragma solidity ^0.8.24;&#10;&#10;contract EscrowDeliverable {&#10;    address public beneficiary;&#10;    ...&#10;}"
                rows={12}
                className="w-full p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-transparent leading-relaxed"
                spellCheck={false}
              />
              <div className="text-[11px] text-slate-400 font-mono text-right">
                {codeSnippet.length} characters • {codeSnippet.split('\n').length} lines
              </div>
            </div>
          )}

          {/* Target: Polygon Contract Address */}
          {targetType === 'address' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Verified Polygon Contract Address (Chain ID: 137)
              </label>
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                placeholder="0x88dd19df1b6dBA8D2c53b3976f4ec39B75f17FbB"
                className="w-full p-3.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-transparent"
              />
              <p className="text-[11px] text-slate-500">
                AuditX fetches verified Solidity source directly from Polygonscan via public JSON-RPC.
              </p>
            </div>
          )}

          {/* Options Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project / Deliverable Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. EscrowMilestoneV2"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Compiler Version
              </label>
              <select
                value={compilerVersion}
                onChange={(e) => setCompilerVersion(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0047AB] bg-white"
              >
                {(capabilities?.supportedCompilers ?? ['v0.8.28', 'v0.8.26', 'v0.8.24', 'v0.8.20', 'v0.8.19', 'v0.7.6']).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Language
              </label>
              <input
                type="text"
                disabled
                value={language}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-500 bg-slate-100 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Inline Error */}
          {inlineError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
              <span>{inlineError}</span>
            </div>
          )}

          {/* Consent Checkbox */}
          <div className="pt-2 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="auditx-consent"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-[#0047AB] focus:ring-[#0047AB] cursor-pointer"
            />
            <label htmlFor="auditx-consent" className="text-xs text-slate-600 leading-normal cursor-pointer">
              I own this code or have explicit permission to scan it. I understand that analysis runs in an isolated sandbox under the{' '}
              <Link to="/auditx" className="text-[#0047AB] underline font-medium">
                AuditX data handling policy
              </Link>.
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              Free Tier: 15 scans / day • Gas-free
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !consentChecked}
              className={`px-6 py-3 rounded-xl font-semibold text-xs inline-flex items-center gap-2 transition-all cursor-pointer ${
                isSubmitting || !consentChecked
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#0047AB] text-white hover:bg-[#003580] shadow-sm active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting Scan...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Start Automated Scan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Scans Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-500" />
            <h3 className="font-bold text-sm text-slate-900">
              Your Recent Scan History
            </h3>
          </div>
          <button
            type="button"
            onClick={loadRecentScans}
            className="text-xs text-[#0047AB] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Refresh</span>
          </button>
        </div>

        {isLoadingScans ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-[#0047AB]" />
            <span>Loading recent scans...</span>
          </div>
        ) : recentScans.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No smart contract scans recorded yet for your wallet. Run your first scan above!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentScans.map((scan) => (
              <div key={scan.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {scan.projectName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        scan.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : scan.status === 'scanning'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                          : scan.status === 'failed'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {scan.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono flex flex-wrap items-center gap-2">
                    <span>Target: {scan.targetName}</span>
                    <span>•</span>
                    <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Severity counts */}
                  <div className="flex items-center gap-1">
                    {(['Critical', 'High', 'Medium', 'Low', 'Informational'] as FindingSeverity[]).map((sev) =>
                      getSeverityBadge(sev, scan.severitySummary[sev] || 0)
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-100">
                    {scan.status === 'completed' && (
                      <Link
                        to={`/auditx/reports/${scan.id}`}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0047AB] text-xs font-semibold border border-blue-200 transition-colors"
                      >
                        View Report
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteScan(scan.id)}
                      title="Delete scan"
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ScanWorkspacePage;
