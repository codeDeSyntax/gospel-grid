/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic colors that work with both light and dark themes
        background: {
          primary: "rgb(var(--color-bg-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-bg-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--color-bg-tertiary) / <alpha-value>)",
          elevated: "rgb(var(--color-bg-elevated) / <alpha-value>)",
        },
        surface: {
          primary: "rgb(var(--color-surface-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-surface-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--color-surface-tertiary) / <alpha-value>)",
          hover: "rgb(var(--color-surface-hover) / <alpha-value>)",
          active: "rgb(var(--color-surface-active) / <alpha-value>)",
        },
        border: {
          primary: "rgb(var(--color-border-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-border-secondary) / <alpha-value>)",
          accent: "rgb(var(--color-border-accent) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--color-text-tertiary) / <alpha-value>)",
          accent: "rgb(var(--color-text-accent) / <alpha-value>)",
          inverse: "rgb(var(--color-text-inverse) / <alpha-value>)",
        },

        // Purple/Violet primary colors (theme-independent)
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "rgb(59, 130, 246)",
          600: "#2563eb", // Main primary color
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },

        // Status colors (theme-independent)
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#27ae60", // From prototype
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#e74c3c", // From prototype
          700: "#dc2626",
          800: "#b91c1c",
          900: "#991b1b",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#f39c12", // From prototype
          700: "#d97706",
          800: "#92400e",
          900: "#78350f",
        },
        info: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#4a9eff", // From prototype
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },

        // Legacy colors (keeping for backward compatibility)
        dark: {
          primary: "#1a1a1a",
          secondary: "#2d2d2d",
          tertiary: "#333333",
          border: "#444444",
          hover: "#404040",
        },
        accent: {
          blue: "#4a9eff",
          green: "#27ae60",
          red: "#e74c3c",
          orange: "#f39c12",
          purple: "#9b59b6",
        },

        // Dynamic theme colors using CSS custom properties
        "theme-primary": {
          50: "rgb(var(--theme-primary-50) / <alpha-value>)",
          100: "rgb(var(--theme-primary-100) / <alpha-value>)",
          200: "rgb(var(--theme-primary-200) / <alpha-value>)",
          300: "rgb(var(--theme-primary-300) / <alpha-value>)",
          400: "rgb(var(--theme-primary-400) / <alpha-value>)",
          500: "rgb(var(--theme-primary-500) / <alpha-value>)",
          600: "rgb(var(--theme-primary-600) / <alpha-value>)",
          700: "rgb(var(--theme-primary-700) / <alpha-value>)",
          800: "rgb(var(--theme-primary-800) / <alpha-value>)",
          900: "rgb(var(--theme-primary-900) / <alpha-value>)",
          950: "rgb(var(--theme-primary-950) / <alpha-value>)",
        },
        "theme-accent": {
          light: "rgb(var(--theme-accent-light) / <alpha-value>)",
          medium: "rgb(var(--theme-accent-medium) / <alpha-value>)",
          dark: "rgb(var(--theme-accent-dark) / <alpha-value>)",
        },
      },
      // Animation for smooth transitions
      animation: {
        "pulse-slow": "pulse 1.5s infinite",
        "scale-in": "scaleIn 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
      },
      keyframes: {
        scaleIn: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      // Grid template configurations for the dashboard
      gridTemplateColumns: {
        "dashboard-auto": "repeat(auto-fit, minmax(400px, 1fr))",
        "dashboard-2x2": "1fr 1fr",
        "dashboard-3x2": "1fr 1fr 1fr",
        "dashboard-focus": "2fr 1fr",
      },
      gridTemplateRows: {
        "dashboard-2x2": "1fr 1fr",
        "dashboard-3x2": "1fr 1fr",
        "dashboard-focus": "2fr 1fr",
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Roboto Mono",
          "monospace",
        ],
      },
      // Background gradients for mesh design
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mesh-gradient":
          "radial-gradient(ellipse at center, var(--tw-gradient-stops))",
      },
    },
  },
  darkMode: "class", // Enable class-based dark mode
  corePlugins: {
    preflight: false,
  },
  plugins: [
    function ({ addUtilities, addBase }) {
      // Add CSS custom properties for theme colors
      addBase({
        ":root": {
          // Light theme colors
          "--color-bg-primary": "96 165 250", // white
          "--color-bg-secondary": "96 165 250", // slate-50
          "--color-bg-tertiary": "241 245 249", // slate-100
          "--color-bg-elevated": "255 255 255", // white with shadow

          "--color-surface-primary": "255 255 255", // white
          "--color-surface-secondary": "248 250 252", // slate-50
          "--color-surface-tertiary": "241 245 249", // slate-100
          "--color-surface-hover": "226 232 240", // slate-200
          "--color-surface-active": "203 213 225", // slate-300

          "--color-border-primary": "226 232 240", // slate-200
          "--color-border-secondary": "203 213 225", // slate-300
          "--color-border-accent": "124 58 237", // primary-600

          "--color-text-primary": "15 23 42", // slate-900
          "--color-text-secondary": "71 85 105", // slate-600
          "--color-text-tertiary": "148 163 184", // slate-400
          "--color-text-accent": "124 58 237", // primary-600
          "--color-text-inverse": "255 255 255", // white
        },
        ".dark": {
          // Dark theme colors (from your prototype)
          "--color-bg-primary": "26 26 26", // #0c0c0c
          "--color-bg-secondary": "45 45 45", // #2d2d2d
          "--color-bg-tertiary": "51 51 51", // #333333
          "--color-bg-elevated": "45 45 45", // #2d2d2d with shadow

          "--color-surface-primary": "45 45 45", // #2d2d2d
          "--color-surface-secondary": "51 51 51", // #333333
          "--color-surface-tertiary": "64 64 64", // #404040
          "--color-surface-hover": "64 64 64", // #404040
          "--color-surface-active": "82 82 82", // #525252

          "--color-border-primary": "68 68 68", // #444444
          "--color-border-secondary": "82 82 82", // #525252
          "--color-border-accent": "124 58 237", // primary-600

          "--color-text-primary": "255 255 255", // white
          "--color-text-secondary": "170 170 170", // #aaaaaa
          "--color-text-tertiary": "102 102 102", // #666666
          "--color-text-accent": "74 158 255", // #4a9eff (blue from prototype)
          "--color-text-inverse": "15 23 42", // slate-900
        },
      });

      addUtilities({
        ".no-scrollbar": {
          "-ms-overflow-style": "none", // IE and Edge
          "scrollbar-width": "none", // Firefox
        },
        ".no-scrollbar::-webkit-scrollbar": {
          display: "none", // Chrome, Safari, Opera
        },
        ".thin-scrollbar": {
          "scrollbar-width": "thin",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgb(var(--color-border-accent))",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "rgb(var(--color-surface-secondary))",
          },
        },
        // Glass morphism effect that adapts to theme
        ".glass": {
          "backdrop-filter": "blur(10px)",
          background: "rgb(var(--color-surface-primary) / 0.8)",
          border: "1px solid rgb(var(--color-border-primary) / 0.5)",
        },
        ".glass-dark": {
          "backdrop-filter": "blur(10px)",
          background: "rgba(45, 45, 45, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        // Tile hover effects that work with both themes
        ".tile-hover": {
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "scale(1.02)",
            "box-shadow": "0 0 25px rgb(var(--color-border-accent) / 0.3)",
          },
        },
        // Theme-aware glow effects
        ".glow-primary": {
          "box-shadow": "0 0 20px rgb(var(--color-border-accent) / 0.5)",
        },
        ".glow-success": {
          "box-shadow": "0 0 20px rgba(39, 174, 96, 0.5)",
        },
        ".glow-danger": {
          "box-shadow": "0 0 20px rgba(231, 76, 60, 0.5)",
        },
        // Animation utilities
        ".animate-glow": {
          animation: "glow 2s ease-in-out infinite alternate",
        },
      });

      // Add glow animation keyframes
      addUtilities({
        "@keyframes glow": {
          "0%": {
            "box-shadow": "0 0 5px rgb(var(--color-border-accent) / 0.3)",
          },
          "100%": {
            "box-shadow": "0 0 20px rgb(var(--color-border-accent) / 0.8)",
          },
        },
      });
    },
  ],
  plugins: [],
};
