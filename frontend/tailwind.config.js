/** @type {import('tailwindcss').Config} */
// Tailwind CSS 配置，扩展哈基米专属颜色
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Navy palette
        navy: {
          DEFAULT: '#0F172A',
          light: '#1E293B',
          medium: '#334155',
        },
        // Gold palette
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E2C97E',
          dark: '#9B7A1F',
          shine: '#F0D060',
        },
        // Cream palette
        cream: {
          DEFAULT: '#FAFAF8',
          warm: '#F7F4EE',
          card: '#FFFFFF',
        },
        // Backwards compatibility aliases
        'hakimi-primary': '#C9A84C',
        'hakimi-secondary': '#0F172A',
        'hakimi-bg': '#FAFAF8',
        'hakimi-cat': '#F7F4EE',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'typing': 'typing 1.4s infinite',
      },
      keyframes: {
        typing: {
          '0%, 100%': { opacity: '0.2', transform: 'translateY(0)' },
          '50%': { opacity: '1', transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}
