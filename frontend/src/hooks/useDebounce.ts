import { useState, useEffect, useRef } from 'react';

/**
 * useDebounce: Standard debounce for values like search inputs.
 * Typing remains instant in the input field while debouncedValue updates after `delay` ms.
 */
export function useDebounce<T>(value: T, delay = 300, minLength = 0): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (typeof value === 'string' && minLength > 0 && value.trim().length > 0 && value.trim().length < minLength) {
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay, minLength]);

  return debouncedValue;
}

/**
 * useDebouncedCallback: Debounces a callback with AbortController for stale request cancellation.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: (signal: AbortSignal, ...args: Parameters<T>) => void,
  delay = 300
) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    timeoutRef.current = setTimeout(() => {
      callback(signal, ...args);
    }, delay);
  };
}

