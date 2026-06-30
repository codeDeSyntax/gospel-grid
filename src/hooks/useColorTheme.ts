import { useAppSelector } from "@/store/hooks";
import { ThemeManager } from "@/utils/themeManager";
import type { ColorThemeMode } from "@/utils/themeManager";

/**
 * Hook for accessing current theme and theme utilities
 */
export const useColorTheme = () => {
  const isDarkMode = useAppSelector((state) => state.app.isDarkMode);
  const colorTheme: ColorThemeMode = isDarkMode ? "dark" : "light";

  const getThemeVariable = (variableName: string): string => {
    return ThemeManager.getThemeVariable(variableName);
  };

  const rgba = (rgbValues: string, alpha: number = 1): string => {
    return ThemeManager.rgba(rgbValues, alpha);
  };

  const getCurrentTheme = (): ColorThemeMode => {
    return colorTheme;
  };

  const getThemeClass = (base: string, shade: number = 500): string => {
    return `theme-${base}-${shade}`;
  };

  const getBgThemeClass = (shade: number = 500): string => {
    return `bg-theme-primary-${shade}`;
  };

  const getTextThemeClass = (shade: number = 500): string => {
    return `theme-primary-${shade}`;
  };

  const getBorderThemeClass = (shade: number = 400): string => {
    return `border-theme-primary-${shade}`;
  };

  return {
    colorTheme,
    getThemeVariable,
    rgba,
    getCurrentTheme,
    getThemeClass,
    getBgThemeClass,
    getTextThemeClass,
    getBorderThemeClass,
  };
};
