import React, { createContext, useContext, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleDarkMode, setDarkMode } from "@/store/slices/appSlice";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
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
  const isDarkMode = useAppSelector((state) => state.app.isDarkMode);

  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
  };

  const handleSetDarkMode = (isDark: boolean) => {
    dispatch(setDarkMode(isDark));
  };

  // Apply dark mode class to document root when mode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const value: ThemeContextType = {
    isDarkMode,
    toggleDarkMode: handleToggleDarkMode,
    setDarkMode: handleSetDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
