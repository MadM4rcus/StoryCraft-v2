/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bgPage': 'var(--color-bgPage)',
        'bgSurface': 'rgba(var(--color-bgSurface-rgb), var(--surface-opacity))',
        'bgElement': 'var(--color-bgElement)',
        'bgInput': 'var(--color-bgInput)',
        'textPrimary': 'var(--color-textPrimary)',
        'textSecondary': 'var(--color-textSecondary)',
        'borderAccent': 'var(--color-borderAccent)',
        'textAccent': 'var(--color-textAccent)',
        'btnHighlightBg': 'var(--color-btnHighlightBg)',
        'btnHighlightText': 'var(--color-btnHighlightText)',
      },
      fontFamily: {
        'sans': ['var(--font-family)', 'ui-sans-serif', 'system-ui'],
      },
      // ADICIONADO DE VOLTA
      backgroundImage: {
        'theme': 'var(--background-image)',
      }
    },
  },
  plugins: [],
}