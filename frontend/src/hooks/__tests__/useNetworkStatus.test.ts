import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '../useNetworkStatus';
import * as web3Context from '../../context/Web3Context';
import * as polyLanceDataContext from '../../context/PolyLanceDataContext';
import * as reactRouterDom from 'react-router-dom';
import { sharedPoller } from '../../utils/sharedPoller';

vi.mock('../../context/Web3Context');
vi.mock('../../context/PolyLanceDataContext');
vi.mock('react-router-dom');

describe('useNetworkStatus Hook - Visibility Matrix & Hysteresis Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Default Router location
    vi.spyOn(reactRouterDom, 'useLocation').mockReturnValue({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    // Default Web3: Unconnected
    vi.spyOn(web3Context, 'useWeb3').mockReturnValue({
      address: null,
      isConnected: false,
      isConnecting: false,
      network: 'polygon',
      balance: '0',
      isCorrectNetwork: true,
      error: null,
      walletType: null,
      isReadonly: true,
      provider: null,
      signer: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchNetwork: vi.fn(),
      openWalletModal: vi.fn(),
      closeWalletModal: vi.fn(),
    });

    // Default PolyLance Data: Empty jobs
    vi.spyOn(polyLanceDataContext, 'usePolyLanceData').mockReturnValue({
      jobs: [],
    } as any);

    // Default sharedPoller: healthy
    vi.spyOn(sharedPoller, 'fetchDeduplicated').mockResolvedValue({
      success: true,
      status: 'healthy',
      isHealthy: true,
      currentBlock: 50000000,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('RULE 1: Visitors (unconnected) never see the banner even when degraded or down', async () => {
    vi.spyOn(sharedPoller, 'fetchDeduplicated').mockResolvedValue({
      success: true,
      status: 'degraded',
      isHealthy: true,
    } as any);

    const { result } = renderHook(() => useNetworkStatus());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(65000);
    });

    expect(result.current.isUserAffected).toBe(false);
    expect(result.current.shouldShowBanner).toBe(false);
  });

  it('RULE 2: Connected user with NO pending txs, NO active jobs, and on landing page does not see banner', async () => {
    vi.spyOn(web3Context, 'useWeb3').mockReturnValue({
      address: '0x1111111111111111111111111111111111111111',
      isConnected: true,
    } as any);

    vi.spyOn(sharedPoller, 'fetchDeduplicated').mockResolvedValue({
      success: true,
      status: 'degraded',
      isHealthy: true,
    } as any);

    const { result } = renderHook(() => useNetworkStatus());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(65000);
    });

    expect(result.current.isUserAffected).toBe(false);
    expect(result.current.shouldShowBanner).toBe(false);
  });

  it('RULE 3: Connected user WITH active engagement sees banner when status is degraded (SLOW)', async () => {
    const userAddr = '0x1111111111111111111111111111111111111111';
    vi.spyOn(web3Context, 'useWeb3').mockReturnValue({
      address: userAddr,
      isConnected: true,
    } as any);

    vi.spyOn(polyLanceDataContext, 'usePolyLanceData').mockReturnValue({
      jobs: [
        {
          id: 'job-1',
          client: userAddr,
          freelancer: '0x2222222222222222222222222222222222222222',
          status: 'In Progress', // active engagement!
        },
      ],
    } as any);

    vi.spyOn(sharedPoller, 'fetchDeduplicated').mockResolvedValue({
      success: true,
      status: 'degraded',
      isHealthy: true,
    } as any);

    const { result } = renderHook(() => useNetworkStatus());

    // Flush initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Before 60s show delay: banner NOT shown
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });
    expect(result.current.severity).toBe('NORMAL');
    expect(result.current.shouldShowBanner).toBe(false);

    // After 60s show delay: banner shown
    await act(async () => {
      await vi.advanceTimersByTimeAsync(35000);
    });
    expect(result.current.severity).toBe('SLOW');
    expect(result.current.isUserAffected).toBe(true);
    expect(result.current.shouldShowBanner).toBe(true);
  });

  it('RULE 4: 30-minute dismissal memory in sessionStorage', async () => {
    const userAddr = '0x1111111111111111111111111111111111111111';
    vi.spyOn(web3Context, 'useWeb3').mockReturnValue({
      address: userAddr,
      isConnected: true,
    } as any);

    vi.spyOn(polyLanceDataContext, 'usePolyLanceData').mockReturnValue({
      jobs: [
        {
          id: 'job-1',
          client: userAddr,
          status: 'Funded',
        },
      ],
    } as any);

    vi.spyOn(sharedPoller, 'fetchDeduplicated').mockResolvedValue({
      success: true,
      status: 'degraded',
      isHealthy: true,
    } as any);

    const { result } = renderHook(() => useNetworkStatus());

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(65000);
    });
    expect(result.current.shouldShowBanner).toBe(true);

    // User dismisses banner
    act(() => {
      result.current.dismissBanner();
    });

    expect(result.current.shouldShowBanner).toBe(false);
    expect(result.current.isDismissed).toBe(true);

    // Advance 25 minutes (still within 30 min window)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    });
    expect(result.current.shouldShowBanner).toBe(false);

    // Advance past 30 minutes
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6 * 60 * 1000);
    });
    expect(result.current.shouldShowBanner).toBe(true);
  });

  it('RULE 5: Dismissal breaks if severity escalates to DISRUPTED', async () => {
    const userAddr = '0x1111111111111111111111111111111111111111';
    vi.spyOn(web3Context, 'useWeb3').mockReturnValue({
      address: userAddr,
      isConnected: true,
    } as any);

    vi.spyOn(polyLanceDataContext, 'usePolyLanceData').mockReturnValue({
      jobs: [{ id: 'job-1', client: userAddr, status: 'Funded' }],
    } as any);

    let pollerResponse = { success: true, status: 'degraded', isHealthy: true };
    vi.spyOn(sharedPoller, 'fetchDeduplicated').mockImplementation(async () => pollerResponse as any);

    const { result } = renderHook(() => useNetworkStatus());

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(65000);
    });
    expect(result.current.severity).toBe('SLOW');

    // Dismiss
    act(() => {
      result.current.dismissBanner();
    });
    expect(result.current.shouldShowBanner).toBe(false);

    // Now condition worsens to DISRUPTED
    pollerResponse = { success: false, status: 'down', isHealthy: false };

    // Advance timer for hook to re-poll and escalate
    await act(async () => {
      await vi.advanceTimersByTimeAsync(16000);
    });
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(65000);
    });

    expect(result.current.severity).toBe('DISRUPTED');
    expect(result.current.isDismissed).toBe(false);
    expect(result.current.shouldShowBanner).toBe(true);
  });

  it('RULE 6: DISRUPTED disables payment actions and affects users on payment screens', async () => {
    vi.spyOn(reactRouterDom, 'useLocation').mockReturnValue({
      pathname: '/workspace/job-123',
    } as any);

    vi.spyOn(sharedPoller, 'fetchDeduplicated').mockResolvedValue({
      success: false,
      status: 'down',
      isHealthy: false,
    } as any);

    const { result } = renderHook(() => useNetworkStatus());

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(65000);
    });

    expect(result.current.severity).toBe('DISRUPTED');
    expect(result.current.isPaymentDisabled).toBe(true);
    expect(result.current.isUserAffected).toBe(true);
    expect(result.current.shouldShowBanner).toBe(true);
  });
});
