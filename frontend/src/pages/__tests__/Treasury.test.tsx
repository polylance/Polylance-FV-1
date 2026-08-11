import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Treasury } from '../Treasury';
import { Web3Provider } from '../../context/Web3Context';
import { PolyLanceDataProvider } from '../../context/PolyLanceDataContext';

const renderTreasuryPage = () => {
  return render(
    <MemoryRouter>
      <Web3Provider>
        <PolyLanceDataProvider>
          <Treasury />
        </PolyLanceDataProvider>
      </Web3Provider>
    </MemoryRouter>
  );
};

describe('Treasury Page — Safe Multisig Integration', () => {
  it('renders treasury multisig admin container', () => {
    renderTreasuryPage();
    expect(screen.getByText(/Safe Multisig Treasury Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/Propose Multisig Disbursement/i)).toBeInTheDocument();
  });
});
