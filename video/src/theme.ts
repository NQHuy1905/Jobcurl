import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";

// Same type pairing as the app: geometric sans + one serif-italic accent word.
export const outfit = loadOutfit("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily;
export const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] }).fontFamily;

export const C = {
  bg: "#F7F1E8",
  surface: "#FFFFFF",
  surface2: "#F3EDE2",
  ink: "#141414",
  text: "#1B1B1B",
  muted: "#5E5A53",
  line: "rgba(20,20,20,0.10)",
  orange: "#FF7A1A",
  teal: "#00A38D",
  pink: "#FF4F8B",
  indigo: "#3D5AFE",
  yellow: "#FFC93C",
  green: "#22B573",
  successFg: "#0F7B4B",
  successBg: "#D8F5E6",
  dark: "#121212",
  darkRow: "#1C1C1F",
  onDark: "#F5F2EC",
  onDarkMuted: "#B3ADA3",
};

export const shadow = "0 24px 60px rgba(20,20,20,0.16), 0 4px 12px rgba(20,20,20,0.06)";
