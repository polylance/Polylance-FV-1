import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, FileText, Link as LinkIcon, Loader2, Sparkles } from 'lucide-react';
import { generateIpfsCid, getIpfsGatewayUrl } from '../utils/ipfs';

interface UploadingFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  cid?: string;
  done: boolean;
}

interface ProofOfWorkUploaderProps {
  onSubmit: (title: string, description: string, evidenceHashes: string[], externalLink?: string) => void;
}

export const ProofOfWorkUploader: React.FC<ProofOfWorkUploaderProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const simulateFileUpload = (fileList: FileList) => {
    setIsUploading(true);
    const newUploadingFiles: UploadingFile[] = Array.from(fileList).map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
      progress: 0,
      done: false,
    }));

    setFiles((prev) => [...prev, ...newUploadingFiles]);

    newUploadingFiles.forEach((fileObj) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 25) + 15;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          const cid = generateIpfsCid(fileObj.name + Date.now().toString());
          setFiles((prev) =>
            prev.map((f) => (f.id === fileObj.id ? { ...f, progress: 100, cid, done: true } : f))
          );
          setIsUploading(false);
        } else {
          setFiles((prev) =>
            prev.map((f) => (f.id === fileObj.id ? { ...f, progress: currentProgress } : f))
          );
        }
      }, 350);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      simulateFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateFileUpload(e.target.files);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const readyCids = files.filter((f) => f.done && f.cid).map((f) => f.cid as string);
    if (!title || !description || readyCids.length === 0) {
      alert('Please provide a title, description, and at least 1 uploaded evidence file.');
      return;
    }
    onSubmit(title, description, readyCids, externalLink);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-5 border-purple-500/30 bg-slate-950/80">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Submit Proof of Work
          </h3>
          <p className="text-xs text-slate-400">
            Upload deliverables directly to IPFS for permanent on-chain review
          </p>
        </div>
        <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-800/50">
          IPFS Storage Engine
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Deliverable Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Completed Smart Contract Suite & Test Coverage Report"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full glass-input"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Detailed Summary / Release Notes *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Describe what was built, how to run tests, and any relevant deployment details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full glass-input resize-none"
          />
        </div>

        {/* Drag & Drop File Zone */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Evidence Files (Direct IPFS Upload) *
          </label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-700 hover:border-purple-500/60 rounded-xl p-6 text-center bg-slate-900/40 hover:bg-slate-900/70 transition-all cursor-pointer relative group"
          >
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <UploadCloud className="w-10 h-10 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-slate-200">
              Drag & drop deliverable files here, or <span className="text-purple-400 underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Supports code archives, PDFs, screenshots, videos (Max 50MB per file)</p>
          </div>
        </div>

        {/* Uploaded Progress List */}
        {files.length > 0 && (
          <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              Upload Stream & IPFS Hashes:
            </span>
            {files.map((file) => (
              <div key={file.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={14} className="text-slate-400" />
                    <span className="font-mono text-slate-200 truncate">{file.name}</span>
                    <span className="text-slate-400">({file.size})</span>
                  </div>
                  {file.done ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                      <CheckCircle2 size={13} /> Uploaded
                    </span>
                  ) : (
                    <span className="text-purple-400 flex items-center gap-1 font-semibold text-[11px]">
                      <Loader2 size={13} className="animate-spin" /> {file.progress}%
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-200"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>

                {file.cid && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400/90 pt-1 border-t border-slate-900">
                    <span className="text-slate-400">IPFS CID:</span>
                    <a
                      href={getIpfsGatewayUrl(file.cid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-cyan-300 truncate"
                    >
                      {file.cid}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* External Link (GitHub PR / Figma / Staging) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            External Artifact / GitHub PR Link (Optional)
          </label>
          <div className="relative">
            <LinkIcon size={15} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="url"
              placeholder="https://github.com/org/repo/pull/42"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              className="w-full glass-input pl-9"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isUploading || files.length === 0}
        className="w-full gradient-btn-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
      >
        <Sparkles size={16} />
        Submit Deliverables for Review
      </button>
    </form>
  );
};
