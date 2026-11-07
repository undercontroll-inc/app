import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Icon from "./ui/Icon";
import { colors } from "../theme";

const SIZE = 84;

export default function RecordButton({ recording, onPress, disabled }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (recording) {
      pulse.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) }), -1, false);
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
  }, [pulse, recording]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: recording ? 0.45 * (1 - pulse.value) : 0,
    transform: [{ scale: 1 + pulse.value * 0.55 }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View pointerEvents="none" style={[styles.halo, haloStyle]} />
      <Pressable
        accessibilityLabel={recording ? "Parar gravação" : "Começar a gravar"}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.button, recording && styles.recording, pressed && styles.pressed]}
        testID="record-button"
      >
        {recording ? <View style={styles.stop} /> : <Icon color="#ffffff" name="mic" size={34} weight="bold" />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", alignSelf: "center", height: SIZE * 1.6, justifyContent: "center", width: SIZE * 1.6 },
  halo: { backgroundColor: colors.orange, borderRadius: SIZE, height: SIZE, position: "absolute", width: SIZE },
  button: {
    alignItems: "center",
    backgroundColor: colors.orange,
    borderColor: "#ffffff",
    borderRadius: SIZE / 2,
    borderWidth: 4,
    height: SIZE,
    justifyContent: "center",
    shadowColor: colors.orange,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    width: SIZE,
  },
  recording: { backgroundColor: colors.danger, shadowColor: colors.danger },
  stop: { backgroundColor: "#ffffff", borderRadius: 6, height: 28, width: 28 },
  pressed: { transform: [{ scale: 0.94 }] },
});
