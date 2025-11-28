module.exports = {
  content: [
    // If using src folder:
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: '#F8FAFC', // Slate 50 - Clean, professional background
          blue: '#1565C0',  // Blue 600 - Trustworthy primary
          yellow: '#F59E0B', // Amber 500 - Warm accent
          green: '#43A047',  // Emerald 500 - Success
          purple: '#7C3AED', // Violet 600 - Secondary
          dark: '#0F172A',   // Slate 900 - Professional dark text
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
