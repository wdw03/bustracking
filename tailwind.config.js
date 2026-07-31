/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        'sora-regular': ['Sora_400Regular'],
        'sora-semibold': ['Sora_600SemiBold'],
        'sora-bold': ['Sora_700Bold'],
        'sora-extrabold': ['Sora_800ExtraBold'],
        'inter-regular': ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'poppins-regular': ['Poppins_400Regular'],
        'poppins-medium': ['Poppins_500Medium'],
        'clash-regular': ['ClashGrotesk_Regular'],
        'clash-medium': ['ClashGrotesk_Medium'],
        'clash-semibold': ['ClashGrotesk_SemiBold'],
        'clash-bold': ['ClashGrotesk_Bold'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        bus: {
          active: '#10b981',
          warning: '#f59e0b',
          delayed: '#ef4444',
          accent: '#8b5cf6',
        },
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
        }
      },
    },
  },
  plugins: [],
};
