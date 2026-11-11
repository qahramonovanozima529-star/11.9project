/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Roboto shrifti — Numeo uslubi uchun
        roboto: ['Roboto', 'sans-serif'],
      },
      colors: {
        // Numeo ranglari
        numeo: {
          bg: '#07090E',         // Asosiy fon — chuqur qora
          card: '#0F131C',       // Kartochkalar — to'q kulrang/qora
          cardLight: '#151B27',  // Yorug'roq kartochkalar
          border: '#1E2535',     // Chegaralar
          blue: '#2563EB',       // Asosiy ko'k
          blueLight: '#3B82F6',  // Yorug' ko'k
          text: '#FFFFFF',       // Asosiy matn — oq
          textMuted: '#8892A4',  // Ikkinchi darajali matn
          textDim: '#4B5563',    // O'chirilgan matn
          success: '#10B981',    // Yashil — Delivered
          warning: '#F59E0B',    // Sariq — On Hold
          danger: '#EF4444',     // Qizil — Cancelled
          info: '#3B82F6',       // Ko'k — In Transit
        },
      },
      backgroundImage: {
        'gradient-numeo': 'linear-gradient(135deg, #07090E 0%, #0F131C 100%)',
        'gradient-card': 'linear-gradient(135deg, #0F131C 0%, #151B27 100%)',
        'gradient-blue': 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
      },
      boxShadow: {
        'numeo': '0 4px 24px rgba(37, 99, 235, 0.15)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-blue': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

