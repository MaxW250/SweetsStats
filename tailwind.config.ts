import type { Config } from 'tailwindcss'
import { heroui } from '@heroui/react'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        coral: '#F97B6B',
      },
      fontFamily: {
        serif: ['var(--font-dm-serif)', 'serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
    },
  },
  darkMode: 'class',
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: '#F97B6B',
              foreground: '#ffffff',
            },
          },
        },
      },
    }),
  ],
}

export default config
