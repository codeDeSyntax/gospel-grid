import { ColorTheme } from "@/store/slices/appSlice";

export class ThemeManager {
  private static readonly STORAGE_KEY = "streamspire-color-theme";

  /**
   * Initialize theme on app startup
   */
  static initialize() {
    // Load saved theme from localStorage
    const savedTheme = this.getSavedTheme();

    // Apply theme to document
    this.applyTheme(savedTheme);

    return savedTheme;
  }

  /**
   * Apply theme to document root
   */
  static applyTheme(theme: ColorTheme) {
    document.documentElement.setAttribute("data-color-theme", theme);
  }

  /**
   * Save theme to localStorage
   */
  static saveTheme(theme: ColorTheme) {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }
  }

  /**
   * Get saved theme from localStorage
   */
  static getSavedTheme(): ColorTheme {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) as ColorTheme;
      return saved || "cosmic-blue"; // Default fallback
    } catch (error) {
      console.warn("Failed to load theme from localStorage:", error);
      return "cosmic-blue"; // Default fallback
    }
  }

  /**
   * Get CSS custom property value for current theme
   */
  static getThemeVariable(variableName: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--theme-${variableName}`)
      .trim();
  }

  /**
   * Convert RGB values to rgba string with alpha
   */
  static rgba(rgbValues: string, alpha: number = 1): string {
    return `rgba(${rgbValues}, ${alpha})`;
  }
}
