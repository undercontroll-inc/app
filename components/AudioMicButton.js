import { Pressable, StyleSheet, Text } from "react-native";
import Feather from "@expo/vector-icons/Feather";

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
      <Feather color={recording ? "#ffffff" : "#ef7f19"} name={recording ? "square" : "mic"} size={16} />
      {recording ? <Text style={styles.timer}>{formatTimer(durationMs)}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderColor: "#ef7f19",
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    minWidth: 40,
    paddingHorizontal: 10,
  },
  recording: {
    backgroundColor: "#ef7f19",
    borderColor: "#ef7f19",
  },
  timer: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  pressed: {
    opacity: 0.72,
  },
});
