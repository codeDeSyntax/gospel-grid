/**
 * Theme utility functions for managing light/dark mode
 */

export type Theme = "light" | "dark" | "system";

export class ThemeManager {
  private static STORAGE_KEY = "WindowAggregate-theme";

  /**
   * Get the current theme from localStorage or default to 'system'
   */
  static getTheme(): Theme {
    if (typeof window === "undefined") return "system";

    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme;
    return stored || "system";
  }

  /**
   * Set and apply a theme
   */
  static setTheme(theme: Theme): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(this.STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  /**
   * Apply theme to document
   */
  static applyTheme(theme: Theme): void {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    if (theme === "system") {
      // Use system preference
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      root.classList.add(systemDark ? "dark" : "light");
    } else {
      // Use explicit theme
      root.classList.add(theme);
    }
  }

  /**
   * Toggle between light and dark (ignores system)
   */
  static toggle(): Theme {
    const current = this.getTheme();
    const newTheme: Theme = current === "dark" ? "light" : "dark";
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Initialize theme on app start
   */
  static initialize(): void {
    const theme = this.getTheme();
    this.applyTheme(theme);

    // Listen for system theme changes
    if (typeof window !== "undefined") {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
          const currentTheme = this.getTheme();
          if (currentTheme === "system") {
            this.applyTheme("system");
          }
        });
    }
  }

  /**
   * Get the actual applied theme (resolves 'system' to 'light' or 'dark')
   */
  static getAppliedTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "dark";

    const theme = this.getTheme();
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  }

  /**
   * Check if current theme is dark
   */
  static isDark(): boolean {
    return this.getAppliedTheme() === "dark";
  }

  /**
   * Check if current theme is light
   */
  static isLight(): boolean {
    return this.getAppliedTheme() === "light";
  }
}

/**
 * React hook for theme management
 */
export function useTheme() {
  const [theme, setThemeState] = React.useState<Theme>(() =>
    ThemeManager.getTheme()
  );
  const [appliedTheme, setAppliedTheme] = React.useState<"light" | "dark">(() =>
    ThemeManager.getAppliedTheme()
  );

  const setTheme = React.useCallback((newTheme: Theme) => {
    ThemeManager.setTheme(newTheme);
    setThemeState(newTheme);
    setAppliedTheme(ThemeManager.getAppliedTheme());
  }, []);

  const toggleTheme = React.useCallback(() => {
    const newTheme = ThemeManager.toggle();
    setThemeState(newTheme);
    setAppliedTheme(ThemeManager.getAppliedTheme());
    return newTheme;
  }, []);

  React.useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        setAppliedTheme(ThemeManager.getAppliedTheme());
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return {
    theme,
    appliedTheme,
    setTheme,
    toggleTheme,
    isDark: appliedTheme === "dark",
    isLight: appliedTheme === "light",
  };
}

// Import React for the hook
import React from "react";
