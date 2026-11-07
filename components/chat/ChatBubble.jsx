import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "../../theme";

export const BUBBLE_COLORS = {
  user: colors.orange,
  assistant: "#e8edf4",
  error: colors.dangerSoft,
};

function Tail({ side, color }) {
  const path =
    side === "right" ? "M0 0 C0 9 4 15 13 17 C6 18 0 16 -4 12 Z" : "M13 0 C13 9 9 15 0 17 C7 18 13 16 17 12 Z";
  return (
    <Svg
      height={18}
      pointerEvents="none"
      style={side === "right" ? styles.tailRight : styles.tailLeft}
      viewBox={side === "right" ? "-4 0 17 18" : "0 0 17 18"}
      width={17}
    >
      <Path d={path} fill={color} />
    </Svg>
  );
}

export default function ChatBubble({ side, tone, children, onLongPress, accessibilityLabel, wide, grouped }) {
  const color = BUBBLE_COLORS[tone] ?? BUBBLE_COLORS.assistant;
  return (
    <View style={[styles.row, grouped && styles.rowGrouped, side === "right" ? styles.rowRight : styles.rowLeft]}>
      <Pressable
        accessibilityHint="Segure para copiar ou compartilhar"
        accessibilityLabel={accessibilityLabel}
        delayLongPress={300}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.pressable, wide && styles.wide, pressed && onLongPress && styles.pressed]}
      >
        <View style={[styles.bubble, { backgroundColor: color }]}>{children}</View>
        {grouped ? null : <Tail color={color} side={side} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 12, width: "100%" },
  rowGrouped: { marginBottom: 3 },
  rowRight: { alignItems: "flex-end", paddingLeft: 56 },
  rowLeft: { alignItems: "flex-start", paddingRight: 40 },
  pressable: { maxWidth: "88%" },
  wide: { maxWidth: "100%" },
  bubble: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 11 },
  tailRight: { bottom: -1, position: "absolute", right: -5 },
  tailLeft: { bottom: -1, left: -5, position: "absolute" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
