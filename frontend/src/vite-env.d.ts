/// <reference types="vite/client" />

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: Array<any> }) => Promise<any>;
    on?: (eventName: string, handler: (...args: any[]) => void) => void;
  };
}

declare module 'qrcode' {
  export function toString(
    text: string,
    options?: { type?: 'svg' | 'utf8'; margin?: number; width?: number; color?: { dark?: string; light?: string } },
    callback?: (err: Error | null, string: string) => void
  ): Promise<string>;
}

