/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0B0F14',
        surface: '#11161D',
        elevated: '#151C24',
        primary: '#7C8BFF',
        accent: '#00D0FF',
        success: '#3BE489',
        warning: '#FFB020',
        'text-hi': '#FFFFFF',
        'text-lo': '#98A2B3',
        border: '#1F2937',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,.25)',
        md: '0 6px 24px rgba(0,0,0,.35)',
        xl: '0 12px 48px rgba(0,0,0,.45)',
      },
      borderRadius: {
        '2xl': '24px'
      },
      fontFamily: {
        heading: ['Poppins', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(.2,.7,.2,1)',
      },
      backgroundImage: {
        'grad-primary': 'linear-gradient(135deg, #7C8BFF 0%, #00D0FF 100%)',
        'grad-bg': 'radial-gradient(at 20% 10%, rgba(124,139,255,.18), transparent 60%), radial-gradient(at 80% 90%, rgba(0,208,255,.14), transparent 55%)',
      },
      animation: {
        'shimmer': 'shimmer 2.2s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}