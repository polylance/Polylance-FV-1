/**
 * Test Suite: BlogStudioGuard 3-State Security & Invariants
 *
 * Verifies:
 * 1. Loading state renders skeleton and NEVER flashes 404 (NotFound).
 * 2. Unauthenticated state (401 or signed out) renders neutral sign-in prompt
 *    and NEVER discloses the words "Blog Studio" or internal tool hints.
 * 3. Signed-in non-team member (403 or !role or !active) renders standard NotFound (404).
 * 4. Allowed team member (admin, blog_editor, blog_author) renders protected Studio content.
 * 5. Server 5xx error renders retry connection button.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { BlogStudioGuard } from '../components/BlogStudioGuard';
import { useBlogRole } from '../hooks/useBlogRole';
import { useAuth } from '../../../context/AuthContext';
import { useWeb3 } from '../../../context/Web3Context';

vi.mock('../hooks/useBlogRole');
vi.mock('../../../context/AuthContext');
vi.mock('../../../context/Web3Context');

const mockUseBlogRole = vi.mocked(useBlogRole);
const mockUseAuth = vi.mocked(useAuth);
const mockUseWeb3 = vi.mocked(useWeb3);

describe('BlogStudioGuard Three-State Matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Loading State: renders loading skeleton and NEVER flashes NotFound text', () => {
    mockUseBlogRole.mockReturnValue({
      loading: true,
      role: null,
      active: false,
      wallet: null,
      status: null,
      error: null,
      hasAccess: false,
      refetch: vi.fn(),
    });
    mockUseAuth.mockReturnValue({
      isAuthLoading: false,
      isAuthenticated: false,
      authState: 'disconnected',
      session: {} as any,
      isSigning: false,
      isAdmin: false,
      isJudge: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      checkSession: vi.fn(),
      promptSignIn: vi.fn(),
    });
    mockUseWeb3.mockReturnValue({
      isConnected: false,
      address: '',
      connectWallet: vi.fn(),
    } as any);

    render(
      <MemoryRouter>
        <BlogStudioGuard>
          <div>Protected Studio Content</div>
        </BlogStudioGuard>
      </MemoryRouter>
    );

    // Verify skeleton exists
    expect(screen.getByTestId('studio-loading-skeleton')).toBeTruthy();

    // Invariant: 404 text must NOT appear while loading
    expect(screen.queryByText(/Page Does Not Exist/i)).toBeNull();
    expect(screen.queryByText(/404/i)).toBeNull();
    expect(screen.queryByText('Protected Studio Content')).toBeNull();
  });

  it('2. Unauthenticated State: renders neutral sign-in prompt without disclosing Blog Studio', () => {
    mockUseBlogRole.mockReturnValue({
      loading: false,
      role: null,
      active: false,
      wallet: null,
      status: 401,
      error: null,
      hasAccess: false,
      refetch: vi.fn(),
    });
    mockUseAuth.mockReturnValue({
      isAuthLoading: false,
      isAuthenticated: false,
      authState: 'connected-unsigned',
      session: {} as any,
      isSigning: false,
      isAdmin: false,
      isJudge: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      checkSession: vi.fn(),
      promptSignIn: vi.fn(),
    });
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      address: '0xb30f2efbcebc529d946e05c9cce0f1fffb7e1ab1',
      connectWallet: vi.fn(),
    } as any);

    const { container } = render(
      <MemoryRouter>
        <BlogStudioGuard>
          <div>Protected Studio Content</div>
        </BlogStudioGuard>
      </MemoryRouter>
    );

    expect(screen.getByTestId('studio-auth-required')).toBeTruthy();
    expect(screen.getByText(/Sign in with your wallet to continue/i)).toBeTruthy();
    expect(screen.getByText(/Sign In with Wallet/i)).toBeTruthy();

    // Critical security invariant: Must NOT mention Blog Studio or reveal area exists
    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/Blog Studio/i);
    expect(textContent).not.toMatch(/Blog/i);
    expect(textContent).not.toMatch(/Drafts/i);
    expect(textContent).not.toMatch(/Author/i);
  });

  it('3. Denied State: signed-in non-team member gets standard 404 NotFound page', () => {
    mockUseBlogRole.mockReturnValue({
      loading: false,
      role: null,
      active: false,
      wallet: null,
      status: 403,
      error: null,
      hasAccess: false,
      refetch: vi.fn(),
    });
    mockUseAuth.mockReturnValue({
      isAuthLoading: false,
      isAuthenticated: true,
      authState: 'authenticated',
      session: {} as any,
      isSigning: false,
      isAdmin: false,
      isJudge: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      checkSession: vi.fn(),
      promptSignIn: vi.fn(),
    });
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      address: '0x9999999999999999999999999999999999999999',
      connectWallet: vi.fn(),
    } as any);

    render(
      <MemoryRouter>
        <BlogStudioGuard>
          <div>Protected Studio Content</div>
        </BlogStudioGuard>
      </MemoryRouter>
    );

    // Shows standard generic 404 page
    expect(screen.getByText(/Page Does Not Exist/i)).toBeTruthy();
    expect(screen.queryByText('Protected Studio Content')).toBeNull();
  });

  it('4. Allowed State: active admin/editor/author renders protected Studio content', () => {
    mockUseBlogRole.mockReturnValue({
      loading: false,
      role: 'admin',
      active: true,
      wallet: '0xb30f2efbcebc529d946e05c9cce0f1fffb7e1ab1',
      status: 200,
      error: null,
      hasAccess: true,
      refetch: vi.fn(),
    });
    mockUseAuth.mockReturnValue({
      isAuthLoading: false,
      isAuthenticated: true,
      authState: 'authenticated',
      session: {} as any,
      isSigning: false,
      isAdmin: true,
      isJudge: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      checkSession: vi.fn(),
      promptSignIn: vi.fn(),
    });
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      address: '0xb30f2efbcebc529d946e05c9cce0f1fffb7e1ab1',
      connectWallet: vi.fn(),
    } as any);

    render(
      <MemoryRouter>
        <BlogStudioGuard>
          <div>Protected Studio Content</div>
        </BlogStudioGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Studio Content')).toBeTruthy();
    expect(screen.queryByText(/Page Does Not Exist/i)).toBeNull();
  });

  it('5. Server Error State: 500 error renders connection retry screen', () => {
    const mockRefetch = vi.fn();
    mockUseBlogRole.mockReturnValue({
      loading: false,
      role: null,
      active: false,
      wallet: null,
      status: 500,
      error: new Error('Backend offline'),
      hasAccess: false,
      refetch: mockRefetch,
    });
    mockUseAuth.mockReturnValue({
      isAuthLoading: false,
      isAuthenticated: true,
      authState: 'authenticated',
      session: {} as any,
      isSigning: false,
      isAdmin: false,
      isJudge: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      checkSession: vi.fn(),
      promptSignIn: vi.fn(),
    });
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      address: '0xb30f2efbcebc529d946e05c9cce0f1fffb7e1ab1',
      connectWallet: vi.fn(),
    } as any);

    render(
      <MemoryRouter>
        <BlogStudioGuard>
          <div>Protected Studio Content</div>
        </BlogStudioGuard>
      </MemoryRouter>
    );

    expect(screen.getByTestId('studio-server-error')).toBeTruthy();
    expect(screen.getByText(/Connection Interrupted/i)).toBeTruthy();
    expect(screen.getByText(/Retry Connection/i)).toBeTruthy();
  });
});
