import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { JobDetail } from '../JobDetail';
import { Web3Provider } from '../../context/Web3Context';
import { PolyLanceDataProvider } from '../../context/PolyLanceDataContext';

const renderJobDetailPage = () => {
  return render(
    <MemoryRouter initialEntries={['/jobs/0x123']}>
      <Web3Provider>
        <PolyLanceDataProvider>
          <JobDetail />
        </PolyLanceDataProvider>
      </Web3Provider>
    </MemoryRouter>
  );
};

describe('JobDetail Page — Extended Workflow & USDC Funding', () => {
  it('renders job detail page fallback container when job is not found', () => {
    renderJobDetailPage();
    expect(screen.getByText(/Job Contract Not Found/i)).toBeInTheDocument();
    expect(screen.getByText(/Return to Find Jobs/i)).toBeInTheDocument();
  });
});
