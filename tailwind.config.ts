import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // edocode455 Brand Colors: Pitch Black + Neon Cyber Green (#00FF29)
        background: '#000000',
        surface: '#0A0D0A',
        'surface-2': '#111712',
        'surface-3': '#1A241B',
        border: '#1F2E23',
        'border-light': '#2D4232',
        'text-primary': '#FFFFFF',
        'text-secondary': '#9CA3AF',
        'text-muted': '#52525B',
        accent: {
          DEFAULT: '#22C55E',
          hover: '#4ADE80',
          muted: 'rgba(34, 197, 94, 0.12)',
          dark: '#16A34A',
        },
        brand: {
          green: '#22C55E',
          darkgreen: '#15803D',
          black: '#000000',
          charcoal: '#0D110E',
        },
        critical: '#EF4444',
        high: '#F97316',
        medium: '#EAB308',
        low: '#22C55E',
        info: '#38BDF8',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      boxShadow: {
        'glow-green': '0 0 25px -3px rgba(0, 255, 41, 0.35)',
        'glow-green-sm': '0 0 12px -2px rgba(0, 255, 41, 0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'pulse-slow': 'pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
