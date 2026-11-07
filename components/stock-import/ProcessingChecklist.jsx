import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import Icon from "../Icon";
import { colors } from "./theme";

export default function ProcessingChecklist({ steps, activeIndex, done }) {
  return (
    <View style={styles.root}>
      {steps.map((label, index) => {
        const complete = done || index < activeIndex;
        const active = !done && index === activeIndex;
        return (
          <View key={label} style={styles.row}>
            <View style={styles.iconSlot}>
              {complete ? (
                <Animated.View entering={FadeIn.duration(220)}>
                  <Icon color={colors.success} feather="check-circle" sf="checkmark.circle.fill" size={20} />
                </Animated.View>
              ) : active ? (
                <ActivityIndicator color={colors.orange} size="small" />
              ) : (
                <View style={styles.pending} />
              )}
            </View>
            <Text style={[styles.label, active && styles.labelActive, !complete && !active && styles.labelPending]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  row: { alignItems: "center", flexDirection: "row", gap: 12 },
  iconSlot: { alignItems: "center", height: 22, justifyContent: "center", width: 22 },
  pending: { borderColor: colors.border, borderRadius: 9, borderWidth: 2, height: 18, width: 18 },
  label: { color: colors.navy, fontSize: 15 },
  labelActive: { fontWeight: "700" },
  labelPending: { color: colors.subtle },
});
