export type ThemeType =
  | "grayscale"
  | "royal-purple"
  | "sky-blue"
  | "forest-green"
  | "vibrant-green"
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
    100: "#b0b0b0",
    200: "#6a6865",
    300: "#5a5856",
    400: "#3a3a3a",
    500: "#2a2a2a",
    600: "#1f1f1f",
    700: "#1c1c1c",
    800: "#1d1d1d",
    900: "#141414",
  }),
  "royal-purple": buildTheme("royal-purple", "Royal Purple", {
    50: "#e0d5e8",
    100: "#c4b5d0",
    200: "#5a4466",
    300: "#3d2d4a",
    400: "#2d1f3d",
    500: "#1a1424",
    600: "#110c18",
    700: "#2d1f3d",
    800: "#1a1424",
    900: "#110c18",
  }),
  "sky-blue": buildTheme("sky-blue", "Sky Blue", {
    50: "#d4e8f5",
    100: "#a8c8e0",
    200: "#72a8d4",
    300: "#4a6b85",
    400: "#3d5a70",
    500: "#2d4a5a",
    600: "#1f3a4a",
    700: "#152838",
    800: "#1a2838",
    900: "#0f1820",
  }),
  "forest-green": buildTheme("forest-green", "Forest Green", {
    50: "#d9e5d5",
    100: "#b5d4b5",
    200: "#4a6b44",
    300: "#334a2d",
    400: "#2a3d1f",
    500: "#1a2414",
    600: "#0f160c",
    700: "#2a3d1f",
    800: "#1a2414",
    900: "#0f160c",
  }),
  "vibrant-green": buildTheme("vibrant-green", "Vibrant Green", {
    50: "#b2ddbc",
    100: "#b2ddbc",
    200: "#b2ddbc",
    300: "#12c92b",
    400: "#12c92b",
    500: "#017828",
    600: "#017828",
    700: "#017828",
    800: "#071b07",
    900: "#071b07",
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
    800: "#450a0a",
    900: "#450a0a",
  }),
};

export const DEFAULT_THEME: ThemeType = "grayscale";
