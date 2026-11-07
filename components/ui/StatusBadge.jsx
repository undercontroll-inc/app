import { StyleSheet, View } from "react-native";
import Text from "./Text";

export default function StatusBadge({ label, color, background }) {
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text numberOfLines={1} style={{ color }} variant="footnote" weight="700">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: { borderRadius: 4, height: 8, width: 8 },
});
