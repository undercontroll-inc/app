import { StyleSheet, View } from "react-native";
import Text from "./Text";
import { colors, radius } from "../../theme";

export default function FormCard({ title, subtitle, action, children, highlight, style }) {
  return (
    <View style={[styles.card, highlight && styles.highlight, style]}>
      {title || action ? (
        <View style={styles.header}>
          <View style={styles.titles}>
            {title ? <Text variant="headline">{title}</Text> : null}
            {subtitle ? (
              <Text tone="muted" variant="subhead">
                {subtitle}
              </Text>
            ) : null}
          </View>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function FieldRow({ children }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, gap: 16, padding: 16 },
  highlight: { borderColor: colors.orange, borderWidth: 1.5 },
  header: { alignItems: "center", flexDirection: "row", gap: 12, justifyContent: "space-between" },
  titles: { flex: 1, gap: 2 },
  row: { flexDirection: "row", gap: 12 },
});
