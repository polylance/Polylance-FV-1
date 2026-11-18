import { ToastMessage, ToastType } from '../components/mobile/Toast';

const TOAST_EVENT = 'polylance_toast_event';

export const toast = {
  success: (title: string, message?: string, duration?: number) =>
    dispatchToast('success', title, message, duration),
  error: (title: string, message?: string, duration?: number) =>
    dispatchToast('error', title, message, duration),
  info: (title: string, message?: string, duration?: number) =>
    dispatchToast('info', title, message, duration),
  warning: (title: string, message?: string, duration?: number) =>
    dispatchToast('error', title, message, duration),
};

function dispatchToast(type: ToastType, title: string, message?: string, duration?: number) {
  if (typeof window === 'undefined') return;
  const newToast: ToastMessage = {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    message,
    duration: duration ?? (type === 'error' ? 5000 : 4000),
  };
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: newToast }));
}

export function subscribeToasts(callback: (t: ToastMessage) => void) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<ToastMessage>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };
  window.addEventListener(TOAST_EVENT, handler);
  return () => window.removeEventListener(TOAST_EVENT, handler);
}
