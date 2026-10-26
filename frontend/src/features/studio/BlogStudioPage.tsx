/**
 * PolyLance Blog Studio — Main Root Route (/studio/blog)
 *
 * Security:
 * If caller is unauthenticated or not an authorized Blog Team member,
 * renders the identical NotFound (404) page so the route's existence is never disclosed.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBlogStudioAuth } from './hooks/useBlogStudioAuth';
import {
  fetchStudioPosts, fetchStudioPost, createStudioDraft, updateStudioPost,
  publishStudioPost, unpublishStudioPost, archiveStudioPost, deleteStudioPost,
  fetchTeamMembers, addTeamMember, removeTeamMember,
  fetchMediaLibrary, uploadMediaAsset, fetchAuditLogs, restoreRevision
} from './api';
import { StudioPost, StudioTeamMember, StudioMedia, StudioAuditLog, StudioRevision } from './types';
import { BlogStudioDashboard } from './components/BlogStudioDashboard';
import { BlogStudioEditor } from './components/BlogStudioEditor';
import { BlogStudioTeamPanel } from './components/BlogStudioTeamPanel';
import { BlogStudioMediaModal } from './components/BlogStudioMediaModal';
import { BlogStudioAuditLog } from './components/BlogStudioAuditLog';
import NotFound from '../../pages/NotFound';
import { io as socketIO } from 'socket.io-client';
import { getBackendSyncUrl } from '../../utils/backendUrl';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useModalScrollLock } from './hooks/useModalScrollLock';

export const BlogStudioPage: React.FC = () => {
  const { loading: authLoading, authorized, role, address, refetch } = useBlogStudioAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();

  // Data states
  const [posts, setPosts] = useState<StudioPost[]>([]);
  const [team, setTeam] = useState<StudioTeamMember[]>([]);
  const [mediaList, setMediaList] = useState<StudioMedia[]>([]);
  const [auditLogs, setAuditLogs] = useState<StudioAuditLog[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Editor states
  const [activePost, setActivePost] = useState<StudioPost | null>(null);
  const [activeRevisions, setActiveRevisions] = useState<StudioRevision[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'team' | 'audit'>('posts');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  useModalScrollLock(isMediaModalOpen);

  // Load initial data
  const loadPosts = useCallback(async () => {
    try {
      setFetchError(null);
      const list = await fetchStudioPosts();
      setPosts(list);
    } catch (err: any) {
      console.error('[STUDIO] Error loading posts:', err);
      if (err?.message?.includes('401')) {
        refetch();
      } else {
        setFetchError(err?.message || 'Failed to load posts from server');
      }
    }
  }, [refetch]);

  const loadTeam = useCallback(async () => {
    if (role !== 'admin') return;
    try {
      const members = await fetchTeamMembers();
      setTeam(members);
    } catch (err) {
      console.error('[STUDIO] Error loading team:', err);
    }
  }, [role]);

  const loadMedia = useCallback(async () => {
    try {
      const items = await fetchMediaLibrary();
      setMediaList(items);
    } catch (err) {
      console.error('[STUDIO] Error loading media:', err);
    }
  }, []);

  const loadAudit = useCallback(async () => {
    if (role !== 'admin') return;
    try {
      const logs = await fetchAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('[STUDIO] Error loading audit logs:', err);
    }
  }, [role]);

  useEffect(() => {
    if (!authorized) return;
    setDataLoading(true);
    Promise.all([loadPosts(), loadTeam(), loadMedia(), loadAudit()]).finally(() => {
      setDataLoading(false);
    });
  }, [authorized, loadPosts, loadTeam, loadMedia, loadAudit]);

  // Sync subroute with active tab or active post
  useEffect(() => {
    if (!authorized) return;
    const path = location.pathname;
    if (path.endsWith('/team')) {
      setActiveTab('team');
      setActivePost(null);
    } else if (path.endsWith('/media')) {
      setActiveTab('media');
      setActivePost(null);
    } else if (path.endsWith('/audit')) {
      setActiveTab('audit');
      setActivePost(null);
    } else if (params.id && path.includes(`/${params.id}/edit`)) {
      if (!activePost || activePost.id !== params.id) {
        fetchStudioPost(params.id)
          .then(({ post, revisions }) => {
            setActivePost(post);
            setActiveRevisions(revisions);
          })
          .catch(() => {
            navigate('/studio/blog', { replace: true });
          });
      }
    } else if (path === '/studio/blog') {
      setActiveTab('posts');
      if (activePost && !params.id) {
        setActivePost(null);
      }
    }
  }, [authorized, location.pathname, params.id]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    if (!authorized) return;
    const socket = socketIO(getBackendSyncUrl(), { withCredentials: true });

    socket.on('blog:event', (evt: any) => {
      console.log('[STUDIO REALTIME EVENT]', evt);
      loadPosts();
      if (role === 'admin') loadAudit();
    });

    return () => {
      socket.disconnect();
    };
  }, [authorized, loadPosts, loadAudit, role]);

  // If verifying authentication, show clean minimal loader
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0047AB]/20 border-t-[#0047AB] animate-spin" />
      </div>
    );
  }

  // Security invariant: If unauthorized or signed out, render NotFound identical to unknown route
  if (!authorized || !role) {
    return <NotFound />;
  }

  // Post Actions
  const handleNewPost = async () => {
    try {
      const newDraft = await createStudioDraft({
        title: 'Untitled Article',
        contentMarkdown: '## Introduction\n\nWrite your article here...',
        excerpt: 'A brief overview of this guide...',
        category: 'Guides',
      });
      setPosts((prev) => [newDraft, ...prev]);
      setActivePost(newDraft);
      setActiveRevisions([]);
      navigate(`/studio/blog/${newDraft.id}/edit`);
    } catch (err) {
      console.error('[STUDIO] Error creating draft:', err);
    }
  };

  const handleEditPost = async (post: StudioPost) => {
    navigate(`/studio/blog/${post.id}/edit`);
    try {
      const { post: fullPost, revisions } = await fetchStudioPost(post.id);
      setActivePost(fullPost);
      setActiveRevisions(revisions);
    } catch {
      setActivePost(post);
      setActiveRevisions([]);
    }
  };

  const handleSavePost = async (updates: Partial<StudioPost>): Promise<StudioPost> => {
    if (!activePost) throw new Error('No active post');
    const updated = await updateStudioPost(activePost.id, updates);
    setActivePost(updated);
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    return updated;
  };

  const handlePublishPost = async (id: string) => {
    const published = await publishStudioPost(id);
    setPosts((prev) => prev.map((p) => (p.id === id ? published : p)));
    if (activePost?.id === id) setActivePost(published);
  };

  const handleUnpublishPost = async (id: string) => {
    const unpublished = await unpublishStudioPost(id);
    setPosts((prev) => prev.map((p) => (p.id === id ? unpublished : p)));
    if (activePost?.id === id) setActivePost(unpublished);
  };

  const handleArchivePost = async (id: string) => {
    const archived = await archiveStudioPost(id);
    setPosts((prev) => prev.map((p) => (p.id === id ? archived : p)));
    if (activePost?.id === id) setActivePost(archived);
  };

  const handleDeletePost = async (id: string) => {
    await deleteStudioPost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    if (activePost?.id === id) setActivePost(null);
  };

  const handleRestoreRevision = async (revId: string) => {
    if (!activePost) return;
    const restored = await restoreRevision(activePost.id, revId);
    setActivePost(restored);
    setPosts((prev) => prev.map((p) => (p.id === restored.id ? restored : p)));
  };

  const handleUploadMedia = async (data: { dataUrl: string; alt: string; mime: string; size: number }) => {
    const media = await uploadMediaAsset(data);
    setMediaList((prev) => [media, ...prev]);
    return media;
  };

  const handleAddTeamMember = async (wallet: string, memberRole: any) => {
    const member = await addTeamMember(wallet, memberRole);
    setTeam((prev) => [...prev.filter((m) => m.wallet !== member.wallet), member]);
  };

  const handleRemoveTeamMember = async (wallet: string) => {
    await removeTeamMember(wallet);
    setTeam((prev) => prev.filter((m) => m.wallet !== wallet.toLowerCase().trim()));
  };

  return (
    <div className={activePost ? "h-full flex-1 min-h-0 flex flex-col overflow-hidden bg-[#F8FAFC] text-[#0B0B0F]" : "min-h-screen bg-[#F8FAFC] text-[#0B0B0F]"}>
      {/* If an article is active in Editor mode */}
      {activePost ? (
        <BlogStudioEditor
          post={activePost}
          role={role}
          revisions={activeRevisions}
          onSave={handleSavePost}
          onPublish={handlePublishPost}
          onUnpublish={handleUnpublishPost}
          onRestoreRevision={handleRestoreRevision}
          onOpenMediaModal={() => setIsMediaModalOpen(true)}
          onBack={() => {
            setActivePost(null);
            navigate('/studio/blog');
            loadPosts();
          }}
        />
      ) : (
        /* Studio Dashboard */
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          {fetchError && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-800 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{fetchError}</span>
              </div>
              <button
                type="button"
                onClick={() => loadPosts()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-800 text-white font-medium hover:bg-amber-900 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          <BlogStudioDashboard
            posts={posts}
            role={role}
            currentWallet={address || ''}
            onEditPost={handleEditPost}
            onNewPost={handleNewPost}
            onPublishPost={handlePublishPost}
            onUnpublishPost={handleUnpublishPost}
            onArchivePost={handleArchivePost}
            onDeletePost={handleDeletePost}
            onOpenPreview={(p) => window.open(`/blog/${p.slug}`, '_blank')}
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (tab === 'posts') navigate('/studio/blog');
              else navigate(`/studio/blog/${tab}`);
            }}
            loading={dataLoading}
          />

          {activeTab === 'team' && role === 'admin' && (
            <BlogStudioTeamPanel
              team={team}
              onAddMember={handleAddTeamMember}
              onRemoveMember={handleRemoveTeamMember}
              loading={dataLoading}
            />
          )}

          {activeTab === 'audit' && role === 'admin' && (
            <BlogStudioAuditLog logs={auditLogs} loading={dataLoading} />
          )}

          {activeTab === 'media' && (
            <div className="bg-white rounded-3xl border border-[#E2E6EC] p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#0B0B0F]">Studio Media Assets</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Drag-and-drop uploaded screenshots, diagrams, and cover images.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMediaModalOpen(true)}
                  className="px-4 py-2 bg-[#0047AB] text-white text-xs font-bold rounded-xl hover:bg-[#00388A] transition-colors cursor-pointer"
                >
                  Upload New Image
                </button>
              </div>

              {mediaList.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No media assets uploaded yet.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  {mediaList.map((m) => (
                    <div key={m.id} className="border border-slate-200 rounded-2xl p-2 bg-white space-y-2">
                      <div className="h-32 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center">
                        <img src={m.url} alt={m.alt} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 line-clamp-1">{m.alt}</p>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {(m.size / 1024).toFixed(1)} KB • {m.mime.replace('image/', '')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Media Upload Modal */}
      <BlogStudioMediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        mediaList={mediaList}
        onUpload={handleUploadMedia}
        onSelectImage={(url, alt) => {
          if (activePost) {
            handleSavePost({ coverImage: url, coverAlt: alt });
          }
        }}
      />
    </div>
  );
};

export default BlogStudioPage;
