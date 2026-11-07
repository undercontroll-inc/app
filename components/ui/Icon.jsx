import Feather from "@expo/vector-icons/Feather";
import { Platform } from "react-native";
import { SymbolView } from "expo-symbols";
import { colors } from "../../theme";
import { ICONS } from "./icons";

export default function Icon({
  name,
  sf,
  feather,
  size = 20,
  color = colors.text,
  weight = "semibold",
  style,
  animationSpec,
}) {
  const mapped = name ? ICONS[name] : null;
  const symbol = sf ?? mapped?.sf;
  const fallbackName = feather ?? mapped?.feather ?? "circle";
  const fallback = <Feather color={color} name={fallbackName} size={size} style={style} />;
  if (Platform.OS !== "ios" || !symbol) return fallback;
  return (
    <SymbolView
      animationSpec={animationSpec}
      fallback={fallback}
      name={symbol}
      size={size}
      style={[{ height: size, width: size }, style]}
      tintColor={color}
      weight={weight}
    />
  );
}
