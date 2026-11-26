/// <reference types="vite/client" />

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: Array<any> }) => Promise<any>;
    on?: (eventName: string, handler: (...args: any[]) => void) => void;
  };
  turnstile?: {
    render: (
      container: string | HTMLElement,
      options: {
        sitekey: string;
        action?: string;
        callback?: (token: string) => void;
        'error-callback'?: (error?: any) => void;
        'expired-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
        size?: 'normal' | 'compact' | 'flexible';
      }
    ) => string;
    reset: (widgetId?: string) => void;
    remove: (widgetId?: string) => void;
  };
}

declare module 'qrcode' {
  export function toString(
    text: string,
    options?: { type?: 'svg' | 'utf8'; margin?: number; width?: number; color?: { dark?: string; light?: string } },
    callback?: (err: Error | null, string: string) => void
  ): Promise<string>;
}

