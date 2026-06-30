import React from "react";
import { useTheme } from "../utils/themeContext";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  size = "md",
  showLabel = false,
}) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const buttonSizeClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-2.5",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-text-secondary font-medium">Theme</span>
      )}

      <button
        onClick={toggleDarkMode}
        className={`
          ${buttonSizeClasses[size]} rounded-lg transition-all duration-200
          bg-surface-secondary border border-border-primary
          hover:bg-surface-hover active:bg-surface-active
          text-text-primary
        `}
        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? (
          <Sun className={sizeClasses[size]} />
        ) : (
          <Moon className={sizeClasses[size]} />
        )}
      </button>
    </div>
  );
};

// Simple icon-only toggle button
export const SimpleThemeToggle: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className={`
        p-2 rounded-lg transition-all duration-200
        bg-surface-secondary hover:bg-surface-hover 
        border border-border-primary
        text-text-secondary hover:text-text-primary
        ${className}
      `}
      title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
    >
      {isDarkMode ? <Sun /> : <Moon />}
    </button>
  );
};
