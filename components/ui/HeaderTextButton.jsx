import { Pressable } from "react-native";
import Text from "./Text";

export default function HeaderTextButton({ label, onPress, bold, disabled, testID, color, filled }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: filled ? "#ef7f19" : "transparent",
        borderRadius: 999,
        justifyContent: "center",
        minHeight: filled ? 40 : 44,
        opacity: pressed || disabled ? 0.4 : 1,
        paddingHorizontal: filled ? 18 : 0,
      })}
      testID={testID}
    >
      <Text tone={filled ? "inverse" : (color ?? "accent")} variant="body" weight={bold || filled ? "700" : "400"}>
        {label}
      </Text>
    </Pressable>
  );
}
