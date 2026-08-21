import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, FileText, Link as LinkIcon, Sparkles, ShieldCheck, RefreshCw, Copy, ExternalLink, Check } from 'lucide-react';
import { generateIpfsCid } from '../utils/ipfs';

interface UploadingFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  cid?: string;
  done: boolean;
  error?: string;
  fileObj: File;
}

interface ProofOfWorkUploaderProps {
  onSubmit: (title: string, description: string, evidenceHashes: string[], externalLink?: string) => void;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/json"
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const ProofOfWorkUploader: React.FC<ProofOfWorkUploaderProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [lastSubmittedTitle, setLastSubmittedTitle] = useState('');
  const [lastSubmittedCids, setLastSubmittedCids] = useState<string[]>([]);
  const [copiedCid, setCopiedCid] = useState<string | null>(null);

  const processFile = async (fileObj: File, id: string) => {
    // Validate file size
    if (fileObj.size > MAX_FILE_SIZE) {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, done: true, progress: 0, error: "File exceeds 50MB limit" } : f))
      );
      return;
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.has(fileObj.type) && !fileObj.name.endsWith(".zip") && !fileObj.name.endsWith(".pdf") && !fileObj.name.endsWith(".json")) {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, done: true, progress: 0, error: "Unsupported file type" } : f))
      );
      return;
    }

    try {
      // Simulate progress
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: 30 } : f)));
      await new Promise((r) => setTimeout(r, 200));
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: 70 } : f)));
      await new Promise((r) => setTimeout(r, 200));

      // Generate a deterministic CID from file name + size (client-side, no upload)
      const cid = generateIpfsCid(`${fileObj.name}-${fileObj.size}-${fileObj.lastModified}`);

      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, progress: 100, cid, done: true, error: undefined } : f))
      );
    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, done: true, progress: 0, error: err.message || "Processing failed" } : f))
      );
    }
  };

  const handleUploadFiles = (fileList: FileList) => {
    const newUploadingFiles: UploadingFile[] = Array.from(fileList).map((f) => {
      const id = Math.random().toString(36).slice(2);
      processFile(f, id);
      return {
        id,
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
        progress: 0,
        done: false,
        fileObj: f,
      };
    });
    setFiles((prev) => [...prev, ...newUploadingFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files);
    }
  };

  const handleRetry = (file: UploadingFile) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, progress: 0, done: false, error: undefined } : f))
    );
    processFile(file.fileObj, file.id);
  };

  const handleCopyCid = (cid: string) => {
    navigator.clipboard.writeText(cid);
    setCopiedCid(cid);
    setTimeout(() => setCopiedCid(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const readyCids = files.filter((f) => f.done && f.cid).map((f) => f.cid as string);
    if (!title.trim() || !description.trim() || readyCids.length === 0) {
      alert('Please provide a deliverable title, summary description, and at least 1 successfully processed file.');
      return;
    }

    onSubmit(title.trim(), description.trim(), readyCids, externalLink.trim());

    setLastSubmittedTitle(title.trim());
    setLastSubmittedCids(readyCids);
    setTitle('');
    setDescription('');
    setExternalLink('');
    setFiles([]);
    setIsSubmittedSuccess(true);
  };

  if (isSubmittedSuccess) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 via-white to-purple-50 p-8 rounded-3xl border border-emerald-200 shadow-xl space-y-6 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
          <CheckCircle2 size={36} />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-mono font-black uppercase rounded-full tracking-wider">
            On-Chain Verified
          </span>
          <h3 className="text-2xl font-black text-slate-900 font-headline">
            Deliverables Submitted Successfully!
          </h3>
          <p className="text-sm font-semibold text-slate-600 max-w-lg mx-auto">
            Your work <span className="text-purple-700 font-extrabold">"{lastSubmittedTitle}"</span> has been logged to the smart contract escrow for client review.
          </p>
        </div>

        {lastSubmittedCids.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-left max-w-md mx-auto space-y-2 shadow-xs">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Evidence Reference Hashes:
            </span>
            {lastSubmittedCids.map((cid, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-purple-700 font-bold truncate">
                <div className="flex items-center gap-2 truncate">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  <span className="truncate">{cid}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCid(cid)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-purple-700 transition-colors shrink-0"
                  title="Copy CID"
                >
                  {copiedCid === cid ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsSubmittedSuccess(false)}
            className="px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black font-headline rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <RefreshCw size={15} /> Submit Additional Deliverable
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 font-headline flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-700" />
            Submit Proof of Work Deliverables
          </h3>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Attach deliverable files and submit evidence hashes to the on-chain escrow
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
          On-Chain Evidence
        </span>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
            Deliverable Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Completed Smart Contract Suite & Test Coverage Report"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-xl px-4 py-3 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
            Detailed Summary / Release Notes *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Describe what was built, how to run tests, and any relevant deployment details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-xl px-4 py-3 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition-all placeholder:text-slate-400 resize-none"
          />
        </div>

        {/* Drag & Drop File Zone */}
        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
            Evidence Files *
          </label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-300 hover:border-purple-600 rounded-2xl p-6 text-center bg-slate-50/80 hover:bg-purple-50/50 transition-all cursor-pointer relative group"
          >
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <UploadCloud className="w-10 h-10 text-purple-700 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-extrabold text-slate-900">
              Drag & drop deliverable files here, or <span className="text-purple-700 underline">browse</span>
            </p>
            <p className="text-xs font-bold text-slate-500 mt-1">Supports code archives, PDFs, screenshots, json (Max 50MB per file)</p>
          </div>
        </div>

        {/* File Processing List */}
        {files.length > 0 && (
          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
              Files & Evidence Hashes:
            </span>
            {files.map((file) => (
              <div key={file.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={15} className="text-purple-700 shrink-0" />
                    <span className="font-mono font-bold text-slate-900 truncate">{file.name}</span>
                    <span className="text-slate-500 font-semibold">({file.size})</span>
                  </div>
                  {file.done && !file.error ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold text-[11px]">
                      <CheckCircle2 size={13} /> Processed
                    </span>
                  ) : file.error ? (
                    <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold text-[11px]">
                      Failed
                    </span>
                  ) : (
                    <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold text-[11px]">
                      {file.progress}%
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full transition-all duration-200 ${file.error ? 'bg-red-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600'}`}
                    style={{ width: `${file.error ? 100 : file.progress}%` }}
                  />
                </div>

                {file.error && (
                  <div className="flex items-center justify-between text-[11px] text-red-600 pt-1.5 border-t border-slate-100 font-bold">
                    <span>Error: {file.error}</span>
                    <button
                      type="button"
                      onClick={() => handleRetry(file)}
                      className="text-purple-700 hover:text-purple-900 underline flex items-center gap-1"
                    >
                      <RefreshCw size={11} /> Retry
                    </button>
                  </div>
                )}

                {file.cid && (
                  <div className="flex items-center justify-between gap-1.5 text-[11px] font-mono text-purple-700 pt-1.5 border-t border-slate-100 font-bold">
                    <div className="flex items-center gap-1 truncate">
                      <span className="text-slate-500">Hash:</span>
                      <span className="truncate">{file.cid}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyCid(file.cid!)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-purple-700 transition-colors"
                        title="Copy Hash"
                      >
                        {copiedCid === file.cid ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* External Link (GitHub PR / Figma / Staging) */}
        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
            External Artifact / GitHub PR Link (Optional)
          </label>
          <div className="relative">
            <LinkIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="url"
              placeholder="https://github.com/org/repo/pull/42"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-xl !pl-10 px-4 py-3 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={files.length === 0 || files.some((f) => !f.done)}
        className="w-full bg-purple-700 hover:bg-purple-800 text-white font-headline font-black py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
      >
        <Sparkles size={16} />
        Submit Deliverables for Review
      </button>
    </form>
  );
};
