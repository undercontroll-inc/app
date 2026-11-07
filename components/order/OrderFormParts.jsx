import { Pressable, StyleSheet, View } from "react-native";
import FieldBase from "../ui/Field";
import FormCard from "../ui/FormCard";
import Icon from "../ui/Icon";
import Text from "../ui/Text";
import { colors } from "../../theme";

export function Section({ title, action, onAction, children, highlight }) {
  return (
    <FormCard
      action={
        action ? (
          <Pressable
            accessibilityLabel={`${action} em ${title}`}
            accessibilityRole="button"
            onPress={onAction}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Icon color={colors.orange} name="plus" size={16} weight="bold" />
            <Text tone="accent" variant="subhead" weight="700">
              {action}
            </Text>
          </Pressable>
        ) : null
      }
      highlight={highlight}
      title={title}
    >
      {children}
    </FormCard>
  );
}

export function Field(props) {
  return <FieldBase {...props} />;
}

export function Summary({ label, value, total, red }) {
  return (
    <View style={styles.summary}>
      <Text tone={total ? "default" : "muted"} variant={total ? "headline" : "subhead"} weight={total ? "700" : "600"}>
        {label}
      </Text>
      <Text style={styles.value} tone={red ? "danger" : "default"} variant={total ? "title2" : "callout"} weight="700">
        {value}
      </Text>
    </View>
  );
}

export const formStyles = StyleSheet.create({
  pressed: { opacity: 0.72 },
});

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    backgroundColor: colors.orangeSoft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
  },
  summary: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 28 },
  value: { fontVariant: ["tabular-nums"] },
  pressed: { opacity: 0.72 },
});
