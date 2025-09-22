export type ThemeType =
  | "cosmic-blue"
  | "matrix-green"
  | "fire-red"
  | "steel-gray"
  | "earth-brown";

export interface ThemeColors {
  name: string;
  displayName: string;
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  accent: {
    light: string;
    main: string;
    dark: string;
  };
  mesh: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
  };
  gradient: {
    start: string;
    middle: string;
    end: string;
  };
}

export const THEMES: Record<ThemeType, ThemeColors> = {
  "cosmic-blue": {
    name: "cosmic-blue",
    displayName: "Cosmic Blue",
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6", // Main blue
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },
    accent: {
      light: "#7dd3fc", // sky-300
      main: "#0ea5e9", // sky-500
      dark: "#0284c7", // sky-600
    },
    mesh: {
      primary: "rgba(59, 130, 246, 0.6)", // blue-500
      secondary: "rgba(96, 165, 250, 0.4)", // blue-400
      tertiary: "rgba(147, 197, 253, 0.3)", // blue-300
      quaternary: "rgba(191, 219, 254, 0.2)", // blue-200
    },
    gradient: {
      start: "#3b82f6", // blue-500
      middle: "#60a5fa", // blue-400
      end: "#93c5fd", // blue-300
    },
  },

  "matrix-green": {
    name: "matrix-green",
    displayName: "Matrix Green",
    primary: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e", // Main green
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
    },
    accent: {
      light: "#6ee7b7", // emerald-300
      main: "#10b981", // emerald-500
      dark: "#059669", // emerald-600
    },
    mesh: {
      primary: "rgba(34, 197, 94, 0.6)", // green-500
      secondary: "rgba(74, 222, 128, 0.4)", // green-400
      tertiary: "rgba(134, 239, 172, 0.3)", // green-300
      quaternary: "rgba(187, 247, 208, 0.2)", // green-200
    },
    gradient: {
      start: "#22c55e", // green-500
      middle: "#4ade80", // green-400
      end: "#86efac", // green-300
    },
  },

  "fire-red": {
    name: "fire-red",
    displayName: "Fire Red",
    primary: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444", // Main red
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
    },
    accent: {
      light: "#fca5a5", // red-300
      main: "#dc2626", // red-600
      dark: "#b91c1c", // red-700
    },
    mesh: {
      primary: "rgba(239, 68, 68, 0.6)", // red-500
      secondary: "rgba(248, 113, 113, 0.4)", // red-400
      tertiary: "rgba(252, 165, 165, 0.3)", // red-300
      quaternary: "rgba(254, 202, 202, 0.2)", // red-200
    },
    gradient: {
      start: "#ef4444", // red-500
      middle: "#f87171", // red-400
      end: "#fca5a5", // red-300
    },
  },

  "steel-gray": {
    name: "steel-gray",
    displayName: "Steel Gray",
    primary: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b", // Main gray
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    accent: {
      light: "#cbd5e1", // slate-300
      main: "#475569", // slate-600
      dark: "#334155", // slate-700
    },
    mesh: {
      primary: "rgba(100, 116, 139, 0.6)", // slate-500
      secondary: "rgba(148, 163, 184, 0.4)", // slate-400
      tertiary: "rgba(203, 213, 225, 0.3)", // slate-300
      quaternary: "rgba(226, 232, 240, 0.2)", // slate-200
    },
    gradient: {
      start: "#64748b", // slate-500
      middle: "#94a3b8", // slate-400
      end: "#cbd5e1", // slate-300
    },
  },

  "earth-brown": {
    name: "earth-brown",
    displayName: "Earth Brown",
    primary: {
      50: "#fefdf8",
      100: "#fefbeb",
      200: "#fef3c7",
      300: "#fde68a",
      400: "#facc15",
      500: "#a16207", // Main brown
      600: "#92400e",
      700: "#78350f",
      800: "#451a03",
      900: "#362006",
    },
    accent: {
      light: "#fbbf24", // amber-400
      main: "#f59e0b", // amber-500
      dark: "#d97706", // amber-600
    },
    mesh: {
      primary: "rgba(161, 98, 7, 0.6)", // amber-700
      secondary: "rgba(245, 158, 11, 0.4)", // amber-500
      tertiary: "rgba(251, 191, 36, 0.3)", // amber-400
      quaternary: "rgba(254, 215, 170, 0.2)", // amber-200
    },
    gradient: {
      start: "#a16207", // amber-700
      middle: "#f59e0b", // amber-500
      end: "#fbbf24", // amber-400
    },
  },
};

export const DEFAULT_THEME: ThemeType = "cosmic-blue";
