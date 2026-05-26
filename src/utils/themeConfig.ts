export type ThemeType =
  | "grayscale"
  | "royal-purple"
  | "sky-blue"
  | "forest-green"
  | "fire-red";

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

const buildTheme = (
  name: ThemeType,
  displayName: string,
  primary: ThemeColors["primary"],
): ThemeColors => {
  const accent = {
    light: primary[300],
    main: primary[500],
    dark: primary[900],
  };

  return {
    name,
    displayName,
    primary,
    accent,
    mesh: {
      primary: `rgba(${hexToRgb(primary[300])}, 0.6)`,
      secondary: `rgba(${hexToRgb(primary[500])}, 0.4)`,
      tertiary: `rgba(${hexToRgb(primary[50])}, 0.3)`,
      quaternary: `rgba(${hexToRgb(primary[50])}, 0.2)`,
    },
    gradient: {
      start: primary[500],
      middle: primary[300],
      end: primary[50],
    },
  };
};

function hexToRgb(hex: string): string {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `${red}, ${green}, ${blue}`;
}

export const THEMES: Record<ThemeType, ThemeColors> = {
  grayscale: buildTheme("grayscale", "Grayscale", {
    50: "#e5e5e5",
    100: "#e5e5e5",
    200: "#e5e5e5",
    300: "#737373",
    400: "#737373",
    500: "#404040",
    600: "#404040",
    700: "#404040",
    800: "#242424",
    900: "#1f1f1f",
  }),
  "royal-purple": buildTheme("royal-purple", "Royal Purple", {
    50: "#e9d5ff",
    100: "#e9d5ff",
    200: "#e9d5ff",
    300: "#a855f7",
    400: "#a855f7",
    500: "#7e22ce",
    600: "#7e22ce",
    700: "#7e22ce",
    800: "#25113a",
    900: "#200f33",
  }),
  "sky-blue": buildTheme("sky-blue", "Sky Blue", {
    50: "#bae6fd",
    100: "#bae6fd",
    200: "#bae6fd",
    300: "#0ea5e9",
    400: "#0ea5e9",
    500: "#0369a1",
    600: "#0369a1",
    700: "#0369a1",
    800: "#073247",
    900: "#062b3d",
  }),
  "forest-green": buildTheme("forest-green", "Forest Green", {
    50: "#bbf7d0",
    100: "#bbf7d0",
    200: "#bbf7d0",
    300: "#22c55e",
    400: "#22c55e",
    500: "#15803d",
    600: "#15803d",
    700: "#15803d",
    800: "#0b3d20",
    900: "#08351b",
  }),
  "fire-red": buildTheme("fire-red", "Fire Red", {
    50: "#fecaca",
    100: "#fecaca",
    200: "#fecaca",
    300: "#f87171",
    400: "#f87171",
    500: "#dc2626",
    600: "#dc2626",
    700: "#dc2626",
    800: "#3d0b0b",
    900: "#350909",
  }),
};

export const DEFAULT_THEME: ThemeType = "grayscale";
