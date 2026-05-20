import { createTheme } from '@mui/material/styles';
import { APP_CONFIG } from '../config/constants';

// CSS Variable Integration Helper
const getCSSVar = (variableName: string, fallback?: string) => {
  if (typeof document !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || fallback;
  }
  return fallback;
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: getCSSVar('--color-primary') || '#2563eb',
      light: getCSSVar('--color-primary-light') || '#3b82f6',
      dark: getCSSVar('--color-primary-dark') || '#1d4ed8',
      contrastText: getCSSVar('--color-white') || '#ffffff',
    },
    secondary: {
      main: getCSSVar('--color-secondary') || '#16a34a',
      light: getCSSVar('--color-secondary-light') || '#22c55e',
      dark: getCSSVar('--color-secondary-dark') || '#15803d',
      contrastText: getCSSVar('--color-white') || '#ffffff',
    },
    success: {
      main: getCSSVar('--color-success') || '#22c55e',
      light: '#4ade80',
      dark: getCSSVar('--color-secondary-dark') || '#16a34a',
    },
    warning: {
      main: getCSSVar('--color-warning') || '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: getCSSVar('--color-error') || '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
    },
    info: {
      main: getCSSVar('--color-info') || '#3b82f6',
      light: '#60a5fa',
      dark: getCSSVar('--color-primary-dark') || '#2563eb',
    },
    background: {
      default: getCSSVar('--bg-default') || '#f8fafc',
      paper: getCSSVar('--bg-paper') || '#ffffff',
    },
    text: {
      primary: getCSSVar('--text-primary') || '#1f2937',
      secondary: getCSSVar('--text-secondary') || '#6b7280',
    },
    grey: {
      50: getCSSVar('--color-gray-50') || '#f9fafb',
      100: getCSSVar('--color-gray-100') || '#f3f4f6',
      200: getCSSVar('--color-gray-200') || '#e5e7eb',
      300: getCSSVar('--color-gray-300') || '#d1d5db',
      400: getCSSVar('--color-gray-400') || '#9ca3af',
      500: getCSSVar('--color-gray-500') || '#6b7280',
      600: getCSSVar('--color-gray-600') || '#4b5563',
      700: getCSSVar('--color-gray-700') || '#374151',
      800: getCSSVar('--color-gray-800') || '#1f2937',
      900: getCSSVar('--color-gray-900') || '#111827',
    },
  },
  typography: {
    fontFamily: getCSSVar('--font-family') || '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: getCSSVar('--font-size-xxl') || '2.5rem',
      fontWeight: getCSSVar('--font-weight-bold') || 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: getCSSVar('--font-weight-semibold') || 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: getCSSVar('--font-weight-semibold') || 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: getCSSVar('--font-weight-semibold') || 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: getCSSVar('--font-size-xl') || '1.125rem',
      fontWeight: getCSSVar('--font-weight-semibold') || 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: getCSSVar('--font-size-lg') || '1rem',
      fontWeight: getCSSVar('--font-weight-semibold') || 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: getCSSVar('--font-size-lg') || '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: getCSSVar('--font-size-md') || '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: getCSSVar('--font-weight-semibold') || 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: parseInt(getCSSVar('--radius-lg')?.replace('px', '') || '12'),
  },
  spacing: APP_CONFIG.ui.spacing.sm,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: getCSSVar('--radius-lg') || 12,
          padding: `${APP_CONFIG.ui.spacing.md}px ${APP_CONFIG.ui.spacing.lg}px`,
          fontWeight: getCSSVar('--font-weight-semibold') || 600,
          textTransform: 'none',
          boxShadow: 'none',
          transition: getCSSVar('--transition-normal') || '0.2s ease',
          '&:hover': {
            boxShadow: getCSSVar('--shadow-md') || '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: getCSSVar('--shadow-md') || '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: getCSSVar('--radius-xl') || 16,
          boxShadow: getCSSVar('--shadow-sm') || '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
          border: `1px solid ${getCSSVar('--border-light') || 'rgba(0, 0, 0, 0.05)'}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: getCSSVar('--radius-lg') || 12,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#2563eb',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});
