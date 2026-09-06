import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { JobDetail } from '../JobDetail';
import { Web3Provider } from '../../context/Web3Context';
import { PolyLanceDataProvider } from '../../context/PolyLanceDataContext';

const renderJobDetailPage = () => {
  return render(
    <MemoryRouter initialEntries={['/jobs/0x123']}>
      <Routes>
        <Route
          path="/jobs/:id"
          element={
            <Web3Provider>
              <PolyLanceDataProvider>
                <JobDetail />
              </PolyLanceDataProvider>
            </Web3Provider>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('JobDetail Page — Extended Workflow & USDC Funding', () => {
  it('renders job detail page fallback container when job is not found', async () => {
    renderJobDetailPage();
    expect(await screen.findByText(/Job Contract Not Found/i, {}, { timeout: 3500 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Dashboard/i })).toBeInTheDocument();
  });
});
