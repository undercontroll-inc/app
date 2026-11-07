import { colors } from "../theme";

export const nativeStackOptions = {
  contentStyle: { backgroundColor: colors.background },
  headerBackButtonDisplayMode: "minimal",
  headerLargeStyle: { backgroundColor: colors.navy },
  headerLargeTitleShadowVisible: false,
  headerLargeTitleStyle: { color: "#ffffff", fontWeight: "700" },
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.navy },
  headerTintColor: colors.orange,
  headerTitleStyle: { color: "#ffffff", fontWeight: "600" },
  scrollEdgeEffects: { top: "hidden" },
};

export const rootScreenOptions = {
  headerLargeTitle: true,
  headerTransparent: false,
};

export const modalScreenOptions = {
  presentation: "modal",
  headerLargeTitle: false,
};
