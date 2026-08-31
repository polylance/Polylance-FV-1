import React from 'react';
import { 
  CheckCircle2, Sparkles, Code2, Database, ShieldCheck, 
  Layers, Cpu, FileText, Check, ChevronRight, Terminal, 
  Boxes, Server, Wrench, Award, Compass, Workflow, ListChecks
} from 'lucide-react';

interface FormattedJobDescriptionProps {
  description: string;
  className?: string;
  truncate?: boolean;
  maxLines?: number;
}

/**
 * Formats inline bold (**text**), italics (*text*), inline code (`code`),
 * and highlight tags.
 */
export const formatInlineText = (text: string): React.ReactNode => {
  if (!text) return null;

  // Split by markdown bold (**text** or __text__) and inline code (`code`)
  const tokens = text.split(/(\*\*.*?\*\*|__.*?__|`.*?`)/g);

  return tokens.map((token, index) => {
    if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      const content = token.slice(2, -2);
      return (
        <strong 
          key={index} 
          className="font-extrabold text-slate-900 bg-purple-100/60 text-purple-950 px-1.5 py-0.5 rounded-md border border-purple-200/60 shadow-3xs inline-block mx-0.5"
        >
          {content}
        </strong>
      );
    }

    if (token.startsWith('`') && token.endsWith('`')) {
      const codeContent = token.slice(1, -1);
      return (
        <code 
          key={index} 
          className="font-mono text-xs text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 font-semibold"
        >
          {codeContent}
        </code>
      );
    }

    // Handle normal text
    return <span key={index}>{token}</span>;
  });
};

/**
 * Returns an appropriate icon for a section based on its title keywords.
 */
const getSectionIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('work') || lower.includes('responsibilit') || lower.includes('scope') || lower.includes('feature')) {
    return <Workflow size={15} className="text-purple-600 shrink-0" />;
  }
  if (lower.includes('blockchain') || lower.includes('web3') || lower.includes('contract') || lower.includes('solidity')) {
    return <Cpu size={15} className="text-indigo-600 shrink-0" />;
  }
  if (lower.includes('database') || lower.includes('api') || lower.includes('backend') || lower.includes('server')) {
    return <Database size={15} className="text-cyan-600 shrink-0" />;
  }
  if (lower.includes('requirement') || lower.includes('criteria') || lower.includes('qualification')) {
    return <ListChecks size={15} className="text-emerald-600 shrink-0" />;
  }
  if (lower.includes('stack') || lower.includes('tech') || lower.includes('tool')) {
    return <Boxes size={15} className="text-blue-600 shrink-0" />;
  }
  if (lower.includes('deliverable') || lower.includes('milestone') || lower.includes('output')) {
    return <Award size={15} className="text-amber-600 shrink-0" />;
  }
  return <Sparkles size={15} className="text-purple-600 shrink-0" />;
};

/**
 * FormattedJobDescription Component
 * Parses multi-line & single-string raw job descriptions into structured sections,
 * bullet lists, headings, and highlighted bold keywords.
 */
export const FormattedJobDescription: React.FC<FormattedJobDescriptionProps> = ({
  description,
  className = '',
  truncate = false,
  maxLines = 3,
}) => {
  if (!description || typeof description !== 'string') {
    return (
      <div className={`text-slate-400 italic text-sm ${className}`}>
        No description provided.
      </div>
    );
  }

  // Pre-process inline colon-led sections if the input was flattened into one single line
  // e.g. "functionality :Blockchain Integration The backend..." or "system. :Database & APIs Design..."
  let normalized = description
    .replace(/(\b[A-Za-z0-9\s,]+\b)\s*:([A-Z][A-Za-z0-9\s&/]+)\b/g, '$1\n\n### $2\n')
    .replace(/(\n|^)\s*:\s*([A-Za-z0-9\s&/]+)/g, '\n\n### $2\n')
    .trim();

  // If text contains inline asterisk lists like "What You'll Work On: * Item 1 * Item 2 * Item 3"
  // Normalize each "* " into a new line with standard markdown bullet
  normalized = normalized.replace(/:\s*\*\s+/g, ':\n* ');
  normalized = normalized.replace(/\s+\*\s+/g, '\n* ');

  // Split into raw lines / blocks
  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  // Group into structured sections
  interface ParsedSection {
    title?: string;
    items: string[];
    paragraphs: string[];
  }

  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection = { items: [], paragraphs: [] };

  const isHeading = (line: string) => {
    if (line.startsWith('###') || line.startsWith('##') || line.startsWith('#')) return true;
    if (/^(what you'll work on|requirements|deliverables|preferred stack|tech stack|key responsibilities|scope of work|qualifications|blockchain integration|database & apis|architecture|about the project|overview):?$/i.test(line)) return true;
    if (line.endsWith(':') && line.length < 50 && !line.includes('.')) return true;
    return false;
  };

  const cleanHeading = (line: string) => {
    return line.replace(/^#{1,3}\s*/, '').replace(/:$/, '').trim();
  };

  for (const line of lines) {
    if (isHeading(line)) {
      if (currentSection.paragraphs.length > 0 || currentSection.items.length > 0 || currentSection.title) {
        sections.push(currentSection);
      }
      currentSection = { title: cleanHeading(line), items: [], paragraphs: [] };
    } else if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ') || /^\d+\.\s+/.test(line)) {
      const itemText = line.replace(/^(\*|-|•|\d+\.)\s*/, '').trim();
      if (itemText) {
        currentSection.items.push(itemText);
      }
    } else {
      currentSection.paragraphs.push(line);
    }
  }

  if (currentSection.paragraphs.length > 0 || currentSection.items.length > 0 || currentSection.title) {
    sections.push(currentSection);
  }

  // If truncate is enabled for compact card previews
  if (truncate) {
    return (
      <div className={`line-clamp-${maxLines} text-xs text-slate-600 leading-relaxed font-sans ${className}`}>
        {description.replace(/\*\*/g, '').replace(/###/g, '')}
      </div>
    );
  }

  return (
    <div className={`space-y-4 font-sans text-slate-800 ${className}`}>
      {sections.map((sec, secIdx) => {
        const hasTitle = Boolean(sec.title);
        const isTechStack = sec.title?.toLowerCase().includes('stack') || sec.title?.toLowerCase().includes('technolog');

        return (
          <div 
            key={secIdx}
            className={`space-y-3 ${
              hasTitle 
                ? 'pt-3 first:pt-0 border-t first:border-t-0 border-slate-100' 
                : ''
            }`}
          >
            {/* Section Header */}
            {hasTitle && (
              <div className="flex items-center gap-2 pb-1">
                <div className="w-6 h-6 rounded-lg bg-purple-50 border border-purple-200/60 flex items-center justify-center shadow-3xs">
                  {getSectionIcon(sec.title!)}
                </div>
                <h4 className="font-headline font-black text-sm text-slate-900 tracking-tight">
                  {sec.title}
                </h4>
              </div>
            )}

            {/* Paragraphs */}
            {sec.paragraphs.map((para, pIdx) => {
              // Check if paragraph is a key-value or preferred stack line
              const isHighlightLine = para.startsWith('**Preferred stack:**') || para.startsWith('**Tech Stack:**') || para.startsWith('Preferred stack:');
              
              if (isHighlightLine) {
                return (
                  <div 
                    key={pIdx} 
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-purple-50/90 border border-purple-200/80 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950 font-headline">
                      <Boxes size={14} className="text-purple-600" />
                      <span>Preferred Technology Stack</span>
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed font-sans">
                      {formatInlineText(para.replace(/^\*\*(Preferred|Tech) stack:\*\*\s*/i, ''))}
                    </div>
                  </div>
                );
              }

              return (
                <p 
                  key={pIdx} 
                  className="text-xs sm:text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap font-sans"
                >
                  {formatInlineText(para)}
                </p>
              );
            })}

            {/* Structured Bullet Points */}
            {sec.items.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {sec.items.map((item, itemIdx) => (
                  <div 
                    key={itemIdx}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-3xs hover:border-purple-300 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} className="stroke-[3]" />
                    </div>
                    <span className="text-xs text-slate-700 leading-snug font-medium">
                      {formatInlineText(item)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
