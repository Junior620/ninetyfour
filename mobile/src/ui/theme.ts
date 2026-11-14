import { useColorScheme } from "react-native";

/** N91 MatchLab tokens, taken from src/app/matchlab/matchlab.css (web). */
const light = {
  bg: "#f5f7fa",
  surface: "#ffffff",
  surfaceMuted: "#eef2f7",
  surfaceAccent: "#edf3fa",
  text: "#172c48",
  textStrong: "#0f2745",
  textSecondary: "#4c607c",
  border: "#e0e6ee",
  accent: "#123d70",
  accentText: "#1b5291",
  onAccent: "#ffffff",
  navy: "#0f2745",
  gold: "#d6ad53",
  goldText: "#5d4a1f",
  goldSurface: "#fbf8f1",
  success: "#256c53",
  successSurface: "#eaf5ef",
  warning: "#8a5a00",
  warningSurface: "#fff6e0",
  danger: "#b42318",
  dangerSurface: "#fdecea",
  pitch: "#1f6b45",
  pitchLine: "#ffffff59",
};
export type Palette = typeof light;
const dark: Palette = {
  ...light,
  bg: "#081a35",
  surface: "#0f2745",
  surfaceMuted: "#12345b",
  surfaceAccent: "#12345b",
  text: "#e6eef8",
  textStrong: "#ffffff",
  textSecondary: "#c5dbf1",
  border: "#2e5b89",
  accent: "#9fc6f0",
  accentText: "#9fc6f0",
  onAccent: "#0f2745",
  goldSurface: "#2b2410",
  goldText: "#f3d892",
  successSurface: "#123828",
  success: "#7fd4ad",
  warningSurface: "#3a2a00",
  warning: "#f3c55c",
  dangerSurface: "#3d1410",
  danger: "#ffa094",
};
export function usePalette(): Palette {
  return useColorScheme() === "dark" ? dark : light;
}
export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };
export const radius = { s: 8, m: 12, l: 18, pill: 999 };
/** Field-side use: big touch targets (Apple HIG minimum is 44 pt). */
export const touch = 52;
