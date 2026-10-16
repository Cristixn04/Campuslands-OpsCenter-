/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          deep: '#030816',      // Fondo cósmico ultra oscuro
          surface: '#081226',   // Superficie de cards
          card: '#0c1a36',      // Card elevada
          border: 'rgba(255, 255, 255, 0.08)',
          teal: '#54C6AA',      // Brand Teal oficial de Campuslands
          cyan: '#00E5FF',      // Acento Cyan tecnológico
          blue: '#0076B7',      // Azul institucional Campuslands
          purple: '#937AE6',    // Púrpura cósmico de gradiente
          danger: '#FF4D6D',    // Rojo alerta / inhabilitado
          warning: '#FFB703',   // Naranja ocupado / advertencia
          success: '#10B981',   // Verde disponible
        }
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'Roboto Mono', 'monospace'],
      },
      backgroundImage: {
        'campus-gradient': 'linear-gradient(to right, #54C6AA, #937AE6)',
        'campus-glow': 'radial-gradient(circle at 50% 0%, rgba(84, 198, 170, 0.15), transparent 70%)',
      }
    },
  },
  plugins: [],
}
