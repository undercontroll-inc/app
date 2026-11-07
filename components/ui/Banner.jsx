import { Pressable, StyleSheet, View } from "react-native";
import Icon from "./Icon";
import Text from "./Text";
import { colors, radius } from "../../theme";

const TONES = {
  warning: { bg: colors.warningSoft, fg: colors.warning, icon: "alert" },
  success: { bg: colors.successSoft, fg: colors.success, sf: "checkmark.seal.fill", feather: "check-circle" },
  info: { bg: colors.orangeSoft, fg: colors.orange, icon: "info" },
  neutral: { bg: colors.surfaceMuted, fg: colors.muted, icon: "info" },
  danger: { bg: colors.dangerSoft, fg: colors.danger, sf: "xmark.octagon.fill", feather: "x-octagon" },
};

export default function Banner({ tone = "warning", title, message, actionLabel, onAction, icon, style }) {
  const palette = TONES[tone] ?? TONES.warning;
  return (
    <View style={[styles.root, { backgroundColor: palette.bg }, style]}>
      <Icon
        color={palette.fg}
        feather={icon?.feather ?? palette.feather}
        name={icon?.sf ? undefined : palette.icon}
        sf={icon?.sf ?? palette.sf}
        size={20}
      />
      <View style={styles.body}>
        {title ? (
          <Text style={{ color: palette.fg }} variant="subhead" weight="700">
            {title}
          </Text>
        ) : null}
        {message ? (
          <Text tone="muted" variant="subhead">
            {message}
          </Text>
        ) : null}
        {actionLabel ? (
          <Pressable hitSlop={10} onPress={onAction} style={styles.action}>
            <Text style={{ color: palette.fg }} variant="subhead" weight="700">
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: radius.card, flexDirection: "row", gap: 12, padding: 16 },
  body: { flex: 1, gap: 4 },
  action: { marginTop: 4, minHeight: 32, justifyContent: "center" },
});
