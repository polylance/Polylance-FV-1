import React from 'react';
import {
  ExternalLink,
  Figma,
  Globe,
  Instagram,
  Layers,
  Linkedin,
  FileText,
  Palette,
  Youtube,
  ShieldCheck,
} from 'lucide-react';
import { PortfolioLinkItem } from '../../types';
import { detectPortfolioPlatform } from '../../utils/portfolioPlatforms';

interface PortfolioPreviewGridProps {
  items?: PortfolioLinkItem[];
  discipline?: string;
  verified?: boolean;
  className?: string;
}

function PlatformIcon({ platformId }: { platformId: string }) {
  switch (platformId) {
    case 'behance':
    case 'dribbble':
      return <Palette size={15} className="text-[#0A52B8]" />;
    case 'youtube':
      return <Youtube size={15} className="text-[#0A52B8]" />;
    case 'instagram':
      return <Instagram size={15} className="text-[#0A52B8]" />;
    case 'figma':
      return <Figma size={15} className="text-[#0A52B8]" />;
    case 'notion':
      return <FileText size={15} className="text-[#0F172A]" />;
    case 'linkedin':
      return <Linkedin size={15} className="text-[#0A52B8]" />;
    default:
      return <Globe size={15} className="text-[#0A52B8]" />;
  }
}

export const PortfolioPreviewGrid: React.FC<PortfolioPreviewGridProps> = ({
  items = [],
  discipline,
  verified = false,
  className = '',
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className={`space-y-3 text-left ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {verified && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-semibold text-[#0A52B8]">
              <ShieldCheck size={13} />
              <span>Portfolio Verified ✓</span>
            </span>
          )}
          {discipline && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-[#0F172A]">
              <Layers size={12} className="text-slate-500" />
              <span>{discipline}</span>
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-slate-500">
          {items.length} curated {items.length === 1 ? 'work' : 'works'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {items.map((item) => {
          const meta = detectPortfolioPlatform(item.url);
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl bg-white border border-slate-200/90 hover:border-[#0A52B8] p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${meta.badgeBgClass}`}
                  >
                    <PlatformIcon platformId={meta.id} />
                    <span>{item.platform || meta.label}</span>
                  </span>
                  <ExternalLink
                    size={14}
                    className="text-slate-400 group-hover:text-[#0A52B8] transition-colors shrink-0"
                  />
                </div>

                <h4 className="text-sm font-bold text-[#0F172A] group-hover:text-[#0A52B8] transition-colors line-clamp-1">
                  {item.title}
                </h4>

                {item.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-[#0A52B8]">
                <span className="truncate max-w-[190px] text-slate-500 font-mono">
                  {item.url.replace(/^https?:\/\//i, '')}
                </span>
                <span className="shrink-0 group-hover:translate-x-0.5 transition-transform font-semibold">
                  Open Work →
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default PortfolioPreviewGrid;
