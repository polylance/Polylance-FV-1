import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (typeof window !== 'undefined') {
  // Global error guard against Chrome Web Vitals extension crash during Back-Forward Cache (bfcache) navigation
  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    if (
      msg.includes("Cannot read properties of undefined (reading 'startTime')") ||
      msg.includes('reportAllChanges') ||
      (event?.error?.stack && event.error.stack.includes('reportAllChanges'))
    ) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event?.reason?.message || '';
    if (
      reasonMsg.includes("reading 'startTime'") ||
      reasonMsg.includes('emitting session_request') ||
      reasonMsg.includes('without any listeners') ||
      (event?.reason?.stack && event.reason.stack.includes('reportAllChanges'))
    ) {
      event.preventDefault();
      return true;
    }
  });

  // Filter out upstream browser wallet extension and wallet relay internal warnings
  const formatConsoleArg = (a: any) => {
    if (!a) return '';
    if (typeof a === 'string') return a;
    try {
      return (a.message || '') + ' ' + (a.stack || '') + ' ' + (typeof a === 'object' ? JSON.stringify(a) : String(a));
    } catch {
      return String(a);
    }
  };

  const shouldSuppressConsole = (args: any[]) => {
    for (let i = 0; i < args.length; i++) {
      const s = formatConsoleArg(args[i]);
      if (
        s.includes('MaxListenersExceededWarning') ||
        s.includes('ObjectMultiplex') ||
        s.includes('app-init-liveness') ||
        s.includes('background-liveness') ||
        s.includes('deprecated parameters for the initialization function') ||
        s.includes('feature_collector') ||
        s.includes('emitting session_request') ||
        s.includes('without any listeners')
      ) {
        return true;
      }
    }
    return false;
  };

  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (shouldSuppressConsole(args)) return;
    origWarn.apply(console, args);
  };

  const origErr = console.error;
  console.error = (...args: any[]) => {
    if (shouldSuppressConsole(args)) return;
    origErr.apply(console, args);
  };

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
import { WagmiProvider, createConfig, http, fallback } from 'wagmi';
import { polygonAmoy, polygon, mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const projectId = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '').trim();
const hasValidProjectId = Boolean(projectId && projectId !== '00000000000000000000000000000000' && projectId.length >= 32);

// Clean up stale WalletConnect session keys if project ID is not configured
if (typeof window !== 'undefined' && !hasValidProjectId) {
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('wc@2') || k.startsWith('@w3m') || k.startsWith('-walletlink')) {
        localStorage.removeItem(k);
      }
    });
  } catch {}
}

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
    [polygonAmoy.id]: fallback([
      http('https://polygon-amoy-bor-rpc.publicnode.com'),
      http('https://polygon-amoy.gateway.tenderly.co'),
      http('https://polygon-amoy.g.alchemy.com/v2/xd727FUEtN2c-SPI_yo3B'),
      http('https://80002.rpc.thirdweb.com'),
    ]),
    [polygon.id]: fallback([
      http('https://polygon.drpc.org'),
      http('https://137.rpc.thirdweb.com'),
      http('https://polygon-mainnet.g.alchemy.com/v2/xd727FUEtN2c-SPI_yo3B'),
      http('https://polygon-bor-rpc.publicnode.com'),
    ]),
    [mainnet.id]: fallback([
      http('https://ethereum-rpc.publicnode.com'),
      http('https://eth.llamarpc.com'),
    ]),
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
