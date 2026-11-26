import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Palette,
  Youtube,
  Instagram,
  Figma,
  FileText,
  Linkedin,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { PortfolioLinkItem } from '../../types';
import {
  detectPortfolioPlatform,
  normalizeSafeUrl,
  NON_TECH_DISCIPLINES,
} from '../../utils/portfolioPlatforms';

interface PortfolioVerifierFormProps {
  initialLinks?: PortfolioLinkItem[];
  initialDiscipline?: string;
  onSave: (data: {
    portfolioLinks: PortfolioLinkItem[];
    primaryDiscipline: string;
    portfolioVerified: boolean;
  }) => Promise<void> | void;
  submitLabel?: string;
  compact?: boolean;
}

function SmallPlatformIcon({ id }: { id: string }) {
  switch (id) {
    case 'behance':
    case 'dribbble':
      return <Palette size={14} className="text-[#0A52B8]" />;
    case 'youtube':
      return <Youtube size={14} className="text-[#0A52B8]" />;
    case 'instagram':
      return <Instagram size={14} className="text-[#0A52B8]" />;
    case 'figma':
      return <Figma size={14} className="text-[#0A52B8]" />;
    case 'notion':
      return <FileText size={14} className="text-[#0F172A]" />;
    case 'linkedin':
      return <Linkedin size={14} className="text-[#0A52B8]" />;
    default:
      return <Globe size={14} className="text-[#0A52B8]" />;
  }
}

export const PortfolioVerifierForm: React.FC<PortfolioVerifierFormProps> = ({
  initialLinks = [],
  initialDiscipline = NON_TECH_DISCIPLINES[0],
  onSave,
  submitLabel = 'Save & Verify Portfolio',
  compact = false,
}) => {
  const [discipline, setDiscipline] = useState<string>(initialDiscipline || NON_TECH_DISCIPLINES[0]);
  const [links, setLinks] = useState<PortfolioLinkItem[]>(initialLinks);
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const detectedPreview = detectPortfolioPlatform(urlInput);

  const handleAddLink = () => {
    setErrorMsg(null);
    if (links.length >= 5) {
      setErrorMsg('You can attach up to 5 verified portfolio works.');
      return;
    }
    const normalized = normalizeSafeUrl(urlInput);
    if (!normalized) {
      setErrorMsg('Please enter a valid https:// portfolio URL.');
      return;
    }
    const trimmedTitle = titleInput.trim();
    if (trimmedTitle.length < 2) {
      setErrorMsg('Please enter a short work title (e.g. Brand Redesign Case Study).');
      return;
    }
    const meta = detectPortfolioPlatform(normalized);
    const nextItem: PortfolioLinkItem = {
      id: `pf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      url: normalized,
      title: trimmedTitle,
      description: descInput.trim() || undefined,
      platform: meta.label,
      discipline,
    };
    setLinks((prev) => [...prev, nextItem]);
    setUrlInput('');
    setTitleInput('');
    setDescInput('');
  };

  const handleRemoveLink = (id: string) => {
    setLinks((prev) => prev.filter((item) => item.id !== id));
  };

  const handleConfirm = async () => {
    setErrorMsg(null);
    // If user filled fields cleanly without clicking Add yet, include automatically
    let finalLinks = [...links];
    if (urlInput.trim() && titleInput.trim() && finalLinks.length < 5) {
      const normalized = normalizeSafeUrl(urlInput);
      if (normalized) {
        const meta = detectPortfolioPlatform(normalized);
        finalLinks.push({
          id: `pf_${Date.now()}`,
          url: normalized,
          title: titleInput.trim(),
          description: descInput.trim() || undefined,
          platform: meta.label,
          discipline,
        });
        setLinks(finalLinks);
        setUrlInput('');
        setTitleInput('');
        setDescInput('');
      }
    }

    if (finalLinks.length === 0) {
      setErrorMsg('Add at least 1 portfolio work link to earn your Portfolio Verified badge.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        portfolioLinks: finalLinks,
        primaryDiscipline: discipline,
        portfolioVerified: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Primary Non-Tech Discipline */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#0F172A]">
          Primary Creative / Non-Tech Discipline
        </label>
        <div className="flex flex-wrap gap-1.5">
          {NON_TECH_DISCIPLINES.map((item) => {
            const active = discipline === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setDiscipline(item)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:border-[#0A52B8]'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Link Form */}
      <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/90 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#0F172A]">
            Add Portfolio Work ({links.length}/5)
          </span>
          {urlInput.trim().length > 3 && (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${detectedPreview.badgeBgClass}`}
            >
              <SmallPlatformIcon id={detectedPreview.id} />
              <span>Detected: {detectedPreview.label}</span>
            </span>
          )}
        </div>

        <div className={`grid grid-cols-1 ${compact ? '' : 'sm:grid-cols-2'} gap-2.5`}>
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Featured work title (e.g. SaaS Brand Refresh)"
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A52B8]/20 focus:border-[#0A52B8]"
          />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://behance.net/... or dribbble / youtube / figma"
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A52B8]/20 focus:border-[#0A52B8]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={descInput}
            onChange={(e) => setDescInput(e.target.value)}
            placeholder="Short outcome summary (optional, e.g. 42% higher retention)"
            className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A52B8]/20 focus:border-[#0A52B8]"
          />
          <button
            type="button"
            onClick={handleAddLink}
            disabled={links.length >= 5}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#0A52B8] text-xs font-semibold text-[#0A52B8] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus size={14} />
            <span>Add Work</span>
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Existing Portfolio Links */}
      {links.length > 0 && (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
          {links.map((item) => {
            const meta = detectPortfolioPlatform(item.url);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200/90"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shrink-0">
                    <SmallPlatformIcon id={meta.id} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#0F172A] truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                        {meta.label}
                      </span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-[#0A52B8] hover:underline truncate inline-flex items-center gap-1 max-w-full"
                    >
                      <span className="truncate">{item.url}</span>
                      <ExternalLink size={10} className="shrink-0" />
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                  aria-label={`Remove ${item.title}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-[#0A52B8] hover:bg-[#084298] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
      >
        <CheckCircle2 size={16} />
        <span>{saving ? 'Saving Verified Showcase...' : submitLabel}</span>
      </button>
    </div>
  );
};

export default PortfolioVerifierForm;
