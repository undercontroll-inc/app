import { useCallback, useState } from "react";
import { ActionSheetIOS, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { bottomDockPadding } from "../utils/layout";

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
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  overlayDismiss: { flex: 1 },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#dce4ee",
    borderRadius: 2,
    height: 4,
    marginBottom: 12,
    width: 36,
  },
  title: { color: "#092542", fontSize: 18, fontWeight: "800", textAlign: "center" },
  message: { color: "#667994", fontSize: 14, marginTop: 6, textAlign: "center" },
  actions: { gap: 8, marginTop: 16 },
  button: {
    alignItems: "center",
    backgroundColor: "#ef7f19",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 48,
    paddingVertical: 14,
  },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  destructive: { backgroundColor: "#d71929" },
  destructiveText: { color: "#ffffff" },
  cancel: { backgroundColor: "#ffffff", borderColor: "#dce4ee", borderWidth: 1 },
  cancelText: { color: "#667994" },
  pressed: { opacity: 0.72 },
});
