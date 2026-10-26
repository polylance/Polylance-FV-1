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
      reasonMsg.includes('Request expired') ||
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

  console.log(
    "%cSTOP!\n%cThis is a browser feature intended for developers. If someone told you to copy and paste code here to access a feature or account, it is a scam and gives attackers access to your wallet and account.",
    "color: #EF4444; font-size: 28px; font-weight: bold; -webkit-text-stroke: 1px black;",
    "color: #9CA3AF; font-size: 13px;"
  );
}

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, coinbaseWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, createConfig, http, fallback } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const rawProjectId = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '').trim();
const hasValidProjectId = Boolean(rawProjectId && rawProjectId !== '00000000000000000000000000000000' && rawProjectId.length >= 32);
const projectId = hasValidProjectId ? rawProjectId : '3a8170812b534d0ff9d794f19a901d64';

const walletsList = [
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
];

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Available Wallets',
      wallets: walletsList,
    },
  ],
  {
    appName: 'PolyLance',
    appUrl: 'https://polylance.codes',
    appIcon: 'https://polylance.codes/polylance_logo.png',
    projectId,
  }
);

const config = createConfig({
  connectors,
  chains: [polygon, polygonAmoy],
  transports: {
    [polygon.id]: fallback([
      http('https://polygon.drpc.org'),
      http('https://1rpc.io/matic'),
      http('https://polygon.gateway.tenderly.co'),
      http('https://polygon-bor-rpc.publicnode.com'),
    ]),
    [polygonAmoy.id]: fallback([
      http('https://rpc-amoy.polygon.technology'),
      http('https://polygon-amoy-bor-rpc.publicnode.com'),
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
