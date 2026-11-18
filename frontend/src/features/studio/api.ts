/**
 * PolyLance Blog Studio — API Client
 */

import { getBackendSyncUrl } from '../../utils/backendUrl';
import { StudioPost, StudioTeamMember, StudioMedia, StudioAuditLog, StudioRevision, BlogRole } from './types';

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // If session/auth token exists in localStorage/sessionStorage
  try {
    const token =
      localStorage.getItem('polylance_auth_token') ||
      localStorage.getItem('polylance_session_token') ||
      sessionStorage.getItem('polylance_auth_token') ||
      sessionStorage.getItem('polylance_session_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    /* ignore storage errors */
  }

  return headers;
}

const baseUrl = () => getBackendSyncUrl();

export interface StudioMeResponse {
  role: BlogRole | null;
  active: boolean;
  address: string | null;
  status: number;
}

export class StudioAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'StudioAuthError';
    this.status = status;
  }
}

export async function fetchStudioMe(): Promise<StudioMeResponse> {
  const res = await fetch(`${baseUrl()}/api/studio/me`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (res.status === 401) {
    throw new StudioAuthError('Unauthorized: Please sign in', 401);
  }

  if (!res.ok) {
    throw new StudioAuthError(`Server error (${res.status})`, res.status);
  }

  const data = await res.json();
  return {
    role: data.role ?? null,
    active: Boolean(data.active),
    address: data.address ? String(data.address).toLowerCase() : null,
    status: res.status,
  };
}

export async function checkStudioAuth(): Promise<{
  authorized: boolean;
  role?: BlogRole;
  wallet?: string;
  active?: boolean;
  status: number;
}> {
  try {
    const data = await fetchStudioMe();
    return {
      authorized: Boolean(data.role && data.active),
      role: data.role || undefined,
      wallet: data.address || undefined,
      active: data.active,
      status: data.status,
    };
  } catch (err: any) {
    return {
      authorized: false,
      status: err?.status || 500,
    };
  }
}

export async function fetchStudioPosts(): Promise<StudioPost[]> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/posts`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to load posts (${res.status})`);
  const data = await res.json();
  return data.posts || [];
}

export async function fetchStudioPost(id: string): Promise<{ post: StudioPost; revisions: StudioRevision[] }> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/posts/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to load post (${res.status})`);
  const data = await res.json();
  return { post: data.post, revisions: data.revisions || [] };
}

export async function createStudioDraft(postData: Partial<StudioPost>): Promise<StudioPost> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/posts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(postData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create draft (${res.status})`);
  }
  const data = await res.json();
  return data.post;
}

export async function updateStudioPost(id: string, updates: Partial<StudioPost>): Promise<StudioPost> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/posts/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update post (${res.status})`);
  }
  const data = await res.json();
  return data.post;
}

export async function publishStudioPost(id: string): Promise<StudioPost> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/posts/${id}/publish`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to publish post (${res.status})`);
  }
  const data = await res.json();
  return data.post;
}

export async function unpublishStudioPost(id: string): Promise<StudioPost> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/posts/${id}/unpublish`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to unpublish post (${res.status})`);
  }
  const data = await res.json();
  return data.post;
}

export async function archiveStudioPost(id: string): Promise<StudioPost> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/posts/${id}/archive`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to archive post (${res.status})`);
  }
  const data = await res.json();
  return data.post;
}

export async function deleteStudioPost(id: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/posts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to delete post (${res.status})`);
  }
}

export async function generatePreviewToken(id: string): Promise<{ token: string; expiresAt: number }> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/posts/${id}/preview-token`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to generate preview token');
  return res.json();
}

export async function restoreRevision(postId: string, revisionId: string): Promise<StudioPost> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/posts/${postId}/revisions/${revisionId}/restore`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to restore revision');
  }
  const data = await res.json();
  return data.post;
}

export async function fetchTeamMembers(): Promise<StudioTeamMember[]> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/team`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load team members');
  const data = await res.json();
  return data.team || [];
}

export async function addTeamMember(wallet: string, role: BlogRole): Promise<StudioTeamMember> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/team`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ wallet, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add team member');
  }
  const data = await res.json();
  return data.member;
}

export async function removeTeamMember(wallet: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/team/${wallet}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to remove team member');
  }
}

export async function fetchMediaLibrary(): Promise<StudioMedia[]> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/media`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load media library');
  const data = await res.json();
  return data.media || [];
}

export async function uploadMediaAsset(data: { dataUrl: string; alt: string; mime: string; size: number }): Promise<StudioMedia> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/media`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload media');
  }
  const resp = await res.json();
  return resp.media;
}

export async function fetchAuditLogs(): Promise<StudioAuditLog[]> {
  const res = await fetch(`${baseUrl()}/api/studio/blog/audit`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load audit logs');
  const data = await res.json();
  return data.auditLogs || [];
}
