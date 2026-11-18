/**
 * PolyLance Blog Studio — Team Management Panel (Admin Only)
 */

import React, { useState } from 'react';
import { Users, Plus, Trash2, Shield, Edit3, UserCheck, AlertTriangle } from 'lucide-react';
import { StudioTeamMember, BlogRole } from '../types';
import { Button } from '../../../components/common/Button';

interface BlogStudioTeamPanelProps {
  team: StudioTeamMember[];
  onAddMember: (wallet: string, role: BlogRole) => Promise<void>;
  onRemoveMember: (wallet: string) => Promise<void>;
  loading?: boolean;
}

export const BlogStudioTeamPanel: React.FC<BlogStudioTeamPanelProps> = ({
  team,
  onAddMember,
  onRemoveMember,
  loading,
}) => {
  const [wallet, setWallet] = useState('');
  const [role, setRole] = useState<BlogRole>('blog_editor');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanWallet = wallet.trim().toLowerCase();

    if (!/^0x[a-f0-9]{40}$/.test(cleanWallet)) {
      setError('Please provide a valid 42-character Ethereum/Polygon wallet address (0x...)');
      return;
    }

    setSubmitting(true);
    try {
      await onAddMember(cleanWallet, role);
      setWallet('');
    } catch (err: any) {
      setError(err?.message || 'Failed to add team member');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (r: BlogRole) => {
    switch (r) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#0047AB] border border-[#BFDBFE]">
            <Shield size={12} />
            Admin
          </span>
        );
      case 'blog_editor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Edit3 size={12} />
            Editor
          </span>
        );
      case 'blog_author':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <UserCheck size={12} />
            Author
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Roles & Permissions Reference Card */}
      <div className="bg-white rounded-3xl border border-[#E2E6EC] p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[#0047AB]" />
          <h2 className="text-base font-extrabold text-[#0B0B0F]">Role Permissions Matrix</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#EFF6FF]/60 border border-[#BFDBFE] space-y-1.5">
            <span className="font-bold text-[#0047AB] block">Administrator</span>
            <p className="text-slate-600 leading-relaxed">
              Full system privileges. Manages team members, assigns roles, accesses audit logs, edits/publishes any post, and manages media.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
            <span className="font-bold text-emerald-800 block">Blog Editor</span>
            <p className="text-slate-600 leading-relaxed">
              Content lead. Creates, edits, reviews, publishes, unpublishes, and archives any article. Manages media assets.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-800 block">Blog Author</span>
            <p className="text-slate-600 leading-relaxed">
              Staff writer. Creates and edits their own drafts, and submits them for editorial review. Cannot publish directly.
            </p>
          </div>
        </div>
      </div>

      {/* Add New Team Member Form */}
      <div className="bg-white rounded-3xl border border-[#E2E6EC] p-6 shadow-2xs">
        <h3 className="text-sm font-extrabold text-[#0B0B0F] mb-4">Add Team Member</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="0x... (Wallet address on Polygon)"
                className="w-full px-3.5 py-2.5 font-mono text-xs border border-slate-300 rounded-xl text-[#0B0B0F] focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as BlogRole)}
                className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl text-[#0B0B0F] focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
              >
                <option value="blog_author">Blog Author</option>
                <option value="blog_editor">Blog Editor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              icon={<Plus size={16} />}
              className="bg-[#0047AB] hover:bg-[#00388A] shrink-0"
            >
              Add Member
            </Button>
          </div>
        </form>
      </div>

      {/* Team Member List */}
      <div className="bg-white rounded-3xl border border-[#E2E6EC] p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-extrabold text-[#0B0B0F]">Active Team Members ({team.length})</h3>

        <div className="overflow-x-auto rounded-2xl border border-[#E2E6EC]">
          <table className="w-full divide-y divide-[#E2E6EC] text-left text-xs">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="px-5 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider">Member Wallet</th>
                <th className="px-4 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider">Assigned Role</th>
                <th className="px-4 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider">Added By</th>
                <th className="px-4 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider">Date Added</th>
                <th className="px-5 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading team members...</td>
                </tr>
              ) : team.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No team members registered.</td>
                </tr>
              ) : (
                team.map((member) => (
                  <tr key={member.wallet} className="hover:bg-[#FAFBFD] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#0B0B0F]">
                      {member.wallet}
                    </td>
                    <td className="px-4 py-3.5">
                      {getRoleBadge(member.role)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-500">
                      {member.addedBy ? `${member.addedBy.slice(0, 6)}...${member.addedBy.slice(-4)}` : 'System'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono">
                      {new Date(member.addedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveMember(member.wallet)}
                        title="Remove member"
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
