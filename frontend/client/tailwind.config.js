/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Jost', 'Inter', 'system-ui', 'sans-serif'],
        logo: ['Comfortaa', 'Jost', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#1a1a1a',
        muted: '#767676',
        line: '#e8e8e8',
        cream: '#f7f5f2',
        // Brand gold from the logo. DEFAULT is darkened so small text on
        // white stays readable (WCAG AA); gold is for large/decorative use
        accent: {
          DEFAULT: '#8c6a17',
          light: '#f7f0dd'
        },
        gold: '#d4a73a',
        charcoal: '#2e2e2e',
        // Older pages use Tailwind's blue for buttons and links; remapping it
        // gives them the store's near-black primary without editing each page
        blue: {
          50: '#f7f5f2',
          100: '#efeae4',
          200: '#e0d6cb',
          300: '#c9b8a5',
          400: '#8a8a8a',
          500: '#1a1a1a',
          600: '#1a1a1a',
          700: '#3a3a3a',
          800: '#000000',
          900: '#000000'
        }
      },
      borderRadius: {
        DEFAULT: '2px',
        md: '2px',
        lg: '2px',
        xl: '4px'
      },
      letterSpacing: {
        label: '0.2em'
      },
      aspectRatio: {
        portrait: '3 / 4'
      }
    }
  },
  plugins: []
};
