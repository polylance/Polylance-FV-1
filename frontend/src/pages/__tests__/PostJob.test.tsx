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
    expect(screen.getByText(/Post an/i)).toBeInTheDocument();
    expect(screen.getAllByText(/On-Chain/i)[0]).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Audit & Optimize ERC-721 Reputation Smart Contracts/i)).toBeInTheDocument();
    expect(screen.getByText(/Deploy Job Escrow Clone On-Chain/i)).toBeInTheDocument();
  });
});
