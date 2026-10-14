import { useState, useEffect } from 'react';

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: any;
}

export function useEip6963() {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onAnnounceProvider = (event: any) => {
      const detail = event.detail as EIP6963ProviderDetail;
      if (!detail?.info?.uuid) return;

      setProviders((prev) => {
        if (prev.some((p) => p.info.uuid === detail.info.uuid || p.info.rdns === detail.info.rdns)) {
          return prev;
        }
        return [...prev, detail];
      });
    };

    window.addEventListener('eip6963:announceProvider', onAnnounceProvider);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    return () => {
      window.removeEventListener('eip6963:announceProvider', onAnnounceProvider);
    };
  }, []);

  const isMetaMaskInstalled = typeof window !== 'undefined' && Boolean(
    (window as any).ethereum?.isMetaMask ||
    providers.some((p) => p.info.name.toLowerCase().includes('metamask') || p.info.rdns?.includes('metamask'))
  );

  const isCoinbaseInstalled = typeof window !== 'undefined' && Boolean(
    (window as any).coinbaseWalletExtension ||
    (window as any).ethereum?.isCoinbaseWallet ||
    providers.some((p) => p.info.name.toLowerCase().includes('coinbase') || p.info.rdns?.includes('coinbase'))
  );

  return {
    providers,
    isMetaMaskInstalled,
    isCoinbaseInstalled,
  };
}
