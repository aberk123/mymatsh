import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          maroon: '#6B1F4E',
          plum: '#3D0D2B',
          gold: '#C8922A',
          pink: '#E91E8C',
        },
        app: {
          bg: '#F0F4F7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Bodoni Moda', 'Cormorant Garamond', 'Georgia', 'serif'],
        logo: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        sidebar: '2px 0 8px rgba(0,0,0,0.08)',
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}

export default config
