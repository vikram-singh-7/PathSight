import type { TextSize } from '../types';

export const COLORS = {
  navy: {
    950: '#070d18',
    900: '#0b1329',
    800: '#111c38',
    700: '#1e293b',
    600: '#334155',
  },
  teal: {
    600: '#0d9488',
    500: '#14b8a6',
    400: '#2dd4bf',
    300: '#5eead4',
  },
  amber: {
    600: '#d97706',
    500: '#f59e0b',
    400: '#fbbf24',
    900: '#451a03',
  },
  rose: {
    600: '#e11d48',
    500: '#f43f5e',
    400: '#fb7185',
    900: '#4c0519',
  },
  emerald: {
    500: '#10b981',
    400: '#34d399',
  },
};

export function getTextSizeClass(size: TextSize): string {
  switch (size) {
    case 'large':
      return 'text-lg';
    case 'xlarge':
      return 'text-xl';
    case 'standard':
    default:
      return 'text-base';
  }
}
