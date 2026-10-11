import React from 'react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  width?: string; // e.g. "240px", "120px"
  align?: 'left' | 'center' | 'right';
  render: (item: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found',
  className = '',
}: TableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto border border-[#E5E7EB] rounded-[12px] bg-white ${className}`}>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#E5E7EB] bg-[#F6F7F9]">
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                className={`py-3 px-4 text-xs font-semibold text-[#4B5563] uppercase tracking-wider ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB]">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 px-4 text-center text-sm text-[#4B5563]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={keyExtractor(item, idx)}
                className="hover:bg-[#F6F7F9]/60 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                    className={`py-3.5 px-4 text-[#0B0B0F] ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {col.render(item, idx)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
