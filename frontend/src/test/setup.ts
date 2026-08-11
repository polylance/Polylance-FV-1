import '@testing-library/jest-dom';
import { vi } from 'vitest';

let mockWalletState = { address: '', isConnected: false };

export function setMockWalletState(state: { address: string; isConnected: boolean }) {
  mockWalletState = state;
}

vi.mock('wagmi', () => ({
  useAccount: () => mockWalletState,
  useDisconnect: () => ({
    disconnect: () => {
      mockWalletState = { address: '', isConnected: false };
    },
  }),
  useConfig: () => ({}),
  WagmiProvider: ({ children }: { children: any }) => children,
}));

vi.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: () => ({ openConnectModal: vi.fn() }),
}));
