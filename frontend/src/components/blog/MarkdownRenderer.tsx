/**
 * MarkdownRenderer — PolyLance Blog Article Renderer
 *
 * Uses react-markdown + remark-gfm + rehype-slug so that:
 * - GFM tables, lists, bold/italic, code fences all render correctly
 * - Every H2/H3 heading gets a stable slug id (used by the TOC)
 * - External links are forced to rel="noopener noreferrer" target="_blank"
 * - Code blocks have a copy button
 * - Callout syntax "> [!INFO] ..." is parsed into tinted callout boxes
 * - Numbered steps ("1. **Step Name**: Description") render as a visual Step Process
 * - Tables have horizontal scroll containers and zebra styling
 * - Placeholders like {{PLATFORM_FEE_PERCENT}} are resolved from shared fee config
 * - Design tokens from DESIGN_SYSTEM.md are used throughout
 */

import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { Copy, Check, Info, AlertTriangle, Lightbulb, Star, CheckCircle2 } from 'lucide-react';
import type { Components } from 'react-markdown';
import { PLATFORM_FEE_PERCENT, REVIEW_WINDOW_DAYS } from '../../seo/site.config';
import { CLIENT_FEE_PERCENT, FREELANCER_FEE_PERCENT, TOTAL_PLATFORM_FEE_PERCENT } from '../../utils/fees';

// ─────────────────────────────────────────────
// Token Resolution Helper
// ─────────────────────────────────────────────
export function resolveBlogTokens(raw: string): string {
  if (!raw) return '';
  const totalFee = (PLATFORM_FEE_PERCENT * 2).toFixed(1);
  return raw
    .replace(/\{\{PLATFORM_FEE_PERCENT\}\}/g, `${PLATFORM_FEE_PERCENT}%`)
    .replace(/\{\{PLATFORM_FEE_TOTAL\}\}/g, `${totalFee}%`)
    .replace(/\{\{REVIEW_WINDOW_DAYS\}\}/g, `${REVIEW_WINDOW_DAYS}`)
    .replace(/\{\{NETWORK_FINALITY\}\}/g, '~2 seconds')
    .replace(/\{\{CHAIN_NAME\}\}/g, 'Polygon PoS')
    .replace(/\{\{ESCROW_CONTRACT\}\}/g, 'JobEscrow.sol')
    .replace(/\{\{JOB_FACTORY_CONTRACT\}\}/g, 'JobFactory.sol');
}

// ─────────────────────────────────────────────
// Code block with copy button
// ─────────────────────────────────────────────
const CodeBlock: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace('language-', '') ?? '';
  const code = String(children).replace(/\n$/, '');

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [code]);

  return (
    <div className="relative group my-6 rounded-2xl overflow-hidden border border-[#E2E6EC] bg-[#0A1120] shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F172A] border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 inline-block" />
          {lang && (
            <span className="ml-2 text-[11px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider">
              {lang}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copied code' : 'Copy code'}
          className="flex items-center gap-1.5 text-xs font-medium text-[#94A3B8] hover:text-white transition-colors px-2 py-1 rounded bg-[#1E293B]/60 hover:bg-[#1E293B]"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm font-mono leading-relaxed text-[#F8FAFC]">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// ─────────────────────────────────────────────
// Callout parser: blockquote lines starting with [!INFO], [!TIP], [!WARNING], [!KEY]
// ─────────────────────────────────────────────
type CalloutType = 'info' | 'tip' | 'warning' | 'key' | 'takeaways';

interface CalloutConfig {
  icon: React.ReactNode;
  bg: string;
  border: string;
  label: string;
  text: string;
  labelColor: string;
}

const CALLOUT_CONFIGS: Record<CalloutType, CalloutConfig> = {
  info: {
    icon: <Info size={18} />,
    bg: '#EFF6FF',
    border: '#BFDBFE',
    label: 'Information',
    text: '#1E3A8A',
    labelColor: '#1D4ED8',
  },
  tip: {
    icon: <Lightbulb size={18} />,
    bg: '#F0FDF4',
    border: '#BBF7D0',
    label: 'Pro Tip',
    text: '#14532D',
    labelColor: '#166534',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    bg: '#FFFBEB',
    border: '#FDE68A',
    label: 'Important Warning',
    text: '#78350F',
    labelColor: '#B45309',
  },
  key: {
    icon: <Star size={18} />,
    bg: '#F8FAFC',
    border: '#CBD5E1',
    label: 'Key Point',
    text: '#0B0B0F',
    labelColor: '#0047AB',
  },
  takeaways: {
    icon: <CheckCircle2 size={18} />,
    bg: '#F0F7FF',
    border: '#BFDBFE',
    label: 'Key Takeaways',
    text: '#0F172A',
    labelColor: '#0047AB',
  },
};

function extractCallout(childrenText: string): { type: CalloutType; body: string } | null {
  const match = childrenText.trim().match(/^\[!(INFO|TIP|WARNING|KEY(?:\s+POINT)?|KEY-TAKEAWAYS|TAKEAWAYS)\]\s*([\s\S]*)/i);
  if (!match) return null;
  const raw = match[1].toUpperCase().replace(/\s+POINT/, '');
  const typeMap: Record<string, CalloutType> = {
    INFO: 'info',
    TIP: 'tip',
    WARNING: 'warning',
    KEY: 'key',
    'KEY-TAKEAWAYS': 'takeaways',
    TAKEAWAYS: 'takeaways',
  };
  return { type: typeMap[raw] ?? 'info', body: match[2].trim() };
}

// ─────────────────────────────────────────────
// Step List Item (detects "1. **Step Name**: Body")
// ─────────────────────────────────────────────
const StepListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <li className="relative pl-9 pb-6 last:pb-0 list-none group">
      {/* Vertical line connector */}
      <span className="absolute left-3.5 top-7 bottom-0 w-0.5 bg-[#E2E8F0] group-last:hidden" />
      {/* Number pill */}
      <span className="absolute left-0 top-0.5 w-7 h-7 rounded-full bg-[#0047AB] text-white flex items-center justify-center font-bold text-xs shadow-xs">
        •
      </span>
      <div className="text-[17px] text-[#374151] leading-[1.75]">{children}</div>
    </li>
  );
};

// ─────────────────────────────────────────────
// Helper: extract raw text from children
// ─────────────────────────────────────────────
function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join('');
  if (React.isValidElement(children)) {
    return extractTextFromChildren((children.props as { children?: React.ReactNode }).children);
  }
  return '';
}

// ─────────────────────────────────────────────
// Responsive Markdown Table (Zero Horizontal Scroll, Container Query Stacked Cards)
// ─────────────────────────────────────────────
const ResponsiveMarkdownTable: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width || 800);
    return () => ro.disconnect();
  }, []);

  const isNarrow = containerWidth < 560;

  // Extract thead headers and tbody rows from children
  const [headers, rows, numCols] = useMemo(() => {
    const extractedHeaders: string[] = [];
    const extractedRows: React.ReactNode[][] = [];

    React.Children.forEach(children, (child: any) => {
      if (!child) return;
      if (child.type === 'thead') {
        React.Children.forEach(child.props?.children, (tr: any) => {
          if (!tr || !tr.props) return;
          React.Children.forEach(tr.props.children, (th: any) => {
            if (!th) return;
            const text = extractTextFromChildren(th.props?.children);
            let dynamicText = text.trim();
            if (dynamicText.includes('Client Fee')) {
              dynamicText = `Client Fee (${CLIENT_FEE_PERCENT}%)`;
            } else if (dynamicText.includes('Freelancer Fee')) {
              dynamicText = `Freelancer Fee (${FREELANCER_FEE_PERCENT}%)`;
            } else if (dynamicText.includes('PolyLance Fee')) {
              dynamicText = `Total PolyLance Fee (${TOTAL_PLATFORM_FEE_PERCENT}%)`;
            }
            extractedHeaders.push(dynamicText);
          });
        });
      } else if (child.type === 'tbody') {
        React.Children.forEach(child.props?.children, (tr: any) => {
          if (!tr || !tr.props) return;
          const rowCells: React.ReactNode[] = [];
          React.Children.forEach(tr.props.children, (td: any) => {
            if (!td) return;
            rowCells.push(td.props?.children);
          });
          if (rowCells.length > 0) {
            extractedRows.push(rowCells);
          }
        });
      }
    });

    const cols = extractedHeaders.length || (extractedRows[0] ? extractedRows[0].length : 0);
    return [extractedHeaders, extractedRows, cols];
  }, [children]);

  // Wide table breakout in article text column (> 4 columns)
  const isWide = numCols > 4;
  const breakoutClass = isWide
    ? 'lg:-mx-8 xl:-mx-14 lg:w-[calc(100%+4rem)] xl:w-[calc(100%+7rem)] max-w-none'
    : 'w-full';

  if (isNarrow && headers.length > 0 && rows.length > 0) {
    return (
      <div
        ref={containerRef}
        className="my-6 space-y-3.5 w-full"
        role="table"
        aria-label="Fee and Pricing Schedule"
      >
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            role="row"
            className="bg-white rounded-2xl border border-[#E2E6EC] p-4 space-y-2 shadow-2xs hover:border-[#CBD5E1] transition-all"
          >
            {row.map((cell, colIdx) => {
              const headerLabel = headers[colIdx] || `Col ${colIdx + 1}`;
              const isHighlight =
                headerLabel.toLowerCase().includes('freelancer receives') ||
                headerLabel.toLowerCase().includes('total client');

              return (
                <div
                  key={colIdx}
                  role="cell"
                  className={`flex items-baseline justify-between gap-3 text-xs py-1.5 border-b border-slate-100 last:border-b-0 ${
                    isHighlight
                      ? 'bg-[#EFF6FF]/70 -mx-2 px-2 rounded-lg font-bold text-[#0047AB]'
                      : ''
                  }`}
                >
                  <span className="font-semibold text-slate-500 shrink-0 text-[11px] uppercase tracking-wide">
                    {headerLabel}:
                  </span>
                  <div className="font-medium text-[#0B0B0F] text-right whitespace-nowrap tabular-nums">
                    {cell}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`my-8 rounded-2xl border border-[#E2E6EC] bg-white shadow-2xs overflow-x-auto ${breakoutClass}`}
    >
      <table className="w-full text-xs sm:text-sm text-[#374151] border-collapse bg-white table-auto">
        {children}
      </table>
    </div>
  );
};

// ─────────────────────────────────────────────
// Custom components for react-markdown
// ─────────────────────────────────────────────
function buildComponents(): Components {
  return {
    // Headings — scroll-margin-top ensures heading is not hidden behind fixed navbar
    h2: ({ children, id, ...props }) => (
      <h2
        id={id}
        tabIndex={-1}
        className="text-2xl sm:text-3xl font-extrabold text-[#0B0B0F] tracking-tight mt-12 mb-4 scroll-mt-24 outline-none border-b border-[#F1F5F9] pb-2"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, id, ...props }) => (
      <h3
        id={id}
        tabIndex={-1}
        className="text-xl sm:text-2xl font-bold text-[#0B0B0F] tracking-tight mt-8 mb-3 scroll-mt-24 outline-none"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, id, ...props }) => (
      <h4
        id={id}
        tabIndex={-1}
        className="text-base sm:text-lg font-semibold text-[#0B0B0F] mt-6 mb-2 scroll-mt-24 outline-none"
        {...props}
      >
        {children}
      </h4>
    ),

    // Paragraph
    p: ({ children }) => (
      <p className="text-[17px] text-[#374151] leading-[1.78] my-4 max-w-[740px]">
        {children}
      </p>
    ),

    // Lists
    ul: ({ children }) => (
      <ul className="list-disc pl-6 my-4 space-y-2 text-[17px] text-[#374151] leading-[1.78] max-w-[740px]">
        {children}
      </ul>
    ),
    ol: ({ children }) => {
      // Render ordered lists cleanly
      return (
        <ol className="list-decimal pl-6 my-4 space-y-2 text-[17px] text-[#374151] leading-[1.78] max-w-[740px]">
          {children}
        </ol>
      );
    },
    li: ({ children }) => (
      <li className="leading-[1.78] marker:text-[#0047AB]">{children}</li>
    ),

    // Inline code & code blocks
    code: ({ children, className, ...props }) => {
      if (!className && !String(children).includes('\n')) {
        return (
          <code
            className="font-mono text-sm bg-slate-100 text-[#0047AB] rounded-md px-1.5 py-0.5 border border-slate-200"
            {...props}
          >
            {children}
          </code>
        );
      }
      return <CodeBlock className={className}>{children}</CodeBlock>;
    },

    pre: ({ children }) => <>{children}</>,

    // Blockquote — parse callouts and pullquotes
    blockquote: ({ children }) => {
      const rawText = extractTextFromChildren(children);
      const callout = extractCallout(rawText);

      if (callout) {
        const cfg = CALLOUT_CONFIGS[callout.type];
        return (
          <aside
            aria-label={cfg.label}
            className="my-6 rounded-2xl p-5 border shadow-2xs transition-all"
            style={{ background: cfg.bg, borderColor: cfg.border }}
          >
            <div className="flex gap-3.5 items-start">
              <span style={{ color: cfg.labelColor }} className="shrink-0 mt-0.5">
                {cfg.icon}
              </span>
              <div className="flex-1 min-w-0">
                <span
                  className="text-xs font-bold uppercase tracking-wider block mb-1.5"
                  style={{ color: cfg.labelColor }}
                >
                  {cfg.label}
                </span>
                <div
                  className="text-[15px] sm:text-[16px] leading-relaxed [&>p]:my-1.5"
                  style={{ color: cfg.text }}
                >
                  {callout.body}
                </div>
              </div>
            </div>
          </aside>
        );
      }

      // Default pull-quote
      return (
        <blockquote className="border-l-4 border-[#0047AB] pl-5 my-6 italic text-[#4B5563] text-lg leading-relaxed bg-[#F8FAFC] py-3 rounded-r-xl">
          {children}
        </blockquote>
      );
    },

    // Horizontal rule
    hr: () => <hr className="my-10 border-t border-[#E2E6EC]" />,

    // Links — safe external
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith('http') || href?.startsWith('//');
      return (
        <a
          href={href}
          className="text-[#0047AB] font-medium underline decoration-[#0047AB]/30 underline-offset-4 hover:decoration-[#0047AB] transition-colors"
          {...(isExternal
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
          {...props}
        >
          {children}
        </a>
      );
    },

    // Strong / Em
    strong: ({ children }) => (
      <strong className="font-semibold text-[#0B0B0F]">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,

    // Tables — responsive container query with stacked card fallback
    table: ({ children }) => <ResponsiveMarkdownTable>{children}</ResponsiveMarkdownTable>,
    thead: ({ children }) => (
      <thead className="bg-[#F8FAFC] border-b border-[#E2E6EC]">{children}</thead>
    ),
    tbody: ({ children }) => <tbody className="divide-y divide-[#F1F5F9]">{children}</tbody>,
    tr: ({ children }) => (
      <tr className="even:bg-[#FAFBFD] hover:bg-[#F0F7FF]/50 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }) => {
      const text = extractTextFromChildren(children);
      let dynamicText = text;
      if (text.includes('Client Fee')) {
        dynamicText = `Client Fee (${CLIENT_FEE_PERCENT}%)`;
      } else if (text.includes('Freelancer Fee')) {
        dynamicText = `Freelancer Fee (${FREELANCER_FEE_PERCENT}%)`;
      } else if (text.includes('PolyLance Fee')) {
        dynamicText = `Total PolyLance Fee (${TOTAL_PLATFORM_FEE_PERCENT}%)`;
      }

      return (
        <th className="px-3 sm:px-4 py-3.5 text-left font-bold text-[#0B0B0F] text-[11px] sm:text-xs uppercase tracking-wider whitespace-normal leading-snug bg-[#F8FAFC] border-b border-[#E2E6EC]">
          {dynamicText !== text ? dynamicText : children}
        </th>
      );
    },
    td: ({ children }) => {
      const text = extractTextFromChildren(children);
      const isAmount = /^\+?−?-?\s*[\d,]+(\.\d+)?\s*(POL|USDC|USDT|ETH)$/i.test(text.trim());

      return (
        <td
          className={`px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#374151] align-middle border-b border-slate-100 ${
            isAmount ? 'whitespace-nowrap tabular-nums font-medium text-[#0B0B0F]' : ''
          }`}
        >
          {children}
        </td>
      );
    },

    // Images with captions
    img: ({ src, alt, ...props }) => (
      <figure className="my-8">
        <img
          src={src}
          alt={alt ?? ''}
          className="w-full rounded-2xl border border-[#E2E6EC] object-cover shadow-xs"
          loading="lazy"
          {...props}
        />
        {alt && (
          <figcaption className="text-center text-xs text-[#6B7280] mt-2.5 font-medium">
            {alt}
          </figcaption>
        )}
      </figure>
    ),
  };
}


// ─────────────────────────────────────────────
// Key Takeaways Top Box Component
// ─────────────────────────────────────────────
export const KeyTakeawaysBox: React.FC<{ takeaways: string[] }> = ({ takeaways }) => {
  if (!takeaways || takeaways.length === 0) return null;
  return (
    <aside
      aria-label="Key takeaways"
      className="mb-8 p-5 sm:p-6 bg-[#F0F7FF] rounded-3xl border border-[#BFDBFE] shadow-2xs"
    >
      <div className="flex items-center gap-2 text-[#0047AB] font-bold text-sm uppercase tracking-wide mb-3">
        <CheckCircle2 size={18} />
        <span>Key Takeaways</span>
      </div>
      <ul className="space-y-2 text-sm sm:text-[15px] text-[#1E3A8A] leading-relaxed">
        {takeaways.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0047AB] shrink-0 mt-2" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
};

// ─────────────────────────────────────────────
// Main MarkdownRenderer Export
// ─────────────────────────────────────────────
interface MarkdownRendererProps {
  content: string;
  keyTakeaways?: string[];
  compact?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  keyTakeaways,
  compact,
}) => {
  const components = useMemo(() => buildComponents(), []);
  const resolvedContent = useMemo(() => resolveBlogTokens(content), [content]);

  return (
    <div className={`blog-prose max-w-none ${compact ? '[&>*:first-child]:mt-0' : ''}`}>
      {keyTakeaways && keyTakeaways.length > 0 && (
        <KeyTakeawaysBox takeaways={keyTakeaways} />
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={components}
      >
        {resolvedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
