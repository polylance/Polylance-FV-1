import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillAutocomplete } from '../SkillAutocomplete';

describe('SkillAutocomplete Component', () => {
  it('renders existing chips and input with accessible role="combobox"', () => {
    const handleChange = vi.fn();
    render(
      <SkillAutocomplete
        skills={['Solidity', 'Foundry']}
        onChange={handleChange}
        label="Required skills"
        placeholder="Add skills"
      />
    );

    expect(screen.getByText('Solidity')).toBeDefined();
    expect(screen.getByText('Foundry')).toBeDefined();

    const input = screen.getByRole('combobox');
    expect(input).toBeDefined();
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens suggestion listbox when typing and highlights matches', () => {
    const handleChange = vi.fn();
    render(
      <SkillAutocomplete
        skills={[]}
        onChange={handleChange}
        selectedCategory="frontend"
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'react' } });

    expect(input.getAttribute('aria-expanded')).toBe('true');
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeDefined();

    // Check that React option is presented
    const reactOptions = screen.getAllByText('React');
    expect(reactOptions.length).toBeGreaterThan(0);
  });

  it('selects suggestion on click and invokes onChange with canonical casing', () => {
    let currentSkills: string[] = [];
    const handleChange = vi.fn((newSkills: string[]) => {
      currentSkills = newSkills;
    });

    render(
      <SkillAutocomplete
        skills={currentSkills}
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'typescript' } });

    // The option for TypeScript should be visible
    const tsOption = screen.getByText('TypeScript');
    fireEvent.mouseDown(tsOption);

    expect(handleChange).toHaveBeenCalledWith(['TypeScript']);
  });

  it('supports keyboard navigation (ArrowDown, Enter) to select options', () => {
    const handleChange = vi.fn();
    render(
      <SkillAutocomplete
        skills={[]}
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'sol' } });

    // Press ArrowDown to focus first suggestion
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Press Enter to select
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleChange).toHaveBeenCalledWith(['Solidity']);
  });

  it('supports Tab to accept inline ghost-text completion', () => {
    const handleChange = vi.fn();
    render(
      <SkillAutocomplete
        skills={[]}
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Type' } });

    // Tab accepts the ghost text ("Script") -> commits "TypeScript"
    fireEvent.keyDown(input, { key: 'Tab' });

    expect(handleChange).toHaveBeenCalledWith(['TypeScript']);
  });

  it('closes dropdown when Escape key is pressed without clearing query', () => {
    const handleChange = vi.fn();
    render(
      <SkillAutocomplete
        skills={[]}
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'web3' } });
    expect(input.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect((input as HTMLInputElement).value).toBe('web3');
  });

  it('removes chip when clicking remove button or pressing Backspace on empty input', () => {
    const handleChange = vi.fn();
    render(
      <SkillAutocomplete
        skills={['TypeScript', 'TailwindCSS']}
        onChange={handleChange}
      />
    );

    // Remove via chip button
    const removeBtn = screen.getByLabelText('Remove TypeScript');
    fireEvent.click(removeBtn);
    expect(handleChange).toHaveBeenCalledWith(['TailwindCSS']);

    // Backspace on empty input removes last chip
    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(handleChange).toHaveBeenCalledWith(['TypeScript']);
  });

  it('allows adding a custom skill if no exact match exists', () => {
    const handleChange = vi.fn();
    render(
      <SkillAutocomplete
        skills={[]}
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'CustomProtocolEngine' } });

    // Arrow down to the custom option and press Enter
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleChange).toHaveBeenCalledWith(['CustomProtocolEngine']);
  });
});
