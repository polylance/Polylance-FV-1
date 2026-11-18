import React from 'react';
import { ResponsiveTable, ResponsiveTableColumn, ResponsiveTableProps } from './ResponsiveTable';

export type Column<T extends Record<string, any> = Record<string, any>> = ResponsiveTableColumn<T>;
export type TableProps<T extends Record<string, any> = Record<string, any>> = ResponsiveTableProps<T>;

export function Table<T extends Record<string, any> = Record<string, any>>(props: ResponsiveTableProps<T>) {
  return <ResponsiveTable<T> {...props} />;
}

export default Table;
