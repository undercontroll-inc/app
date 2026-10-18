import { useState } from "react";
import { StyleSheet, View } from "react-native";

const BAR_COUNT = 36;

function idleLevels() {
  return Array(BAR_COUNT).fill(0.1);
}

function levelFromDb(db) {
  if (typeof db !== "number" || Number.isNaN(db)) return 0.1;
  const clamped = Math.min(0, Math.max(-50, db));
  return 0.1 + ((clamped + 50) / 50) * 0.9;
}

export default function AudioWaveform({ metering, active, tick }) {
  const [levels, setLevels] = useState(idleLevels);
  const [sample, setSample] = useState({ active, metering, tick });

  if (sample.active !== active || sample.metering !== metering || sample.tick !== tick) {
    setSample({ active, metering, tick });
    setLevels((current) => (active ? [...current.slice(1), levelFromDb(metering)] : idleLevels()));
  }

  return (
    <View accessibilityLabel="Nível do áudio" style={styles.track}>
      {levels.map((level, index) => (
        <View key={index} style={styles.barSlot}>
          <View style={[styles.bar, { height: `${Math.round(level * 100)}%` }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    alignItems: "center",
    backgroundColor: "#f4f7fb",
    borderRadius: 10,
    flexDirection: "row",
    height: 56,
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
    backgroundColor: "#ef7f19",
    borderRadius: 2,
    minHeight: 4,
    width: 3,
  },
});
