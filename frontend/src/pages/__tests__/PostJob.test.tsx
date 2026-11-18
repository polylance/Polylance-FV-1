import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PostJob } from '../PostJob';
import { Web3Provider } from '../../context/Web3Context';
import { PolyLanceDataProvider } from '../../context/PolyLanceDataContext';

const renderPostJobPage = () => {
  return render(
    <MemoryRouter>
      <Web3Provider>
        <PolyLanceDataProvider>
          <PostJob />
        </PolyLanceDataProvider>
      </Web3Provider>
    </MemoryRouter>
  );
};

describe('PostJob Page', () => {
  it('renders job creation form fields correctly', () => {
    renderPostJobPage();
    expect(screen.getByRole('heading', { level: 1, name: /Post a job/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Build an Escrow Staking Smart Contract in Foundry/i)).toBeInTheDocument();
    expect(screen.getByText('Review and post job')).toBeInTheDocument();
  });
});
