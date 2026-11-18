/**
 * PolyLance Blog Studio — Audit Log Viewer (Admin Only)
 */

import React from 'react';
import { ShieldAlert, Clock, User, Tag } from 'lucide-react';
import { StudioAuditLog } from '../types';

interface BlogStudioAuditLogProps {
  logs: StudioAuditLog[];
  loading?: boolean;
}

export const BlogStudioAuditLog: React.FC<BlogStudioAuditLogProps> = ({ logs, loading }) => {
  return (
    <div className="bg-white rounded-3xl border border-[#E2E6EC] p-6 shadow-2xs space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert size={18} className="text-[#0047AB]" />
        <h2 className="text-sm font-extrabold text-[#0B0B0F]">Blog System Audit Log</h2>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">
        Immutable cryptographic log tracking every administrative change, post revision, role assignment, and publishing action.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-[#E2E6EC]">
        <table className="w-full divide-y divide-[#E2E6EC] text-left text-xs">
          <thead className="bg-[#F8FAFC]">
            <tr>
              <th className="px-5 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider">Timestamp</th>
              <th className="px-4 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider">Actor Wallet</th>
              <th className="px-4 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider">Action Event</th>
              <th className="px-4 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider">Target</th>
              <th className="px-5 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">Loading audit records...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">No audit events recorded yet.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAFBFD] transition-colors">
                  <td className="px-5 py-3.5 text-slate-500 font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-[#0B0B0F] whitespace-nowrap">
                    {log.actorWallet ? `${log.actorWallet.slice(0, 6)}...${log.actorWallet.slice(-4)}` : 'System'}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-[#0047AB] whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 capitalize whitespace-nowrap">
                    {log.targetType} {log.targetId ? `(${log.targetId.slice(0, 8)})` : ''}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
