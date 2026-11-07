import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Pressable, StyleSheet, View } from "react-native";
import Icon from "./ui/Icon";
import Text from "./ui/Text";
import { colors } from "../theme";

function formatClock(seconds = 0) {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function AudioReviewBar({ uri, durationMs = 0 }) {
  const player = useAudioPlayer(uri, { updateInterval: 200 });
  const status = useAudioPlayerStatus(player);
  const duration = status.duration > 0 ? status.duration : durationMs / 1000;
  const progress = duration > 0 ? Math.min((status.currentTime || 0) / duration, 1) : 0;
  const playing = Boolean(status.playing);

  async function togglePlayback() {
    if (playing) {
      player.pause();
      return;
    }
    if (duration > 0 && (status.currentTime || 0) >= duration - 0.15) {
      await player.seekTo(0);
    }
    player.play();
  }

  return (
    <View style={styles.player}>
      <Pressable
        accessibilityLabel={playing ? "Pausar áudio" : "Ouvir áudio"}
        onPress={togglePlayback}
        style={({ pressed }) => [styles.play, pressed && styles.pressed]}
      >
        <Icon color="#ffffff" name={playing ? "pause" : "play"} size={20} />
      </Pressable>
      <View style={styles.track}>
        <View style={styles.trackBg}>
          <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text tone="muted" variant="footnote" weight="600">
          {formatClock(status.currentTime)} / {formatClock(duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  player: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  play: {
    alignItems: "center",
    backgroundColor: colors.orange,
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  track: {
    flex: 1,
    gap: 6,
  },
  trackBg: {
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 6,
    overflow: "hidden",
  },
  trackFill: {
    backgroundColor: colors.orange,
    height: 6,
  },
  pressed: {
    opacity: 0.72,
  },
});
