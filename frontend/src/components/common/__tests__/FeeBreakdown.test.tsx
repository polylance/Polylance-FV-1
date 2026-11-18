import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeeBreakdown from '../FeeBreakdown';

describe('FeeBreakdown Component & Accessible Disclosure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "How fees work" disclosure button with proper aria attributes', () => {
    render(<FeeBreakdown budget="10.0" token="POL" isClient={false} />);

    const trigger = screen.getByRole('button', { name: /how fees work/i });
    expect(trigger).toBeDefined();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe('how-fees-work-content');
  });

  it('toggles disclosure open and closed smoothly without infinite re-render loops', () => {
    render(
      <div>
        <FeeBreakdown budget="10.0" token="POL" isClient={false} />
        <button data-testid="apply-button">Apply for this job</button>
      </div>
    );

    const trigger = screen.getByRole('button', { name: /how fees work/i });
    const applyBtn = screen.getByTestId('apply-button');

    // 1. Initial state: collapsed
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    // 2. Click to expand
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText((content, element) => {
      return Boolean(element && element.tagName.toLowerCase() === 'strong' && content.includes('Platform service fee'));
    })).toBeDefined();

    // 3. Verify page remains fully interactive (Apply button clickable)
    expect(applyBtn).toBeDefined();
    fireEvent.click(applyBtn);

    // 4. Click to collapse
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    // 5. Click repeatedly to ensure no re-render crash
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('switches between Freelancer and Client modes accurately', () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <FeeBreakdown budget="10.0" token="POL" isClient={false} onRoleToggle={onToggle} />
    );

    // In freelancer mode
    expect(screen.getAllByText(/You receive/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('9.75').length).toBeGreaterThan(0);

    // Toggle to client mode
    rerender(<FeeBreakdown budget="10.0" token="POL" isClient={true} onRoleToggle={onToggle} />);
    expect(screen.getAllByText(/Total deposit/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('10.25').length).toBeGreaterThan(0);

    // Disclosure is still available in client mode
    const trigger = screen.getByRole('button', { name: /how fees work/i });
    expect(trigger).toBeDefined();
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });
});
