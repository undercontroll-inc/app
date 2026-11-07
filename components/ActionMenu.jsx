import { useCallback, useState } from "react";
import { ActionSheetIOS, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { bottomDockPadding } from "../utils/layout";
import { colors, radius } from "../theme";

export function useActionMenu() {
  const [config, setConfig] = useState(null);

  const show = useCallback((next) => {
    const options = next.options || [];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: next.title,
          message: next.message,
          options: options.map((option) => option.label),
          cancelButtonIndex: options.findIndex((option) => option.cancel),
          destructiveButtonIndex: options.findIndex((option) => option.destructive),
        },
        (index) => {
          options[index]?.onPress?.();
        },
      );
      return;
    }
    setConfig(next);
  }, []);

  const close = useCallback(() => setConfig(null), []);

  return { show, close, config };
}

export function ActionMenuSheet({ config, onClose }) {
  const insets = useSafeAreaInsets();
  if (!config) return null;

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.overlayDismiss} />
        <View style={[styles.sheet, { paddingBottom: bottomDockPadding(insets) }]}>
          <View style={styles.handle} />
          {config.title ? <Text style={styles.title}>{config.title}</Text> : null}
          {config.message ? <Text style={styles.message}>{config.message}</Text> : null}
          <View style={styles.actions}>
            {(config.options || []).map((option) => (
              <Pressable
                key={option.label}
                onPress={() => {
                  onClose();
                  option.onPress?.();
                }}
                style={({ pressed }) => [
                  styles.button,
                  option.destructive && styles.destructive,
                  option.cancel && styles.cancel,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    option.destructive && styles.destructiveText,
                    option.cancel && styles.cancelText,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: colors.overlay, flex: 1, justifyContent: "flex-end" },
  overlayDismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 5,
    marginBottom: 14,
    width: 40,
  },
  title: { color: colors.navy, fontSize: 20, fontWeight: "700", textAlign: "center" },
  message: { color: colors.muted, fontSize: 15, marginTop: 6, textAlign: "center" },
  actions: { gap: 10, marginTop: 18 },
  button: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    justifyContent: "center",
    minHeight: 56,
    paddingVertical: 14,
  },
  buttonText: { color: colors.navy, fontSize: 17, fontWeight: "600" },
  destructive: { backgroundColor: colors.dangerSoft },
  destructiveText: { color: colors.danger },
  cancel: { backgroundColor: "transparent" },
  cancelText: { color: colors.orange, fontWeight: "700" },
  pressed: { opacity: 0.72 },
});
