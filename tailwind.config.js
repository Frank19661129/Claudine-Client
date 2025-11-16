/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Silver Cloud Theme - GS.ai met Lenovo Rood
        navy: {
          DEFAULT: '#002366',
          light: '#003d99',
          dark: '#001a4d',
        },
        silver: {
          light: '#fcfcfc',
          DEFAULT: '#ececec',
          dark: '#d4d4d4',
        },
        accent: {
          DEFAULT: '#E2231A', // Lenovo Red
          light: '#ff3b2f',
          dark: '#b31b14',
        },
        gray: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#6b7280',
          700: '#4a5568',
          800: '#212529',
          900: '#1a1a1a',
        },
        // Semantic colors
        background: {
          DEFAULT: '#f8f9fa',
          secondary: '#ececec',
          tertiary: '#fcfcfc',
        },
        border: {
          DEFAULT: 'rgba(158, 158, 158, 0.25)',
          light: 'rgba(158, 158, 158, 0.15)',
          dark: '#dee2e6',
        },
        text: {
          primary: '#002366',
          secondary: '#4a5568',
          muted: '#6b7280',
          light: '#9ca3af',
        },
        // Status colors (paperless-style)
        status: {
          new: '#4338ca',      // Blue
          open: '#d97706',     // Orange
          progress: '#0891b2', // Cyan
          done: '#059669',     // Green
          cancelled: '#6b7280', // Gray
        },
        priority: {
          high: '#dc2626',   // Red
          medium: '#ea580c', // Orange
          low: '#059669',    // Green
        },
      },

      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },

      fontSize: {
        // Paperless-style compact typography
        'tiny': ['11px', { lineHeight: '1.5', letterSpacing: '0.3px' }],
        'xs': ['12px', { lineHeight: '1.5' }],
        'sm': ['13px', { lineHeight: '1.6' }],
        'base': ['14px', { lineHeight: '1.6' }],
        'md': ['15px', { lineHeight: '1.5' }],
        'lg': ['16px', { lineHeight: '1.4' }],
        'xl': ['18px', { lineHeight: '1.4' }],
        '2xl': ['20px', { lineHeight: '1.3' }],
        '3xl': ['24px', { lineHeight: '1.2' }],
        '4xl': ['32px', { lineHeight: '1.1' }],
      },

      spacing: {
        // Paperless-style tight spacing
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
      },

      borderRadius: {
        'none': '0',
        'sm': '3px',
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        'full': '9999px',
      },

      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 2px 4px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 8px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 16px rgba(0, 0, 0, 0.1)',
        'xl': '0 12px 24px rgba(0, 0, 0, 0.12)',
        '2xl': '0 20px 40px rgba(0, 0, 0, 0.15)',
        'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        'none': 'none',
      },

      backgroundImage: {
        'gradient-silver': 'linear-gradient(135deg, #fcfcfc 0%, #ececec 100%)',
        'gradient-navy': 'linear-gradient(135deg, #002366 0%, #003d99 100%)',
        'gradient-accent': 'linear-gradient(135deg, #E2231A 0%, #b31b14 100%)',
      },

      width: {
        'sidebar': '220px',
        'sidebar-collapsed': '60px',
      },

      height: {
        'topbar': '48px',
        'header': '48px',
        'toolbar': '40px',
        'row': '40px',
        'row-compact': '36px',
      },
    },
  },
  plugins: [],
}
