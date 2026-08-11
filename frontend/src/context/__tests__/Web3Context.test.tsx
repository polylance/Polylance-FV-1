import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Web3Provider, useWeb3 } from '../Web3Context';

describe('Web3Context — real on-chain permission checks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does NOT assign arbitrator/admin permissions based on a demo table', async () => {
    const { result } = renderHook(() => useWeb3(), {
      wrapper: ({ children }) => <Web3Provider>{children}</Web3Provider>,
    });

    expect(result.current.address).toBeFalsy();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isArbitrator).toBe(false);
    expect(result.current.isTreasuryAdmin).toBe(false);
    expect(result.current.reputationCount).toBe(0);
  });

  it('resets all permissions when disconnectWallet is called', async () => {
    const { result } = renderHook(() => useWeb3(), {
      wrapper: ({ children }) => <Web3Provider>{children}</Web3Provider>,
    });

    act(() => {
      result.current.disconnectWallet();
    });

    expect(result.current.address).toBeFalsy();
    expect(result.current.isArbitrator).toBe(false);
    expect(result.current.isTreasuryAdmin).toBe(false);
    expect(result.current.reputationCount).toBe(0);
  });

  it('fails closed (false/0) if the on-chain read throws', async () => {
    const { result } = renderHook(() => useWeb3(), {
      wrapper: ({ children }) => <Web3Provider>{children}</Web3Provider>,
    });

    await act(async () => {
      await result.current.refreshOnChainState();
    });

    expect(result.current.isArbitrator).toBe(false);
    expect(result.current.isTreasuryAdmin).toBe(false);
    expect(result.current.reputationCount).toBe(0);
  });
});
