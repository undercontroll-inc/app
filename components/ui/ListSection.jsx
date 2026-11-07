import { Pressable, StyleSheet, View } from "react-native";
import Icon from "./Icon";
import Text from "./Text";
import { colors, radius } from "../../theme";

export default function ListSection({ title, tone, footer, children, style, action }) {
  return (
    <View style={[styles.root, style]}>
      {title || action ? (
        <View style={styles.header}>
          {title ? (
            <Text style={styles.title} tone={tone === "warning" ? "warning" : "muted"} variant="footnote" weight="600">
              {title}
            </Text>
          ) : (
            <View />
          )}
          {action}
        </View>
      ) : null}
      <View style={styles.card}>{children}</View>
      {footer ? (
        <Text style={styles.footer} tone="muted" variant="footnote">
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export function Row({ label, value, strong, valueTone, last }) {
  return (
    <View style={[styles.row, !last && styles.separator]}>
      <Text style={styles.rowLabel} tone="muted" variant="subhead">
        {label}
      </Text>
      <Text
        align="right"
        style={[styles.rowValue, { fontVariant: ["tabular-nums"] }]}
        tone={valueTone === "success" ? "success" : "default"}
        variant={strong ? "headline" : "subhead"}
        weight={strong ? "700" : "600"}
      >
        {value}
      </Text>
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  onPressIn,
  onLongPress,
  last,
  chevron = true,
  testID,
  titleLines = 2,
  subtitleLines = 2,
}) {
  const body = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={[styles.listBody, !last && styles.separator]}>
        <View style={styles.listText}>
          <Text numberOfLines={titleLines} variant="body" weight="600">
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={subtitleLines} tone="muted" variant="subhead">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {trailing}
        {onPress && chevron ? <Icon color={colors.subtle} name="chevronRight" size={14} /> : null}
      </View>
    </>
  );
  if (!onPress && !onLongPress) return <View style={styles.listRow}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      delayLongPress={350}
      onLongPress={onLongPress}
      onPress={onPress}
      onPressIn={onPressIn}
      style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}
      testID={testID}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  title: { letterSpacing: 0.3, textTransform: "uppercase" },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, overflow: "hidden" },
  footer: { paddingHorizontal: 4 },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginLeft: 16,
    minHeight: 52,
    paddingRight: 16,
    paddingVertical: 12,
  },
  separator: { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLabel: { flexShrink: 1 },
  rowValue: { flexShrink: 1 },
  listRow: { alignItems: "stretch", flexDirection: "row", paddingLeft: 16 },
  leading: { justifyContent: "center", paddingRight: 12 },
  listBody: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 64,
    paddingRight: 16,
    paddingVertical: 12,
  },
  listText: { flex: 1, gap: 2 },
  pressed: { backgroundColor: colors.surfaceMuted },
});
