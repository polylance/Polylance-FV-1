import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (typeof window !== 'undefined') {
  const bumpMaxListeners = () => {
    try {
      const eth = (window as any).ethereum;
      if (eth) {
        if (typeof eth.setMaxListeners === 'function') eth.setMaxListeners(100);
        if (Array.isArray(eth.providers)) {
          eth.providers.forEach((p: any) => {
            if (p && typeof p.setMaxListeners === 'function') p.setMaxListeners(100);
          });
        }
      }
    } catch {}
  };
  bumpMaxListeners();
  window.addEventListener('ethereum#initialized', bumpMaxListeners, { once: true });

  console.info(
    "%c🛡️ PolyLance Sovereign Security Guard Active\n%cNotice: Autonomous multisig authorization and rate-limiting shields protect all platform state. Entering unauthorized scripts in this console will be rejected by decentralized contract guards.",
    "color: #7C3AED; font-size: 14px; font-weight: bold;",
    "color: #4B5563; font-size: 11px;"
  );
}

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, coinbaseWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { polygonAmoy, polygon, mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const projectId = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '').trim();
const hasValidProjectId = Boolean(projectId && projectId !== '00000000000000000000000000000000' && projectId.length >= 32);

const walletsList = [
  metaMaskWallet,
  coinbaseWallet,
];

if (hasValidProjectId) {
  walletsList.push(walletConnectWallet);
}

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Available Wallets',
      wallets: walletsList,
    },
  ],
  {
    appName: 'PolyLance',
    projectId: hasValidProjectId ? projectId : '3a8170812b534d0ff9d794f19a901d64',
  }
);

const config = createConfig({
  connectors,
  chains: [polygonAmoy, polygon, mainnet],
  transports: {
    [polygonAmoy.id]: http('https://polygon-amoy-bor-rpc.publicnode.com'),
    [polygon.id]: http('https://polygon-bor-rpc.publicnode.com'),
    [mainnet.id]: http('https://cloudflare-eth.com'),
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
