import { Pressable, StyleSheet, View } from "react-native";
import Icon from "./Icon";
import Text from "./Text";
import { colors, radius } from "../../theme";

export default function PickerField({ label, value, placeholder, onPress, disabled, icon = "chevronDown", testID }) {
  return (
    <View style={styles.root}>
      {label ? (
        <Text tone="muted" variant="subhead" weight="600">
          {label}
        </Text>
      ) : null}
      <Pressable
        accessibilityLabel={label ? `${label}: ${value || placeholder || ""}` : undefined}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.box, disabled && styles.disabled, pressed && styles.pressed]}
        testID={testID}
      >
        <Text numberOfLines={1} style={styles.value} tone={value ? "default" : "subtle"} variant="body">
          {value || placeholder}
        </Text>
        <Icon color={colors.muted} name={icon} size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  box: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  value: { flex: 1 },
  disabled: { backgroundColor: colors.surfaceMuted },
  pressed: { backgroundColor: colors.surfaceMuted },
});
