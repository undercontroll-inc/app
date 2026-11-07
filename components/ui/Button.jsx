import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Icon from "./Icon";
import Text from "./Text";
import { colors, radius, touch } from "../../theme";

const VARIANTS = {
  primary: { bg: colors.orange, fg: "#ffffff" },
  secondary: { bg: colors.surface, fg: colors.navy, border: colors.border },
  tinted: { bg: colors.orangeSoft, fg: colors.orange },
  plain: { bg: "transparent", fg: colors.orange },
  destructive: { bg: colors.dangerSoft, fg: colors.danger },
};

export default function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  disabled,
  loading,
  icon,
  style,
  testID,
  accessibilityLabel,
}) {
  const palette = VARIANTS[variant] ?? VARIANTS.primary;
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ busy: Boolean(loading), disabled: Boolean(inactive) }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, minHeight: size === "lg" ? touch.large : touch.min },
        palette.border && { borderColor: palette.border, borderWidth: 1.5 },
        disabled && !loading && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Icon
              color={palette.fg}
              feather={icon.feather}
              name={typeof icon === "string" ? icon : undefined}
              sf={icon.sf}
              size={20}
            />
          ) : null}
          <Text style={{ color: palette.fg }} variant="headline">
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", borderRadius: radius.pill, justifyContent: "center", paddingHorizontal: 22 },
  content: { alignItems: "center", flexDirection: "row", gap: 8 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
});
