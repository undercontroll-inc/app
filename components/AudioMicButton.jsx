import { Pressable, StyleSheet } from "react-native";
import Icon from "./ui/Icon";
import Text from "./ui/Text";
import { colors } from "../theme";

function formatTimer(durationMs = 0) {
  const total = Math.max(0, Math.floor(durationMs / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function AudioMicButton({ status = "idle", durationMs = 0, disabled, onPress }) {
  const recording = status === "recording";

  return (
    <Pressable
      accessibilityLabel={recording ? "Parar gravação" : "Gravar áudio"}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, recording && styles.recording, pressed && styles.pressed]}
    >
      <Icon color={recording ? "#ffffff" : colors.orange} name={recording ? "stop" : "mic"} size={18} />
      {recording ? (
        <Text tone={recording ? "inverse" : "accent"} variant="footnote" weight="700">
          {formatTimer(durationMs)}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderColor: colors.orange,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    height: 48,
    justifyContent: "center",
    minWidth: 48,
    paddingHorizontal: 10,
  },
  recording: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  pressed: {
    opacity: 0.72,
  },
});
