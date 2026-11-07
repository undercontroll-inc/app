import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VoiceNoteContent } from "../../../components/VoiceNoteSheet";
import Text from "../../../components/ui/Text";
import { getVoiceSheet, useVoiceSheet } from "../../../utils/voiceSheetStore";
import { colors } from "../../../theme";

export default function VoiceNoteSheetScreen() {
  const insets = useSafeAreaInsets();
  const sheet = useVoiceSheet();
  const leaving = useRef(false);

  useEffect(() => {
    if (!sheet && !leaving.current) {
      leaving.current = true;
      router.back();
    }
  }, [sheet]);

  useEffect(
    () => () => {
      const current = getVoiceSheet();
      if (current?.canClose) current.onClose();
    },
    [],
  );

  if (!sheet) return null;

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <Stack.Screen options={{ gestureEnabled: sheet.canClose }} />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          disabled={!sheet.canClose}
          hitSlop={12}
          onPress={sheet.onClose}
          style={[styles.side, !sheet.canClose && styles.dim]}
        >
          <Text tone="accent" variant="body">
            Cancelar
          </Text>
        </Pressable>
        <Text align="center" numberOfLines={1} style={styles.title} variant="headline">
          {sheet.title}
        </Text>
        <View style={styles.side} />
      </View>
      <View style={styles.body}>
        <VoiceNoteContent {...sheet.props} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.surface, paddingTop: 14 },
  header: { alignItems: "center", flexDirection: "row", minHeight: 44, paddingHorizontal: 16 },
  side: { justifyContent: "center", minHeight: 44, minWidth: 80 },
  title: { flex: 1 },
  dim: { opacity: 0.4 },
  body: { gap: 4, paddingHorizontal: 20 },
});
