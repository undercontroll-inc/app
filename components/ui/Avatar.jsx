import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import Text from "./Text";
import { colors } from "../../theme";

export function initials(name) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export default function Avatar({ name, uri, size = 44, tone = "navy" }) {
  const background = tone === "brand" ? colors.orange : tone === "orange" ? colors.orangeSoft : colors.surfaceMuted;
  const color = tone === "brand" ? "#ffffff" : tone === "orange" ? colors.orange : colors.navy;
  return (
    <View style={[styles.root, { backgroundColor: background, borderRadius: size / 2, height: size, width: size }]}>
      {uri ? (
        <Image contentFit="cover" source={{ uri }} style={StyleSheet.absoluteFill} />
      ) : (
        <Text style={{ color, fontSize: size * 0.38 }} weight="700">
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
});
