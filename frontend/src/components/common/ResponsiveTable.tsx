import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TokenAmount } from './TokenAmount';

export interface ResponsiveTableColumn<T = any> {
  key: string;
  header: string | React.ReactNode;
  headerLabel?: string; // plain text for mobile card label
  priority?: 'high' | 'medium' | 'low'; // high priority columns remain visible; low priority collapses on tablet
  align?: 'left' | 'center' | 'right';
  className?: string;
  highlight?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface ResponsiveTableProps<T = any> {
  columns: ResponsiveTableColumn<T>[];
  data: T[];
  keyField?: string;
  caption?: string;
  ariaLabel?: string;
  className?: string;
  breakout?: boolean; // Break out wider on desktop inside narrow article text column
  emptyMessage?: string;
}

export const ResponsiveTable = <T extends Record<string, any>>({
  columns,
  data,
  keyField = 'id',
  caption,
  ariaLabel,
  className = '',
  breakout = false,
  emptyMessage = 'No records found',
}: ResponsiveTableProps<T>) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [expandedRows, setExpandedRows] = useState<Record<string | number, boolean>>({});

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const isNarrow = containerWidth < 560; // Narrow container switch point (<560px)
  const isMedium = containerWidth >= 560 && containerWidth < 768;

  // Toggle row expander for detailed low-priority columns
  const toggleRow = (key: string | number) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // On medium containers, filter columns by priority if there are many (>4) columns
  const hasExpandableColumns = !isNarrow && isMedium && columns.length > 4 && columns.some((c) => c.priority === 'low');
  const visibleColumns = hasExpandableColumns
    ? columns.filter((c) => c.priority !== 'low')
    : columns;
  const hiddenColumns = hasExpandableColumns
    ? columns.filter((c) => c.priority === 'low')
    : [];

  const breakoutClasses = breakout
    ? 'lg:-mx-8 xl:-mx-16 lg:w-[calc(100%+4rem)] xl:w-[calc(100%+8rem)]'
    : 'w-full';

  return (
    <div
      ref={containerRef}
      className={`@container relative my-6 ${breakoutClasses} ${className}`}
      role="region"
      aria-label={ariaLabel || caption || 'Data Table'}
    >
      {/* ── NARROW CONTAINER (< 560px): Stacked Card View (Zero Horizontal Scroll) ── */}
      {isNarrow ? (
        <div className="space-y-3.5" role="table" aria-label={ariaLabel || caption}>
          {caption && (
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 pb-1">
              {caption}
            </div>
          )}
          {data.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-white rounded-2xl border border-[#E2E6EC]">
              {emptyMessage}
            </div>
          ) : (
            data.map((row, rowIdx) => {
              const rowKey = row[keyField] ?? rowIdx;
              return (
                <div
                  key={rowKey}
                  role="row"
                  className="bg-white rounded-2xl border border-[#E2E6EC] p-4 space-y-2.5 shadow-2xs hover:border-[#CBD5E1] transition-all"
                >
                  {columns.map((col) => {
                    const val = row[col.key];
                    const label = col.headerLabel || (typeof col.header === 'string' ? col.header : col.key);
                    const rendered = col.render ? col.render(val, row, rowIdx) : val;

                    return (
                      <div
                        key={col.key}
                        role="cell"
                        className={`flex items-baseline justify-between gap-3 text-xs py-1.5 border-b border-slate-100 last:border-b-0 ${
                          col.highlight ? 'bg-[#EFF6FF]/70 -mx-2 px-2 rounded-lg font-bold text-[#0047AB]' : ''
                        }`}
                      >
                        <span className="font-semibold text-slate-500 shrink-0 text-[11px] uppercase tracking-wide">
                          {label}:
                        </span>
                        <div className="font-medium text-[#0B0B0F] text-right break-words min-w-0">
                          {typeof rendered === 'number' || typeof rendered === 'string' ? (
                            <span className="tabular-nums">{rendered}</span>
                          ) : (
                            rendered
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ── DESKTOP & TABLET (>= 560px): Compact, Fitting Table (Zero Horizontal Scroll) ── */
        <div className="w-full rounded-2xl border border-[#E2E6EC] bg-white overflow-hidden shadow-2xs">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E6EC]">
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`py-3.5 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider text-slate-700 leading-snug whitespace-normal ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    } ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
                {hasExpandableColumns && (
                  <th scope="col" className="py-3.5 px-3 text-center text-xs font-bold text-slate-400 w-12">
                    <span className="sr-only">Details</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + (hasExpandableColumns ? 1 : 0)}
                    className="p-6 text-center text-xs text-slate-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, rowIdx) => {
                  const rowKey = row[keyField] ?? rowIdx;
                  const isExpanded = Boolean(expandedRows[rowKey]);

                  return (
                    <React.Fragment key={rowKey}>
                      <tr className="even:bg-[#FAFBFD] hover:bg-[#F0F7FF]/50 transition-colors">
                        {visibleColumns.map((col) => {
                          const val = row[col.key];
                          const rendered = col.render ? col.render(val, row, rowIdx) : val;

                          return (
                            <td
                              key={col.key}
                              className={`py-3 px-3 sm:px-4 text-xs sm:text-sm align-middle ${
                                col.highlight
                                  ? 'font-bold text-[#0047AB] bg-[#EFF6FF]/40'
                                  : 'text-[#374151]'
                              } ${
                                col.align === 'right'
                                  ? 'text-right'
                                  : col.align === 'center'
                                  ? 'text-center'
                                  : 'text-left'
                              } ${col.className || ''}`}
                            >
                              {typeof rendered === 'number' || typeof rendered === 'string' ? (
                                <span className="tabular-nums font-medium">{rendered}</span>
                              ) : (
                                rendered
                              )}
                            </td>
                          );
                        })}
                        {hasExpandableColumns && (
                          <td className="py-3 px-3 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => toggleRow(rowKey)}
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? 'Hide details' : 'Show details'}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </td>
                        )}
                      </tr>

                      {/* Expandable row for hidden low-priority columns */}
                      {hasExpandableColumns && isExpanded && (
                        <tr className="bg-[#F8FAFC]/80 border-b border-slate-100">
                          <td colSpan={visibleColumns.length + 1} className="p-3 sm:p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                              {hiddenColumns.map((hCol) => {
                                const hVal = row[hCol.key];
                                const hRendered = hCol.render ? hCol.render(hVal, row, rowIdx) : hVal;
                                const hLabel = hCol.headerLabel || (typeof hCol.header === 'string' ? hCol.header : hCol.key);

                                return (
                                  <div key={hCol.key} className="space-y-0.5">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                      {hLabel}
                                    </span>
                                    <span className="font-semibold text-slate-800">
                                      {hRendered}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResponsiveTable;
