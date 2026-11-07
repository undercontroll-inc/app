import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Icon from "../Icon";
import { colors, shadow } from "./theme";

export default function ScanPreview({ uri, fileName, isImage, scanning = true, width = 220, height = 280 }) {
  const progress = useSharedValue(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!scanning) {
      cancelAnimation(progress);
      return undefined;
    }
    progress.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(progress);
  }, [progress, scanning]);

  const lineStyle = useAnimatedStyle(() => ({ transform: [{ translateY: progress.value * (height - 24) }] }));

  const showImage = isImage && uri && !failed;

  return (
    <View style={[styles.card, { height, width }]}>
      {showImage ? (
        <Image
          contentFit="cover"
          onError={() => setFailed(true)}
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          transition={200}
        />
      ) : (
        <View style={styles.document}>
          <Icon color={colors.orange} feather="file-text" sf="doc.text.fill" size={44} />
          <Text numberOfLines={2} style={styles.fileName}>
            {fileName || "Nota fiscal"}
          </Text>
        </View>
      )}
      {scanning ? (
        <Animated.View style={[styles.lineWrap, lineStyle]}>
          <View style={styles.glow} />
          <View style={styles.line} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadow,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  document: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center", padding: 20 },
  fileName: { color: colors.navy, fontSize: 14, fontWeight: "600", textAlign: "center" },
  lineWrap: { left: 12, position: "absolute", right: 12, top: 8 },
  glow: { backgroundColor: "rgba(239,127,25,0.18)", borderRadius: 8, height: 14, marginBottom: -9 },
  line: { backgroundColor: colors.orange, borderRadius: 2, height: 3 },
});
