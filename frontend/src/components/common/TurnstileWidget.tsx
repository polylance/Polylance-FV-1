import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export interface TurnstileWidgetProps {
  onVerify?: (token: string) => void;
  onError?: (err?: any) => void;
  onExpire?: () => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  className?: string;
}

// Cloudflare official test key that always passes (fallback if VITE_CLOUDFLARE_TURNSTILE_SITE_KEY is not set)
const DEFAULT_SITE_KEY = '1x00000000000000000000AA';

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onError,
  onExpire,
  action = 'polylance-auth',
  theme = 'auto',
  size = 'normal',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || DEFAULT_SITE_KEY;

  useEffect(() => {
    let isMounted = true;

    // Function to initialize Turnstile once script is available
    const initTurnstile = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;

      // Clean up previous instance if any
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme,
          size,
          callback: (token: string) => {
            if (isMounted && onVerify) onVerify(token);
          },
          'error-callback': (err: any) => {
            if (isMounted && onError) onError(err);
          },
          'expired-callback': () => {
            if (isMounted && onExpire) onExpire();
          },
        });
        widgetIdRef.current = id;
        setIsReady(true);
      } catch (e) {
        if (isMounted && onError) onError(e);
      }
    };

    // Check if Turnstile script is already on page
    if (typeof window !== 'undefined' && window.turnstile) {
      initTurnstile();
    } else {
      const existingScript = document.getElementById('cf-turnstile-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'cf-turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => initTurnstile();
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', () => initTurnstile(), { once: true });
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, action, theme, size]);

  return (
    <div className={`turnstile-container flex flex-col items-center justify-center my-3 ${className}`}>
      <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />
      {!isReady && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 py-1">
          <ShieldCheck size={14} className="text-emerald-500 animate-pulse" />
          <span>Cloudflare bot protection ready</span>
        </div>
      )}
    </div>
  );
};
