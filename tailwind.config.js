/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clean Minimal Theme
        navy: {
          DEFAULT: '#002366',
          light: '#003d99',
          dark: '#001a4d',
        },
        ash: {
          DEFAULT: '#b2beb5',
          light: '#d4dcd8',
          dark: '#8a9690',
        },
        accent: {
          DEFAULT: '#ff1493',
          light: '#ff69b4',
          dark: '#c71073',
        },
        background: {
          DEFAULT: '#f8fafc',
          secondary: '#e2e8f0',
        },
        card: {
          DEFAULT: '#f8fafc',
          border: '#e5e7eb',
        },
        text: {
          primary: '#002366',
          secondary: '#4b5563',
          muted: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['11px', { lineHeight: '1.5', letterSpacing: '1px' }],
        'sm': ['14px', { lineHeight: '1.6' }],
        'base': ['16px', { lineHeight: '1.8' }],
        'lg': ['20px', { lineHeight: '1.4' }],
        'xl': ['24px', { lineHeight: '1.3' }],
        '2xl': ['32px', { lineHeight: '1.2' }],
        '3xl': ['48px', { lineHeight: '1.1' }],
      },
      borderRadius: {
        'card': '20px',
        'button': '12px',
        'input': '12px',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'button': '0 2px 8px rgba(0, 35, 102, 0.15)',
        'float': '0 10px 40px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        'gradient-navy': 'linear-gradient(135deg, #002366 0%, #003d99 100%)',
        'gradient-card': 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      },
    },
  },
  plugins: [],
}
