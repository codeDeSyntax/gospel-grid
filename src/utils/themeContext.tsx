import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemeType, THEMES, DEFAULT_THEME } from "./themeConfig";

interface ThemeContextType {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  themeColors: (typeof THEMES)[ThemeType];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    // Try to load theme from localStorage
    try {
      const savedTheme = localStorage.getItem("streamspire-theme") as ThemeType;
      return savedTheme && THEMES[savedTheme] ? savedTheme : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  const setTheme = (theme: ThemeType) => {
    setCurrentTheme(theme);
    try {
      localStorage.setItem("streamspire-theme", theme);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }
  };

  // Apply CSS custom properties when theme changes
  useEffect(() => {
    const theme = THEMES[currentTheme];
    const root = document.documentElement;

    // Set primary color variables
    Object.entries(theme.primary).forEach(([shade, color]) => {
      root.style.setProperty(`--color-primary-${shade}`, color);
    });

    // Set accent color variables
    Object.entries(theme.accent).forEach(([variant, color]) => {
      root.style.setProperty(`--color-accent-${variant}`, color);
    });

    // Set mesh color variables
    Object.entries(theme.mesh).forEach(([variant, color]) => {
      root.style.setProperty(`--color-mesh-${variant}`, color);
    });

    // Set gradient color variables
    Object.entries(theme.gradient).forEach(([position, color]) => {
      root.style.setProperty(`--color-gradient-${position}`, color);
    });

    // Set theme name for conditional styling
    root.style.setProperty("--current-theme", currentTheme);

    // Add theme class to body for CSS-based theme switching
    document.body.className = document.body.className.replace(/theme-\w+/g, "");
    document.body.classList.add(`theme-${currentTheme}`);
  }, [currentTheme]);

  const value: ThemeContextType = {
    currentTheme,
    setTheme,
    themeColors: THEMES[currentTheme],
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
