/**
 * PolyLance Blog Studio — Media Library & Upload Modal
 */

import React, { useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Check, Copy, AlertCircle, X, Search } from 'lucide-react';
import { StudioMedia } from '../types';
import { Button } from '../../../components/common/Button';
import { useModalScrollLock } from '../hooks/useModalScrollLock';

interface BlogStudioMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: StudioMedia[];
  onUpload: (data: { dataUrl: string; alt: string; mime: string; size: number }) => Promise<StudioMedia>;
  onSelectImage?: (url: string, alt: string) => void;
}

export const BlogStudioMediaModal: React.FC<BlogStudioMediaModalProps> = ({
  isOpen,
  onClose,
  mediaList,
  onUpload,
  onSelectImage,
}) => {
  useModalScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [altText, setAltText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setError(null);
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setError('Invalid format. Only PNG, JPEG, and WebP images are permitted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB maximum limit.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !previewUrl) {
      setError('Please select an image to upload.');
      return;
    }
    if (!altText.trim() || altText.trim().length < 3) {
      setError('Alt text is strictly required for accessibility and SEO.');
      return;
    }

    setUploading(true);
    try {
      const media = await onUpload({
        dataUrl: previewUrl,
        alt: altText.trim(),
        mime: selectedFile.type,
        size: selectedFile.size,
      });

      if (onSelectImage) {
        onSelectImage(media.url, media.alt);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setAltText('');
      setActiveTab('library');
    } catch (err: any) {
      setError(err?.message || 'Failed to upload media asset.');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMedia = mediaList.filter(
    (m) => !search || m.alt.toLowerCase().includes(search.toLowerCase()) || m.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
      data-lenis-prevent="true"
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon size={18} className="text-[#0047AB]" />
            <h3 className="font-extrabold text-base text-[#0B0B0F]">Blog Media Manager</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Header */}
        <div className="px-5 pt-3 border-b border-slate-100 flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-[#0047AB] text-[#0047AB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload New Asset
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'library'
                ? 'border-[#0047AB] text-[#0047AB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Media Library ({mediaList.length})
          </button>
        </div>

        {/* Modal Content */}
        <div
          className="flex-1 overflow-y-auto p-6"
          data-lenis-prevent="true"
          style={{ overscrollBehavior: 'auto' }}
        >
          {activeTab === 'upload' ? (
            <form onSubmit={handleUploadSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Drag and drop box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-slate-200 hover:border-[#0047AB] rounded-2xl p-8 text-center transition-colors cursor-pointer bg-[#F8FAFC]"
                onClick={() => document.getElementById('media-file-input')?.click()}
              >
                <input
                  id="media-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                  }}
                />
                <UploadCloud size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-bold text-[#0B0B0F]">
                  Click to select or drag and drop image here
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported formats: PNG, JPEG, WebP (Max 5MB)
                </p>
              </div>

              {previewUrl && (
                <div className="space-y-4">
                  <div className="max-h-48 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                    <img src={previewUrl} alt="Upload preview" className="max-h-44 object-contain rounded-lg" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alt Text Description <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="Describe what is in this image (required for accessibility & SEO)..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-[#0B0B0F] focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setSelectedFile(null)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={uploading}
                      className="bg-[#0047AB] hover:bg-[#00388A]"
                    >
                      Save & Insert Asset
                    </Button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter media by alt text or URL..."
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
                />
              </div>

              {filteredMedia.length === 0 ? (
                <p className="py-12 text-center text-xs text-slate-400">No media assets found.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredMedia.map((media) => (
                    <div
                      key={media.id}
                      className="group border border-slate-200 rounded-xl p-2 hover:border-[#0047AB] transition-colors bg-white flex flex-col justify-between"
                    >
                      <div className="h-28 overflow-hidden rounded-lg bg-slate-50 flex items-center justify-center mb-2">
                        <img src={media.url} alt={media.alt} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[11px] font-medium text-slate-700 line-clamp-1 mb-2">
                        {media.alt}
                      </p>
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(media.url, media.id)}
                          className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === media.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                          <span>{copiedId === media.id ? 'Copied' : 'Copy URL'}</span>
                        </button>
                        {onSelectImage && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectImage(media.url, media.alt);
                              onClose();
                            }}
                            className="text-[10px] font-bold text-[#0047AB] hover:underline cursor-pointer"
                          >
                            Insert
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
