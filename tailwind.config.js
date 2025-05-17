module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary-color)',
          hover: 'var(--primary-hover)',
        },
        secondary: {
          DEFAULT: 'var(--secondary-color)',
          hover: 'var(--secondary-hover)',
        },
        danger: {
          DEFAULT: 'var(--danger-color)',
          hover: 'var(--danger-hover)',
        },
        success: 'var(--success-color)',
        warning: 'var(--warning-color)',
        text: {
          DEFAULT: 'var(--text-color)',
          light: 'var(--text-light)',
        },
        background: 'var(--bg-color)',
        card: 'var(--card-bg)',
        border: 'var(--border-color)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      spacing: {
        'header': 'var(--header-height)',
        'sidebar': 'var(--sidebar-width)',
      },
    },
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
    },
  },
  plugins: [],
}
