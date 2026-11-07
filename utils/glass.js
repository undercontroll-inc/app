import { Platform } from "react-native";
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";

let cached = null;

export function canUseGlass() {
  if (cached != null) return cached;
  try {
    cached = Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  } catch {
    cached = false;
  }
  return cached;
}
