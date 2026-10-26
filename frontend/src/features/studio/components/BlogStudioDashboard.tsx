/**
 * PolyLance Blog Studio — Main Posts Dashboard
 */

import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Edit3, Eye, CheckCircle, XCircle, Archive, Trash2,
  FileText, Image as ImageIcon, Users, ShieldAlert, Clock, Sparkles
} from 'lucide-react';
import { StudioPost, BlogRole, PostStatus } from '../types';
import { Button } from '../../../components/common/Button';

interface BlogStudioDashboardProps {
  posts: StudioPost[];
  role: BlogRole;
  currentWallet: string;
  onEditPost: (post: StudioPost) => void;
  onNewPost: () => void;
  onPublishPost: (id: string) => Promise<void>;
  onUnpublishPost: (id: string) => Promise<void>;
  onArchivePost: (id: string) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
  onOpenPreview: (post: StudioPost) => void;
  activeTab: 'posts' | 'media' | 'team' | 'audit';
  onTabChange: (tab: 'posts' | 'media' | 'team' | 'audit') => void;
  loading?: boolean;
}

const STATUS_FILTERS: Array<{ id: 'all' | PostStatus; label: string }> = [
  { id: 'all', label: 'All Posts' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
  { id: 'in_review', label: 'In Review' },
  { id: 'archived', label: 'Archived' },
];

export const BlogStudioDashboard: React.FC<BlogStudioDashboardProps> = ({
  posts,
  role,
  currentWallet,
  onEditPost,
  onNewPost,
  onPublishPost,
  onUnpublishPost,
  onArchivePost,
  onDeletePost,
  onOpenPreview,
  activeTab,
  onTabChange,
  loading,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PostStatus>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [posts, search, statusFilter]);

  const canPublish = role === 'admin' || role === 'blog_editor';

  const handleAction = async (action: () => Promise<void>, postId: string) => {
    setActionLoadingId(postId);
    try {
      await action();
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: PostStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Published
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            In Review
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Draft
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="bg-white rounded-3xl border border-[#E2E6EC] p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#0047AB]">
                <Sparkles size={12} />
                Internal Studio
              </span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Role: <strong className="text-slate-700 capitalize">{role.replace('_', ' ')}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B0B0F] tracking-tight">
              Blog Content Studio
            </h1>
            <p className="text-sm text-[#4B5563] mt-1">
              Author, edit, review, and manage on-chain educational guides and technical tutorials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={onNewPost}
              icon={<Plus size={16} />}
              className="bg-[#0047AB] hover:bg-[#00388A]"
            >
              New Article
            </Button>
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => onTabChange('posts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'posts'
                ? 'bg-[#0047AB] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            <span>Articles ({posts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('media')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'media'
                ? 'bg-[#0047AB] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ImageIcon size={14} />
            <span>Media Library</span>
          </button>

          {role === 'admin' && (
            <>
              <button
                type="button"
                onClick={() => onTabChange('team')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'team'
                    ? 'bg-[#0047AB] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Users size={14} />
                <span>Team Management</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('audit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-[#0047AB] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <ShieldAlert size={14} />
                <span>Audit Log</span>
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'posts' && (
        <div className="bg-white rounded-3xl border border-[#E2E6EC] p-6 shadow-2xs space-y-6">
          {/* Search & Status Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-[#0B0B0F] text-white shadow-xs'
                      : 'bg-[#F6F7F9] text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="w-full md:w-72 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-9 pr-3.5 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
              />
            </div>
          </div>

          {/* Posts Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#E2E6EC]">
            <table className="w-full divide-y divide-[#E2E6EC] text-left text-xs">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="px-5 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider">Article Title</th>
                  <th className="px-4 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider">Author</th>
                  <th className="px-4 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider">Updated</th>
                  <th className="px-5 py-3.5 font-bold text-[#0B0B0F] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-[#0047AB]/20 border-t-[#0047AB] animate-spin" />
                        <span>Loading studio posts...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <p className="font-semibold text-slate-600">No articles match your query.</p>
                      <p className="text-[11px] mt-1">Create a new draft or clear your filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-[#FAFBFD] transition-colors">
                      <td className="px-5 py-4 max-w-sm">
                        <button
                          type="button"
                          onClick={() => onEditPost(post)}
                          className="font-bold text-sm text-[#0B0B0F] hover:text-[#0047AB] transition-colors text-left line-clamp-1 block cursor-pointer"
                        >
                          {post.title}
                        </button>
                        <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                          /blog/{post.slug}
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(post.status)}
                      </td>

                      <td className="px-4 py-4 text-slate-600 font-medium whitespace-nowrap">
                        {post.authorName}
                      </td>

                      <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock size={11} className="text-slate-400" />
                          <span>
                            {new Date(post.updatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onEditPost(post)}
                          title="Edit article"
                          className="p-1.5 text-slate-500 hover:text-[#0047AB] hover:bg-[#EFF6FF] rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenPreview(post)}
                          title="Preview article"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>

                        {canPublish && post.status !== 'published' && (
                          <button
                            type="button"
                            disabled={actionLoadingId === post.id}
                            onClick={() => handleAction(() => onPublishPost(post.id), post.id)}
                            title="Publish article"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}

                        {canPublish && post.status === 'published' && (
                          <button
                            type="button"
                            disabled={actionLoadingId === post.id}
                            onClick={() => handleAction(() => onUnpublishPost(post.id), post.id)}
                            title="Unpublish article"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <XCircle size={15} />
                          </button>
                        )}

                        {canPublish && post.status !== 'archived' && (
                          <button
                            type="button"
                            disabled={actionLoadingId === post.id}
                            onClick={() => handleAction(() => onArchivePost(post.id), post.id)}
                            title="Archive article"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Archive size={15} />
                          </button>
                        )}

                        {canPublish && (
                          <button
                            type="button"
                            disabled={actionLoadingId === post.id}
                            onClick={() => handleAction(() => onDeletePost(post.id), post.id)}
                            title="Delete article"
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
