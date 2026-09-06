import '@testing-library/jest-dom';
import { vi } from 'vitest';

let mockWalletState = { address: '', isConnected: false };

export function setMockWalletState(state: { address: string; isConnected: boolean }) {
  mockWalletState = state;
}

if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn();
  window.BroadcastChannel = class MockBroadcastChannel {
    name: string;
    constructor(name: string) {
      this.name = name;
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true; }
    onmessage = null;
    onmessageerror = null;
  } as any;
}

vi.mock('wagmi', () => ({
  useAccount: () => mockWalletState,
  useChainId: () => 80002,
  useSwitchChain: () => ({ switchChain: vi.fn(), chains: [] }),
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
