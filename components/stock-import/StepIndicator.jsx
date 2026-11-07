import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Text from "../ui/Text";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { IMPORT_STEPS } from "../../utils/stockImport";
import { colors } from "../../theme";

function Segment({ filled }) {
  const progress = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(filled ? 1 : 0, { duration: 420 });
  }, [filled, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

export default function StepIndicator({ step, steps = IMPORT_STEPS }) {
  return (
    <View accessibilityLabel={`Etapa ${step + 1} de ${steps.length}: ${steps[step]}`} style={styles.root}>
      <View style={styles.track}>
        {steps.map((label, index) => (
          <Segment filled={index <= step} key={label} />
        ))}
      </View>
      <Text tone="muted" variant="subhead">
        Etapa {step + 1} de {steps.length} ·{" "}
        <Text variant="subhead" weight="700">
          {steps[step]}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  track: { flexDirection: "row", gap: 6 },
  segment: { backgroundColor: colors.border, borderRadius: 2, flex: 1, height: 4, overflow: "hidden" },
  fill: { backgroundColor: colors.orange, borderRadius: 2, height: 4 },
});
