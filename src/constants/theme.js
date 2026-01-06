/**
 * Theme colors and constants used throughout the application
 */

export const COLORS = {
  // Background colors
  background: {
    primary: '#1E1F22',
    secondary: '#232428',
    card: '#343538',
    cardHeader: '#5A5B5D',
    cardAlt: '#4A4B4D',
    header: '#2d2e32',
  },
  
  // Brand colors
  primary: '#74CD25',
  primaryHover: '#5fa01c',
  primaryLight: '#8FE040',
  
  // Status colors
  status: {
    online: '#74CD25',
    offline: '#EF4444',
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#9CA3AF', // gray-400
    muted: '#6B7280', // gray-500
  },
  
  // Border colors
  border: {
    primary: '#343538',
    secondary: '#5A5B5D',
  },
};

export const THEME = {
  // Font family
  fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
  
  // Border radius
  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px',
  },
  
  // Transitions
  transition: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
};

export default { COLORS, THEME };
