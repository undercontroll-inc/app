import { useEffect } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import AudioWaveform from "../AudioWaveform";
import Icon from "../ui/Icon";
import Text from "../ui/Text";
import { colors } from "../../theme";

function formatTimer(durationMs = 0) {
  const total = Math.max(0, Math.floor(durationMs / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function LiveDot() {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(0.25, { duration: 700 }), -1, true));
    return () => cancelAnimation(pulse);
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.get() }));
  return <Animated.View style={[styles.dot, style]} />;
}

export default function ChatDictationBar({ dictation }) {
  const recording = dictation.status === "recording";
  const seconds = Math.floor(dictation.durationMs / 1000);
  const nearLimit = recording && dictation.remainingSeconds <= 10;

  return (
    <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={styles.bar}>
      <Pressable
        accessibilityLabel="Cancelar gravação"
        accessibilityRole="button"
        hitSlop={8}
        onPress={dictation.cancel}
        style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
        testID="dictation-cancel"
      >
        <Icon color={colors.muted} name="close" size={18} weight="bold" />
      </Pressable>
      {recording ? (
        <View accessibilityLabel={`Gravando, ${seconds} segundos`} style={styles.middle}>
          <LiveDot />
          <Text style={styles.timer} tone={nearLimit ? "accent" : "default"} variant="subhead" weight="700">
            {formatTimer(dictation.durationMs)}
          </Text>
          <AudioWaveform active compact metering={dictation.metering} tick={dictation.durationMs} />
        </View>
      ) : (
        <View accessibilityLabel="Transcrevendo" style={styles.middle}>
          {Platform.OS === "ios" ? (
            <Icon
              animationSpec={{ repeating: true, variableAnimationSpec: { iterative: true, dimInactiveLayers: true } }}
              color={colors.orange}
              sf="waveform"
              size={22}
            />
          ) : (
            <ActivityIndicator color={colors.orange} />
          )}
          <Text tone="muted" variant="callout">
            Transcrevendo…
          </Text>
        </View>
      )}
      <Pressable
        accessibilityLabel="Concluir gravação"
        accessibilityRole="button"
        disabled={!recording}
        onPress={dictation.finish}
        style={({ pressed }) => [styles.done, !recording && styles.doneDisabled, pressed && styles.pressed]}
        testID="dictation-finish"
      >
        <Icon color="#ffffff" name="check" size={20} weight="bold" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { alignItems: "center", flex: 1, flexDirection: "row", gap: 8, minHeight: 48 },
  cancel: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  middle: { alignItems: "center", flex: 1, flexDirection: "row", gap: 8 },
  dot: { backgroundColor: colors.danger, borderRadius: 5, height: 10, width: 10 },
  timer: { fontVariant: ["tabular-nums"], minWidth: 38 },
  done: {
    alignItems: "center",
    backgroundColor: colors.orange,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  doneDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
});
