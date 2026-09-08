import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0a0a0c',
          900: '#111114',
          850: '#17171b',
          800: '#1d1d22',
          700: '#2a2a31',
          600: '#3a3a43',
        },
        accent: {
          DEFAULT: '#7c5cff',
          soft: '#a78bfa',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};

export default config;
