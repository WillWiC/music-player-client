module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#000000',
          secondary: '#111111',
          tertiary: '#1a1a1a',
          accent: '#2d2d2d',
        },
        spotify: {
          green: '#1db954',
          'green-light': '#1ed760',
          'green-dark': '#169c46',
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'slideDown': 'slideDown 0.3s ease-out forwards',
        'pulse-gentle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideDown: {
          from: {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [],
};
