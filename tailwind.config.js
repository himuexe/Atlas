export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--rgb-canvas) / <alpha-value>)',
        surface: 'rgb(var(--rgb-surface) / <alpha-value>)',
        raised: 'rgb(var(--rgb-surface-raised) / <alpha-value>)',
        highlight: 'rgb(var(--rgb-surface-highlight) / <alpha-value>)',
        forest: 'rgb(var(--rgb-forest) / <alpha-value>)',
        signal: 'rgb(var(--rgb-signal) / <alpha-value>)',
        'signal-hover': 'rgb(var(--rgb-signal-hover) / <alpha-value>)',
        white: 'rgb(var(--rgb-text-primary) / <alpha-value>)',
        black: 'rgb(var(--rgb-canvas) / <alpha-value>)',
        zinc: {
          50: 'rgb(var(--rgb-text-primary) / <alpha-value>)',
          100: 'rgb(var(--rgb-text-primary) / <alpha-value>)',
          200: 'rgb(var(--rgb-text-primary) / <alpha-value>)',
          300: 'rgb(var(--rgb-text-secondary) / <alpha-value>)',
          400: 'rgb(var(--rgb-text-secondary) / <alpha-value>)',
          500: 'rgb(var(--rgb-text-muted) / <alpha-value>)',
          600: 'rgb(var(--rgb-text-subtle) / <alpha-value>)',
          700: 'rgb(var(--rgb-border-strong) / <alpha-value>)',
          800: 'rgb(var(--rgb-border-subtle) / <alpha-value>)',
          900: 'rgb(var(--rgb-canvas) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--radius-control)',
        xl: 'var(--radius-card)',
        '2xl': 'var(--radius-panel)',
        '3xl': 'var(--radius-panel)',
      },
    },
  },
  plugins: [],
};
