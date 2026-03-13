/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Paleta Pousada PMS - segurança, confiança, tranquilidade
        brand: {
          deep: '#1E3A5F',      // Azul profundo - sidebar, botão principal
          soft: '#4A6FA5',      // Azul suave - hover, foco
          hover: '#2C5282',     // Hover do botão
        },
        surface: {
          light: '#F4F1EC',     // Bege claro - backgrounds suaves
          white: '#FAFAF8',     // Branco suave - cards
        },
        neutral: {
          DEFAULT: '#6B7280',   // Cinza neutro - textos secundários
          border: '#D1D5DB',    // Bordas suaves
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(30, 58, 95, 0.08), 0 1px 2px -1px rgba(30, 58, 95, 0.05)',
        cardHover: '0 4px 6px -1px rgba(30, 58, 95, 0.1), 0 2px 4px -2px rgba(30, 58, 95, 0.05)',
      },
    },
  },
  plugins: [],
};
