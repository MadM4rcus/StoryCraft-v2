// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mapeamos nomes de cores para variáveis CSS que vamos controlar via JavaScript
        'background': 'var(--color-background)',
        'surface': 'var(--color-surface)',
        'primary': 'var(--color-primary)',
        'secondary': 'var(--color-secondary)',
        'accent': 'var(--color-accent)',
        'highlight': 'var(--color-highlight)',
      },
      fontFamily: {
        // A fonte principal do tema também será uma variável
        'sans': ['var(--font-family)', 'ui-sans-serif', 'system-ui'],
      },
      backgroundImage: {
        // A imagem de fundo do tema também será uma variável
        'theme': 'var(--background-image)',
      }
    },
  },
  plugins: [],
}