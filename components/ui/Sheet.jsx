import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Text from "./Text";
import { bottomDockPadding } from "../../utils/layout";
import { colors, radius } from "../../theme";

function HeaderAction({ label, onPress, bold, disabled }) {
  if (!label) return <View style={styles.headerSide} />;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [styles.headerSide, (pressed || disabled) && styles.dim]}
    >
      <Text tone="accent" variant="body" weight={bold ? "700" : "400"}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function Sheet({
  visible,
  onClose,
  title,
  cancelLabel = "Cancelar",
  confirmLabel,
  onConfirm,
  confirmDisabled,
  children,
  fullHeight = false,
}) {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";

  const header = (
    <View style={styles.header}>
      <HeaderAction label={cancelLabel} onPress={onClose} />
      <Text align="center" numberOfLines={1} style={styles.headerTitle} variant="headline">
        {title}
      </Text>
      <HeaderAction bold disabled={confirmDisabled} label={confirmLabel} onPress={onConfirm} />
    </View>
  );

  if (isIOS) {
    return (
      <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
        <View style={styles.iosRoot}>
          {header}
          <View style={styles.iosBody}>{children}</View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView behavior={undefined} style={styles.overlay}>
        <Pressable accessibilityLabel="Fechar" onPress={onClose} style={styles.overlayDismiss} />
        <View style={[styles.sheet, fullHeight && styles.sheetTall, { paddingBottom: bottomDockPadding(insets) }]}>
          <View style={styles.handle} />
          {header}
          <View style={fullHeight ? styles.iosBody : null}>{children}</View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  iosRoot: { backgroundColor: colors.background, flex: 1 },
  iosBody: { flex: 1 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  headerSide: { justifyContent: "center", minHeight: 44, minWidth: 80 },
  headerTitle: { flex: 1 },
  dim: { opacity: 0.4 },
  overlay: { backgroundColor: colors.overlay, flex: 1, justifyContent: "flex-end" },
  overlayDismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    maxHeight: "88%",
  },
  sheetTall: { height: "88%" },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 5,
    marginTop: 8,
    width: 40,
  },
});
