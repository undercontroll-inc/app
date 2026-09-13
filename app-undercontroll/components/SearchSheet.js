import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SearchSheet({
  visible,
  title,
  placeholder,
  query,
  onChangeQuery,
  results = [],
  emptyText = "Nenhum resultado.",
  onSelect,
  onClose,
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.overlayDismiss} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.headerAction}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.search}>
            <TextInput
              autoFocus
              onChangeText={onChangeQuery}
              placeholder={placeholder}
              placeholderTextColor="#667994"
              style={styles.searchInput}
              value={query}
            />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.list}>
            {results.length === 0 ? (
              <Text style={styles.empty}>{emptyText}</Text>
            ) : (
              results.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => onSelect(item)}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                >
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  {item.meta ? <Text style={styles.rowMeta}>{item.meta}</Text> : null}
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: "80%",
    paddingHorizontal: 20,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#dce4ee",
    borderRadius: 2,
    height: 4,
    marginTop: 8,
    width: 36,
  },
  header: {
    flexDirection: "row",
    paddingTop: 4,
  },
  headerAction: {
    paddingVertical: 8,
    paddingRight: 6,
  },
  cancelText: {
    color: "#667994",
    fontSize: 16,
    fontWeight: "700",
  },
  title: {
    color: "#092542",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 4,
  },
  search: {
    borderColor: "#dce4ee",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  searchInput: {
    color: "#092542",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  list: {
    maxHeight: 360,
  },
  row: {
    borderBottomColor: "#eef2f6",
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  rowTitle: { color: "#092542", fontSize: 15, fontWeight: "700" },
  rowMeta: { color: "#667994", fontSize: 13, marginTop: 4 },
  empty: { color: "#667994", fontSize: 14, paddingVertical: 20, textAlign: "center" },
  pressed: { opacity: 0.72 },
});
