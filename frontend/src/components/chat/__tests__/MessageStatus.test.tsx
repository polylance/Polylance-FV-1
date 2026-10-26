import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageStatus } from '../MessageStatus';

describe('MessageStatus Component', () => {
  it('renders sending state with clock icon and accessible status', () => {
    render(<MessageStatus status="sending" />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-label', 'Sending');
    expect(el.querySelector('svg')).toBeInTheDocument();
  });

  it('renders sent state with a single blue check', () => {
    render(<MessageStatus status="sent" />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-label', 'Sent');
    expect(el).toHaveAttribute('title', 'Sent to server');
    // Ensure only ONE tick path exists
    const paths = el.querySelectorAll('path');
    expect(paths.length).toBe(1);
  });

  it('renders seen state with animated green check and Seen label', () => {
    const seenTimestamp = new Date(2026, 9, 24, 11, 20).getTime();
    render(<MessageStatus status="seen" seenAt={seenTimestamp} />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-label', 'Seen');
    expect(screen.getByText('Seen')).toBeInTheDocument();
    const tick = el.querySelector('.seen-tick-path');
    expect(tick).toBeInTheDocument();
  });

  it('renders "Seen by N" when seenByCount > 1 in group/judge channels', () => {
    render(<MessageStatus status="seen" seenByCount={3} />);
    expect(screen.getByText('Seen by 3')).toBeInTheDocument();
  });

  it('suppresses green tick to sent when read receipts privacy is disabled', () => {
    render(<MessageStatus status="seen" sendReadReceipts={false} />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-label', 'Sent');
    expect(screen.queryByText('Seen')).not.toBeInTheDocument();
  });

  it('renders failed state with retry button and calls onRetry when clicked', () => {
    const onRetryMock = vi.fn();
    render(<MessageStatus status="failed" onRetry={onRetryMock} />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-label', 'Failed to send');
    expect(screen.getByText('Failed')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });
});
