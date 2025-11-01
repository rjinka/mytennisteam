import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",
    "./*.js", // Scan all JS files in the frontend root
  ],
  theme: {
    extend: {
      colors: {
        // Material Blue palette
        'primary': '#1976D2', // Blue 700
        'primary-dark': '#1565C0', // Blue 800
        'primary-light': '#BBDEFB', // Blue 100
        'primary-lighter': '#E3F2FD', // Blue 50
        // Material Green palette
        'success-bg': '#E8F5E9', // Green 50
        'success-text': '#1B5E20', // Green 900
        // Material Red palette
        'danger-bg': '#FFEBEE', // Red 50
        'danger-text': '#B71C1C', // Red 900
        // Material Grey palette
        'gray-light': '#f5f5f5',
        'gray-medium': '#e0e0e0',
        'gray-dark': '#757575',
      }
    },
  },
  plugins: [
    forms,
  ],
}
