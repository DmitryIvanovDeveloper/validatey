/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./src/modules/landing/**/*.{vue,js,ts}",
    "./src/modules/project-landing/**/*.{vue,js,ts}",
  ],
  safelist: [
    'bg-white',
    'border-gray-200',
    'text-gray-900',
    'text-gray-600',
    'p-6',
    'rounded-lg',
    'border',
    // Add other common classes that might be needed
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Mono', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
