import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:     '#000000',
          card:     '#0C0C0F',
          elevated: '#131317',
          hover:    '#1A1C2A',
          border:   '#1E2132',
          overlay:  '#00000099',
          deep:     '#000000',
        },
        accent: {
          DEFAULT: '#E8EAED',
          hover:   '#FFFFFF',
          dim:     '#E8EAED0F',
          muted:   '#8E8E93',
          subtle:  '#FFFFFF14',
        },
        silver: {
          light:    '#C7C7CC',
          soft:     '#AEAEB2',
          graphite: '#8E8E93',
          ice:      '#F2F2F7',
          steel:    '#48484A',
          slate:    '#3A3A3C',
        },
        success: '#30D158',
        danger:  '#FF453A',
        warn:    '#FFD60A',
        text: {
          primary:   '#FFFFFF',
          secondary: '#98989F',
          muted:     '#48484A',
          faint:     '#2C2C2E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
} satisfies Config
