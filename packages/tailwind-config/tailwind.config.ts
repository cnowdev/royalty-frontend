import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {
      colors: {
        background: '#030712',
        nav: '#051040',
        border: '#0C2B62',
        primary: '#217ED1',
        secondary: '#41B4D3',
        muted: '#d1d5db',
        accent: '#41B4D3',
        foreground: '#f9fafb',
      },
    },
  },
  plugins: [],
} as Omit<Config, 'content'>;
