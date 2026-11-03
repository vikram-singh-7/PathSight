const defaultBackendHost =
  typeof window !== 'undefined' && window.location.hostname
    ? window.location.hostname
    : 'localhost';

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || `http://${defaultBackendHost}:8000`;

export const APP_NAME = 'PathSight — Campus Assistive Navigation';
export const APP_DESCRIPTION =
  'Assistive guidance system for visually impaired students.';

