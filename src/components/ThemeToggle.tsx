import React from "react";
import { useTheme } from "../utils/theme";

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
  const { theme, appliedTheme, setTheme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
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

      <div className="flex items-center bg-surface-secondary rounded-lg p-1 border border-border-primary">
        {/* Light Mode Button */}
        <button
          onClick={() => setTheme("light")}
          className={`
            ${buttonSizeClasses[size]} rounded-md transition-all duration-200
            ${
              appliedTheme === "light"
                ? "bg-primary-600 text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            }
          `}
          title="Light mode"
        >
          <svg
            className={sizeClasses[size]}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </button>

        {/* Dark Mode Button */}
        <button
          onClick={() => setTheme("dark")}
          className={`
            ${buttonSizeClasses[size]} rounded-md transition-all duration-200
            ${
              appliedTheme === "dark"
                ? "bg-primary-600 text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            }
          `}
          title="Dark mode"
        >
          <svg
            className={sizeClasses[size]}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        </button>

        {/* System Mode Button */}
        <button
          onClick={() => setTheme("system")}
          className={`
            ${buttonSizeClasses[size]} rounded-md transition-all duration-200
            ${
              theme === "system"
                ? "bg-primary-600 text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            }
          `}
          title="System theme"
        >
          <svg
            className={sizeClasses[size]}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Simple icon-only toggle button
export const SimpleThemeToggle: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { appliedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg transition-all duration-200
        bg-surface-secondary hover:bg-surface-hover 
        border border-border-primary
        text-text-secondary hover:text-text-primary
        ${className}
      `}
      title={`Switch to ${appliedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {appliedTheme === "dark" ? (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
};
