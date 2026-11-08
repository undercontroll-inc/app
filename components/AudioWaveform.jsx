import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { colors } from "../theme";

const BAR_COUNT = 36;

function idleLevels() {
  return Array(BAR_COUNT).fill(0.1);
}

function levelFromDb(db) {
  if (typeof db !== "number" || Number.isNaN(db)) return 0.1;
  const clamped = Math.min(0, Math.max(-50, db));
  return 0.1 + ((clamped + 50) / 50) * 0.9;
}

function Bar({ level }) {
  const height = useSharedValue(level);

  useEffect(() => {
    height.value = withTiming(level, { duration: 140 });
  }, [height, level]);

  const style = useAnimatedStyle(() => ({ height: `${Math.round(height.value * 100)}%` }));

  return (
    <View style={styles.barSlot}>
      <Animated.View style={[styles.bar, style]} />
    </View>
  );
}

export default function AudioWaveform({ metering, active, tick, compact = false }) {
  const [levels, setLevels] = useState(idleLevels);
  const [sample, setSample] = useState({ active, metering, tick });

  if (sample.active !== active || sample.metering !== metering || sample.tick !== tick) {
    setSample({ active, metering, tick });
    setLevels((current) => (active ? [...current.slice(1), levelFromDb(metering)] : idleLevels()));
  }

  return (
    <View accessibilityLabel="Nível do áudio" style={[styles.track, compact && styles.compact]}>
      {levels.map((level, index) => (
        <Bar key={index} level={level} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  compact: { backgroundColor: "transparent", flex: 1, height: 34, paddingHorizontal: 2, paddingVertical: 2 },
  track: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    flexDirection: "row",
    height: 72,
    justifyContent: "space-between",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  barSlot: {
    alignItems: "center",
    flex: 1,
    height: "100%",
    justifyContent: "center",
    maxWidth: 4,
  },
  bar: {
    backgroundColor: colors.orange,
    borderRadius: 2,
    minHeight: 4,
    width: 4,
  },
});
