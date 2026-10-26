import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NetworkStatusBanner } from '../NetworkStatusBanner';
import * as networkHook from '../../../hooks/useNetworkStatus';

// Mock the hook for isolated component testing
vi.mock('../../../hooks/useNetworkStatus');

describe('NetworkStatusBanner Component', () => {
  const defaultHookState: ReturnType<typeof networkHook.useNetworkStatus> = {
    rawStatus: 'healthy',
    isHealthy: true,
    currentBlock: 50000000,
    severity: 'NORMAL',
    isUserAffected: false,
    shouldShowBanner: false,
    isPaymentDisabled: false,
    isDismissed: false,
    dismissBanner: vi.fn(),
    showRecoveryToast: false,
    clearRecoveryToast: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when severity is NORMAL', () => {
    vi.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      ...defaultHookState,
      severity: 'NORMAL',
      shouldShowBanner: false,
    });

    const { container } = render(<NetworkStatusBanner />);
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('renders SLOW notice with polite aria-live and exact approved copy when shouldShowBanner is true', () => {
    vi.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      ...defaultHookState,
      severity: 'SLOW',
      shouldShowBanner: true,
      isUserAffected: true,
    });

    render(<NetworkStatusBanner />);

    const banner = screen.getByRole('status');
    expect(banner).toBeDefined();
    expect(banner.getAttribute('aria-live')).toBe('polite');

    // Title and body copy checks
    expect(screen.getByText('Confirmations are a little slower right now')).toBeDefined();
    expect(screen.getByText("Your funds stay in the escrow smart contract. You don't need to do anything or pay again.")).toBeDefined();
    expect(screen.getByText('What does this mean?')).toBeDefined();
  });

  it('renders DISRUPTED notice with assertive aria-live and exact approved copy when shouldShowBanner is true', () => {
    vi.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      ...defaultHookState,
      severity: 'DISRUPTED',
      shouldShowBanner: true,
      isUserAffected: true,
      isPaymentDisabled: true,
    });

    render(<NetworkStatusBanner />);

    const banner = screen.getByRole('alert');
    expect(banner).toBeDefined();
    expect(banner.getAttribute('aria-live')).toBe('assertive');

    expect(screen.getByText('Payments are temporarily paused')).toBeDefined();
    expect(screen.getByText("Your funds and escrow are unaffected. We'll update this page as soon as the network recovers.")).toBeDefined();

    // In DISRUPTED mode, banner should not be dismissible by user
    expect(screen.queryByLabelText(/Dismiss network notice/i)).toBeNull();
  });

  it('opens and closes the "What does this mean?" details popover with Esc key', async () => {
    vi.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      ...defaultHookState,
      severity: 'SLOW',
      shouldShowBanner: true,
      isUserAffected: true,
    });

    render(<NetworkStatusBanner />);

    // Click "What does this mean?"
    const detailsBtn = screen.getByText('What does this mean?');
    fireEvent.click(detailsBtn);

    // Detail disclosures present
    expect(screen.getByText('What is happening:')).toBeDefined();
    expect(screen.getByText('What it means for your payment:')).toBeDefined();
    expect(screen.getByText('What to do:')).toBeDefined();
    expect(screen.getByText('Smart Contract Verified')).toBeDefined();

    // Press Escape to close
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByText('What is happening:')).toBeNull();
    });
  });

  it('renders recovery toast when network recovers', () => {
    const clearToastMock = vi.fn();
    vi.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      ...defaultHookState,
      severity: 'NORMAL',
      shouldShowBanner: false,
      showRecoveryToast: true,
      clearRecoveryToast: clearToastMock,
    });

    render(<NetworkStatusBanner />);

    expect(screen.getByText('Network is back to normal.')).toBeDefined();
    const dismissBtn = screen.getByLabelText('Dismiss recovery toast');
    fireEvent.click(dismissBtn);
    expect(clearToastMock).toHaveBeenCalled();
  });

  it('strictly adheres to copy constraints: zero banned words present', () => {
    vi.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      ...defaultHookState,
      severity: 'SLOW',
      shouldShowBanner: true,
      isUserAffected: true,
    });

    const { container } = render(<NetworkStatusBanner />);
    // Open details popover as well to test complete DOM text
    const detailsBtn = screen.getByText('What does this mean?');
    fireEvent.click(detailsBtn);

    const fullContent = container.textContent?.toLowerCase() || '';

    // Prohibited words and phrases from specifications
    const bannedWords = [
      'completely safe',
      'chain guaranteed',
      'guaranteed',
      '100%',
      'no risk',
    ];

    bannedWords.forEach((word) => {
      expect(fullContent).not.toContain(word);
    });
  });

  it('provides a 44px touch target on dismiss button in SLOW mode', () => {
    const dismissMock = vi.fn();
    vi.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      ...defaultHookState,
      severity: 'SLOW',
      shouldShowBanner: true,
      isUserAffected: true,
      dismissBanner: dismissMock,
    });

    render(<NetworkStatusBanner />);

    const dismissBtn = screen.getByLabelText('Dismiss network notice for 30 minutes');
    expect(dismissBtn.className).toContain('w-11');
    expect(dismissBtn.className).toContain('h-11'); // 11 * 4px = 44px
    fireEvent.click(dismissBtn);
    expect(dismissMock).toHaveBeenCalledTimes(1);
  });
});
