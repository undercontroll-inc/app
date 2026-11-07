import { Platform } from "react-native";

export const colors = {
  navy: "#092542",
  navyDeep: "#061d2d",
  navyRaised: "#173857",
  onNavyMuted: "rgba(255,255,255,0.72)",
  orange: "#ef7f19",
  orangePressed: "#d96f10",
  orangeSoft: "#fff3e8",
  text: "#092542",
  muted: "#5f728d",
  subtle: "#9aaac0",
  border: "#dce4ee",
  hairline: "#e6ecf3",
  background: "#f4f7fb",
  surface: "#ffffff",
  surfaceMuted: "#eef2f7",
  success: "#16845b",
  successSoft: "#e7f6ef",
  warning: "#b9620d",
  warningSoft: "#fff4e5",
  info: "#2563eb",
  infoSoft: "#eaf1ff",
  danger: "#d71929",
  dangerSoft: "#fdecee",
  overlay: "rgba(6, 29, 45, 0.35)",
};

export const type = {
  largeTitle: { fontSize: 34, fontWeight: "700", lineHeight: 41 },
  title: { fontSize: 28, fontWeight: "700", lineHeight: 34 },
  title2: { fontSize: 22, fontWeight: "700", lineHeight: 28 },
  headline: { fontSize: 17, fontWeight: "600", lineHeight: 22 },
  body: { fontSize: 17, fontWeight: "400", lineHeight: 22 },
  callout: { fontSize: 16, fontWeight: "400", lineHeight: 21 },
  subhead: { fontSize: 15, fontWeight: "400", lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const radius = { sm: 8, control: 12, card: 16, sheet: 24, pill: 999 };

export const shadow = Platform.select({
  ios: {
    shadowColor: "#092542",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
  },
  default: { elevation: 2 },
});

export const shadowStrong = Platform.select({
  ios: {
    shadowColor: "#092542",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  default: { elevation: 8 },
});

export const touch = { min: 48, large: 56 };

export const MAX_FONT_SCALE = 1.6;
