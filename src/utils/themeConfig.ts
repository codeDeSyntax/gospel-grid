export type ThemeType =
  | "cosmic-blue"
  | "matrix-green"
  | "fire-red"
  | "steel-gray"
  | "earth-brown"
  | "violet-purple"
  | "sunset-orange"
  | "midnight-black";

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
      50: "#bfdbfe",
      100: "#bfdbfe",
      200: "#bfdbfe",
      300: "#60a5fa",
      400: "#60a5fa",
      500: "#2563eb", // Main blue
      600: "#2563eb",
      700: "#2563eb",
      800: "#172554",
      900: "#172554",
    },
    accent: {
      light: "#60a5fa",
      main: "#2563eb",
      dark: "#172554",
    },
    mesh: {
      primary: "rgba(96, 165, 250, 0.6)",
      secondary: "rgba(37, 99, 235, 0.4)",
      tertiary: "rgba(191, 219, 254, 0.3)",
      quaternary: "rgba(191, 219, 254, 0.2)",
    },
    gradient: {
      start: "#2563eb",
      middle: "#60a5fa",
      end: "#bfdbfe",
    },
  },

  "matrix-green": {
    name: "matrix-green",
    displayName: "Matrix Green",
    primary: {
      50: "#b2ddbc",
      100: "#b2ddbc",
      200: "#b2ddbc",
      300: "#12c92b",
      400: "#12c92b",
      500: "#017828", // Main green
      600: "#017828",
      700: "#017828",
      800: "#071b07",
      900: "#071b07",
    },
    accent: {
      light: "#12c92b",
      main: "#017828",
      dark: "#071b07",
    },
    mesh: {
      primary: "rgba(18, 201, 43, 0.6)",
      secondary: "rgba(1, 120, 40, 0.4)",
      tertiary: "rgba(178, 221, 188, 0.3)",
      quaternary: "rgba(178, 221, 188, 0.2)",
    },
    gradient: {
      start: "#017828",
      middle: "#12c92b",
      end: "#b2ddbc",
    },
  },

  "fire-red": {
    name: "fire-red",
    displayName: "Fire Red",
    primary: {
      50: "#fecaca",
      100: "#fecaca",
      200: "#fecaca",
      300: "#f87171",
      400: "#f87171",
      500: "#dc2626", // Main red
      600: "#dc2626",
      700: "#dc2626",
      800: "#450a0a",
      900: "#450a0a",
    },
    accent: {
      light: "#f87171",
      main: "#dc2626",
      dark: "#450a0a",
    },
    mesh: {
      primary: "rgba(248, 113, 113, 0.6)",
      secondary: "rgba(220, 38, 38, 0.4)",
      tertiary: "rgba(254, 202, 202, 0.3)",
      quaternary: "rgba(254, 202, 202, 0.2)",
    },
    gradient: {
      start: "#dc2626",
      middle: "#f87171",
      end: "#fecaca",
    },
  },

  "steel-gray": {
    name: "steel-gray",
    displayName: "Steel Gray",
    primary: {
      50: "#e2e8f0",
      100: "#e2e8f0",
      200: "#e2e8f0",
      300: "#94a3b8",
      400: "#94a3b8",
      500: "#475569", // Main gray
      600: "#475569",
      700: "#475569",
      800: "#020617",
      900: "#020617",
    },
    accent: {
      light: "#94a3b8",
      main: "#475569",
      dark: "#020617",
    },
    mesh: {
      primary: "rgba(148, 163, 184, 0.6)",
      secondary: "rgba(71, 85, 105, 0.4)",
      tertiary: "rgba(226, 232, 240, 0.3)",
      quaternary: "rgba(226, 232, 240, 0.2)",
    },
    gradient: {
      start: "#475569",
      middle: "#94a3b8",
      end: "#e2e8f0",
    },
  },

  "earth-brown": {
    name: "earth-brown",
    displayName: "Earth Brown",
    primary: {
      50: "#e9d5b0",
      100: "#e9d5b0",
      200: "#e9d5b0",
      300: "#b48748",
      400: "#b48748",
      500: "#78572c", // Main brown
      600: "#78572c",
      700: "#78572c",
      800: "#25170f",
      900: "#25170f",
    },
    accent: {
      light: "#b48748",
      main: "#78572c",
      dark: "#25170f",
    },
    mesh: {
      primary: "rgba(180, 135, 72, 0.6)",
      secondary: "rgba(120, 87, 44, 0.4)",
      tertiary: "rgba(233, 213, 176, 0.3)",
      quaternary: "rgba(233, 213, 176, 0.2)",
    },
    gradient: {
      start: "#78572c",
      middle: "#b48748",
      end: "#e9d5b0",
    },
  },

  "violet-purple": {
    name: "violet-purple",
    displayName: "Violet Purple",
    primary: {
      50: "#f5d0fe",
      100: "#f5d0fe",
      200: "#f5d0fe",
      300: "#e879f9",
      400: "#e879f9",
      500: "#a855f7", // Main vibrant purple
      600: "#9333ea",
      700: "#7e22ce",
      800: "#3b0764",
      900: "#3b0764",
    },
    accent: {
      light: "#e879f9",
      main: "#a855f7",
      dark: "#3b0764",
    },
    mesh: {
      primary: "rgba(232, 121, 249, 0.6)",
      secondary: "rgba(168, 85, 247, 0.4)",
      tertiary: "rgba(245, 208, 254, 0.3)",
      quaternary: "rgba(245, 208, 254, 0.2)",
    },
    gradient: {
      start: "#a855f7",
      middle: "#e879f9",
      end: "#f5d0fe",
    },
  },

  "sunset-orange": {
    name: "sunset-orange",
    displayName: "Sunset Orange",
    primary: {
      50: "#ffedd5",
      100: "#ffedd5",
      200: "#ffedd5",
      300: "#fb923c",
      400: "#fb923c",
      500: "#f97316", // Main orange
      600: "#ea580c",
      700: "#c2410c",
      800: "#431407",
      900: "#431407",
    },
    accent: {
      light: "#fb923c",
      main: "#f97316",
      dark: "#431407",
    },
    mesh: {
      primary: "rgba(251, 146, 60, 0.6)",
      secondary: "rgba(249, 115, 22, 0.4)",
      tertiary: "rgba(255, 237, 213, 0.3)",
      quaternary: "rgba(255, 237, 213, 0.2)",
    },
    gradient: {
      start: "#f97316",
      middle: "#fb923c",
      end: "#ffedd5",
    },
  },

  "midnight-black": {
    name: "midnight-black",
    displayName: "Midnight Black",
    primary: {
      50: "#9ca3af",
      100: "#9ca3af",
      200: "#9ca3af",
      300: "#6b7280",
      400: "#6b7280",
      500: "#4b5563", // Main dark gray
      600: "#374151",
      700: "#1f2937",
      800: "#111827",
      900: "#030712",
    },
    accent: {
      light: "#6b7280",
      main: "#4b5563",
      dark: "#030712",
    },
    mesh: {
      primary: "rgba(107, 114, 128, 0.6)",
      secondary: "rgba(75, 85, 99, 0.4)",
      tertiary: "rgba(156, 163, 175, 0.3)",
      quaternary: "rgba(156, 163, 175, 0.2)",
    },
    gradient: {
      start: "#4b5563",
      middle: "#6b7280",
      end: "#9ca3af",
    },
  },
};

export const DEFAULT_THEME: ThemeType = "cosmic-blue";
