const isBrowser = typeof window !== 'undefined';
const isLocalhost =
  isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// When loaded in a browser, use relative path "" so all API calls route through Vite proxy on the same port/host.
// If on mobile/remote device, never attempt to call localhost:8000.
export const API_BASE_URL: string = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    if (!isBrowser || isLocalhost || !envUrl.includes('localhost')) {
      return envUrl;
    }
  }
  return '';
})();

export const APP_NAME = 'PathSight — Campus Assistive Navigation';
export const APP_DESCRIPTION =
  'Assistive guidance system for visually impaired students.';

