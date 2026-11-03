// Empty string allows requests to route through Vite's reverse proxy on the same port/origin,
// working seamlessly on localhost, local Wi-Fi IP, and HTTPS tunnels with zero CORS or Mixed Content errors.
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '';

export const APP_NAME = 'PathSight — Campus Assistive Navigation';
export const APP_DESCRIPTION =
  'Assistive guidance system for visually impaired students.';

