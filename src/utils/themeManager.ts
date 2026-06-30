export type ColorThemeMode = "light" | "dark";

export class ThemeManager {
  static initialize(): ColorThemeMode {
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  }

  static applyTheme(theme: ColorThemeMode) {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }

  static saveTheme(theme: ColorThemeMode) {
    try {
      localStorage.setItem("wingrid-theme-mode", theme);
    } catch (error) {
      console.warn("Failed to save theme mode:", error);
    }
  }

  static getSavedTheme(): ColorThemeMode {
    try {
      return localStorage.getItem("wingrid-theme-mode") === "light"
        ? "light"
        : "dark";
    } catch (error) {
      console.warn("Failed to load theme mode:", error);
      return "dark";
    }
  }

  static getThemeVariable(variableName: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--theme-${variableName}`)
      .trim();
  }

  static rgba(rgbValues: string, alpha: number = 1): string {
    return `rgba(${rgbValues}, ${alpha})`;
  }
}
