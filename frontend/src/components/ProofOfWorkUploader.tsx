import React, { useState } from 'react';
import { FileText, Link2, Sparkles, ShieldCheck, RefreshCw, Copy, Check, Send } from 'lucide-react';
import { generateIpfsCid, storeIpfsFile, getCachedIpfsFile } from '../utils/ipfs';
import { DeliverableFile } from '../types';

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
  onSubmit: (
    title: string,
    description: string,
    evidenceHashes: string[],
    externalLink?: string,
    evidenceFiles?: DeliverableFile[]
  ) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const CloudUploadIllustration = () => (
  <svg width="48" height="36" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-2">
    <defs>
      <linearGradient id="cloudGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    <path d="M38 15 C37.5 7.5 31 2 24 2 C18 2 12.8 6 11 11.5 C5 12.5 1 17.5 1 23.5 C1 30 6.5 35 13 35 L37 35 C42.5 35 47 30.5 47 25 C47 19.8 43 15.5 38 15 Z" fill="url(#cloudGradIcon)" />
    <path d="M24 13 L17 20 L21.5 20 L21.5 28 L26.5 28 L26.5 20 L31 20 Z" fill="#FFFFFF" />
  </svg>
);

export const ProofOfWorkUploader: React.FC<ProofOfWorkUploaderProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [copiedCid, setCopiedCid] = useState<string | null>(null);

  const processFile = (fileObj: File, id: string) => {
    if (fileObj.size > MAX_FILE_SIZE) {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, done: true, progress: 0, error: "File exceeds 50MB limit" } : f))
      );
      return;
    }

    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: 30 } : f)));

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.min(90, Math.round((event.loaded / event.total) * 90));
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: percent } : f)));
      }
    };

    reader.onload = () => {
      try {
        const dataUrl = reader.result as string;
        const cid = generateIpfsCid(`${fileObj.name}-${fileObj.size}-${fileObj.lastModified}-${Date.now()}`);

        storeIpfsFile(cid, {
          cid,
          name: fileObj.name,
          type: fileObj.type || 'application/octet-stream',
          size: fileObj.size,
          dataUrl,
          uploadedAt: Date.now(),
        });

        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, progress: 100, cid, done: true, error: undefined } : f))
        );
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, done: true, progress: 0, error: err.message || "Failed to process file" } : f))
        );
      }
    };

    reader.onerror = () => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, done: true, progress: 0, error: "Failed to read file from disk" } : f))
      );
    };

    reader.readAsDataURL(fileObj);
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
    if (!title.trim() || !description.trim() || !externalLink.trim()) {
      alert('Please provide a deliverable title, release summary description, and a valid project/deliverable link (strictly required).');
      return;
    }

    const readyCids = files.filter((f) => f.done && f.cid).map((f) => f.cid as string);
    const readyFiles: DeliverableFile[] = [];

    files.forEach((f) => {
      if (f.done && f.cid) {
        const cached = getCachedIpfsFile(f.cid);
        readyFiles.push({
          cid: f.cid,
          name: f.name,
          type: cached?.type || f.fileObj?.type || 'application/octet-stream',
          size: cached?.size || f.fileObj?.size || 0,
          dataUrl: cached?.dataUrl,
          uploadedAt: Date.now(),
        });
      }
    });

    if (readyCids.length === 0) {
      const generatedCid = generateIpfsCid({ title: title.trim(), link: externalLink.trim(), timestamp: Date.now() });
      readyCids.push(generatedCid);
      readyFiles.push({
        cid: generatedCid,
        name: 'Project-Release-Metadata.json',
        type: 'application/json',
        size: 1024,
        dataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ title: title.trim(), externalLink: externalLink.trim(), description: description.trim(), timestamp: Date.now() }))}`,
        uploadedAt: Date.now(),
      });
    }

    onSubmit(title.trim(), description.trim(), readyCids, externalLink.trim(), readyFiles);

    setTitle('');
    setDescription('');
    setExternalLink('');
    setFiles([]);
  };

  return (
    <form onSubmit={handleSubmit} className="border border-slate-200/90 rounded-3xl p-5 sm:p-7 bg-white shadow-xs space-y-5">
      {/* Form Header (Matching Image 3) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Send size={18} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 font-headline leading-tight">
              Submit Proof of Work Deliverables
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Provide the required project link and optionally attach supporting media or deliverables
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 shrink-0 font-mono shadow-2xs">
          <ShieldCheck size={13} className="text-purple-600" />
          On-Chain Evidence
        </span>
      </div>

      <div className="space-y-4">
        {/* Field 1: DELIVERABLE TITLE * */}
        <div>
          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Deliverable Title <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="e.g. Completed Smart Contract Suite & Test Coverage Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50/60 border border-slate-200 text-slate-900 font-medium text-xs sm:text-sm rounded-xl pl-9 pr-4 py-2.5 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
            />
            <FileText size={15} className="absolute left-3 top-3 text-blue-500 pointer-events-none" />
          </div>
        </div>

        {/* Field 2: PROJECT / DELIVERABLE LINK * (STRICTLY REQUIRED) */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <span className="text-slate-700">Project / Deliverable Link </span>
            <span className="text-rose-500 font-black">* (Strictly Required)</span>
          </label>
          <div className="relative">
            <input
              type="url"
              required
              placeholder="https://github.com/your-org/repo/pull/1 or https://demo.yourproject.xyz"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              className="w-full bg-slate-50/60 border border-slate-200 text-slate-900 font-medium text-xs sm:text-sm rounded-xl pl-9 pr-4 py-2.5 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all placeholder:text-slate-400"
            />
            <Link2 size={15} className="absolute left-3 top-3 text-purple-500 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Provide a working repository, pull request, Figma prototype, or live deployment URL.
          </p>
        </div>

        {/* Field 3: DETAILED SUMMARY / RELEASE NOTES * */}
        <div>
          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Detailed Summary / Release Notes <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <textarea
              required
              rows={3}
              placeholder="Describe what was built, how to run tests, and any relevant deployment details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50/60 border border-slate-200 text-slate-900 font-medium text-xs sm:text-sm rounded-xl pl-9 pr-4 py-2.5 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 resize-none"
            />
            <FileText size={15} className="absolute left-3 top-3 text-blue-500 pointer-events-none" />
          </div>
        </div>

        {/* Field 4: MEDIA & EVIDENCE FILES (OPTIONAL) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              Media & Evidence Files <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-mono">
              Optional
            </span>
          </div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-2xl p-6 text-center bg-blue-50/20 hover:bg-blue-50/40 transition-all cursor-pointer relative group"
          >
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <CloudUploadIllustration />
            <p className="text-xs font-bold text-slate-800">
              Drag & drop deliverable files here, or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Supports code archives, PDFs, screenshots, json (Max 50MB per file)
            </p>
          </div>
        </div>

        {/* Attached Files List */}
        {files.length > 0 && (
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
              Attached Files:
            </span>
            {files.map((file) => (
              <div key={file.id} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={14} className="text-purple-600 shrink-0" />
                    <span className="font-mono font-bold text-slate-800 truncate text-xs">{file.name}</span>
                    <span className="text-slate-400 font-semibold text-[11px]">({file.size})</span>
                  </div>
                  {file.done && !file.error ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold text-[10px]">
                      <Check size={11} /> Ready
                    </span>
                  ) : file.error ? (
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                      Failed
                    </span>
                  ) : (
                    <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                      {file.progress}%
                    </span>
                  )}
                </div>

                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${file.error ? 'bg-rose-500' : 'bg-blue-600'}`}
                    style={{ width: `${file.error ? 100 : file.progress}%` }}
                  />
                </div>

                {file.cid && (
                  <div className="flex items-center justify-between gap-1.5 text-[10.5px] font-mono text-purple-700 pt-1.5 mt-1 border-t border-slate-100">
                    <span className="truncate text-slate-500">CID: {file.cid}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCid(file.cid!)}
                      className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-purple-700 transition-colors"
                      title="Copy CID"
                    >
                      {copiedCid === file.cid ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button (Matching Image 3) */}
      <button
        type="submit"
        disabled={!title.trim() || !description.trim() || !externalLink.trim() || files.some((f) => !f.done)}
        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 hover:from-blue-700 hover:to-fuchsia-700 text-white font-bold py-3 px-6 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.005] disabled:opacity-50"
      >
        <Send size={15} className="text-white" />
        <span>Submit Deliverables for Review</span>
        <Sparkles size={16} className="text-purple-200 ml-auto sm:ml-2" />
      </button>
    </form>
  );
};
