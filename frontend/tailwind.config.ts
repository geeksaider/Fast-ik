import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#171717',
        paper: '#f7f2e8',
        line: '#ded6c8',
        bolt: '#0057ff',
        ember: '#ff4d1c',
        moss: '#177245',
      },
      fontFamily: {
        display: ['Manrope', 'Montserrat', 'Segoe UI', 'sans-serif'],
        body: ['Manrope', 'Montserrat', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        cut: '6px 6px 0 #171717',
      },
    },
  },
  plugins: [],
} satisfies Config;
