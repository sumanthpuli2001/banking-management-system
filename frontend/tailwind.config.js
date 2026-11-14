/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bank: {
          950: '#060E1A',
          900: '#0A192F',
          850: '#0F223D',
          800: '#142C4E',
          750: '#1B3B68',
          700: '#234C84',
          600: '#2A5EA4',
          500: '#1D64D8', // Core Corporate Blue
          400: '#3B82F6',
          300: '#60A5FA',
          200: '#BFDBFE',
          100: '#DBEAFE',
          50: '#EFF6FF',
        },
        slatebank: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        finGreen: {
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          50: '#ECFDF5',
        },
        finAmber: {
          500: '#F59E0B',
          600: '#D97706',
          50: '#FFFBEB',
        },
        finRed: {
          500: '#EF4444',
          600: '#DC2626',
          50: '#FEF2F2',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Roboto Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
