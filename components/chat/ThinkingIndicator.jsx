import { memo, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Icon from "../ui/Icon";
import Text from "../ui/Text";
import { thinkingElapsedLabel, thinkingPhrases } from "../../utils/chat";
import { colors, MAX_FONT_SCALE } from "../../theme";

const PHRASE_MS = 2400;
const SHIMMER_MS = 1600;

function ShimmerChar({ char, index, total, progress }) {
  const position = total > 1 ? index / (total - 1) : 0;
  const style = useAnimatedStyle(() => {
    const head = progress.get() * 1.6 - 0.3;
    const distance = Math.abs(head - position);
    return { opacity: 0.38 + 0.62 * Math.max(0, 1 - distance * 4) };
  });
  return (
    <Animated.Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.char, style]}>
      {char}
    </Animated.Text>
  );
}

function ShimmerText({ text }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withRepeat(withTiming(1, { duration: SHIMMER_MS, easing: Easing.inOut(Easing.quad) }), -1, false));
    return () => cancelAnimation(progress);
  }, [progress]);
  const chars = useMemo(() => Array.from(`${text}…`), [text]);
  return (
    <View accessible={false} style={styles.shimmer}>
      {chars.map((char, index) => (
        <ShimmerChar char={char} index={index} key={`${index}-${char}`} progress={progress} total={chars.length} />
      ))}
    </View>
  );
}

function SparkleBadge() {
  const spin = useSharedValue(0);
  useEffect(() => {
    if (Platform.OS === "ios") return undefined;
    spin.set(withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(spin);
  }, [spin]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.get() * 360}deg` }] }));
  return (
    <View style={styles.badge}>
      <Animated.View style={style}>
        <Icon
          animationSpec={{ effect: { type: "pulse", wholeSymbol: true }, repeating: true, speed: 0.8 }}
          color={colors.orange}
          name="sparkles"
          size={16}
        />
      </Animated.View>
    </View>
  );
}

function ThinkingIndicator({ prompt, startedAt }) {
  const phrases = useMemo(() => thinkingPhrases(prompt), [prompt]);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      setIndex((current) => (current < phrases.length - 1 ? current + 1 : current));
    }, PHRASE_MS);
    return () => clearInterval(timer);
  }, [phrases.length]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const phrase = phrases[index];
  const elapsed = thinkingElapsedLabel(startedAt, now);

  return (
    <View accessibilityLabel={`Ana está trabalhando: ${phrase}`} accessibilityLiveRegion="polite" style={styles.row}>
      <SparkleBadge />
      <View style={styles.textArea}>
        <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutUp.duration(160)} key={phrase}>
          <ShimmerText text={phrase} />
        </Animated.View>
      </View>
      {elapsed ? (
        <Text style={styles.elapsed} tone="muted" variant="footnote">
          {elapsed}
        </Text>
      ) : null}
    </View>
  );
}

export default memo(ThinkingIndicator);

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: 10, minHeight: 28 },
  badge: {
    alignItems: "center",
    backgroundColor: colors.orangeSoft,
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  textArea: { flexShrink: 1, overflow: "hidden" },
  shimmer: { flexDirection: "row", flexWrap: "wrap" },
  char: { color: colors.navy, fontSize: 16, fontWeight: "600", lineHeight: 22 },
  elapsed: { fontVariant: ["tabular-nums"] },
});
