'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
interface Column<T> { key: keyof T | string; header: string; render?: (row: T) => React.ReactNode; sortable?: boolean; }
interface DataTableProps<T> { columns: Column<T>[]; data: T[]; keyField: keyof T; loading?: boolean; emptyMessage?: string; }
export function DataTable<T extends Record<string, any>>({ columns, data, keyField, loading, emptyMessage = 'No data' }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  };
  const sorted = sortKey
    ? [...data].sort((a, b) => { const v = a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0; return sortAsc ? v : -v; })
    : data;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/30 bg-slate-900/40 p-1 shadow-inner-glow">
      <table className="w-full text-sm">
        <thead className="bg-slate-900/80">
          <tr>
            {columns.map(col => (
              <th key={String(col.key)}
                onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                className={`text-left px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}>
                {col.header}{col.sortable && <span className="ml-1">{sortKey === String(col.key) ? (sortAsc ? '↑' : '↓') : '⇅'}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/20">
          {loading && [...Array(5)].map((_, i) => (
            <tr key={i}>{columns.map(c => <td key={String(c.key)} className="px-4 py-3"><div className="h-4 bg-slate-800 animate-pulse rounded" /></td>)}</tr>
          ))}
          {!loading && sorted.length === 0 && (
            <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-600">{emptyMessage}</td></tr>
          )}
          {!loading && sorted.map((row, i) => (
            <motion.tr key={String(row[keyField])} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="hover:bg-slate-800/20 transition-colors">
              {columns.map(col => (
                <td key={String(col.key)} className="px-4 py-3">
                  {col.render ? col.render(row) : <span className="text-slate-300">{row[String(col.key)]}</span>}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
