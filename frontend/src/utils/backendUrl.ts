export const getSyncEndpoints = (): string[] => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return ['http://localhost:3001'];
  }
  const list: string[] = [];
  const envUrl = (import.meta.env.VITE_CHAT_SERVICE_URL || import.meta.env.VITE_CHAT_SERVER_URL || '').trim();
  if (envUrl && !envUrl.includes('polylance-chat-service.onrender.com')) {
    list.push(envUrl.replace(/\/$/, ''));
  }
  list.push('https://polylance-fv-1-45wy.onrender.com');

  return Array.from(new Set(list.filter(Boolean)));
};

export const getBackendSyncUrl = (): string => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3001';
  }
  const envUrl = (import.meta.env.VITE_CHAT_SERVICE_URL || import.meta.env.VITE_CHAT_SERVER_URL || '').trim();
  if (envUrl && !envUrl.includes('polylance-chat-service.onrender.com')) {
    return envUrl.replace(/\/$/, '');
  }
  return 'https://polylance-fv-1-45wy.onrender.com';
};
