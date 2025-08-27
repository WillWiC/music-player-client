module.exports = {
  plugins: [
    // Use the new PostCSS wrapper package for Tailwind
    require('@tailwindcss/postcss')(),
    require('autoprefixer')(),
  ],
};
