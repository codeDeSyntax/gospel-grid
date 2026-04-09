import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemeType, THEMES, DEFAULT_THEME } from "./themeConfig";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setColorTheme } from "@/store/slices/appSlice";

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
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(
    (state) => state.app.colorTheme,
  ) as ThemeType;

  const setTheme = (theme: ThemeType) => {
    dispatch(setColorTheme(theme));
  };

  // Apply CSS custom properties when theme changes
  useEffect(() => {
    const theme = THEMES[currentTheme] ?? THEMES[DEFAULT_THEME];
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

    // Keep data attribute in sync for --theme-* variable selectors.
    root.setAttribute("data-color-theme", currentTheme);

    // Add theme class to body for CSS-based theme switching
    document.body.className = document.body.className.replace(
      /theme-[\w-]+/g,
      "",
    );
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
