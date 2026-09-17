import { useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDateBR } from "../utils/orders";
import { bottomDockPadding } from "../utils/layout";

function parseBRDate(value) {
  if (!value) return new Date();
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  const [day, month, year] = String(value).split("/").map(Number);
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default function DateField({ label, value, onChange }) {
  const insets = useSafeAreaInsets();
  const selected = useMemo(() => parseBRDate(value), [value]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(selected);

  function openPicker() {
    setDraft(selected);
    setOpen(true);
  }

  function apply(date) {
    onChange(formatDateBR(date));
    setOpen(false);
  }

  function handleAndroidChange(event, date) {
    if (event.type === "dismissed" || !date) {
      setOpen(false);
      return;
    }
    apply(date);
  }

  return (
    <View style={styles.field}>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <Pressable onPress={openPicker} style={styles.fieldBox}>
        <Text style={styles.fieldValue}>{value || "Selecionar data"}</Text>
        <Feather color="#667994" name="calendar" size={18} />
      </Pressable>
      {open && Platform.OS === "android" && (
        <DateTimePicker
          display="default"
          mode="date"
          onChange={handleAndroidChange}
          value={selected}
        />
      )}
      {Platform.OS !== "android" && (
        <Modal animationType="slide" onRequestClose={() => setOpen(false)} transparent visible={open}>
          <View style={styles.overlay}>
            <Pressable onPress={() => setOpen(false)} style={styles.overlayDismiss} />
            <View style={[styles.sheet, { paddingBottom: bottomDockPadding(insets) }]}>
              <DateTimePicker
                display="spinner"
                locale="pt-BR"
                mode="date"
                onChange={(_, date) => date && setDraft(date)}
                value={draft}
              />
              <View style={styles.sheetActions}>
                <Pressable onPress={() => apply(draft)} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}>
                  <Text style={styles.confirmButtonText}>Confirmar</Text>
                </Pressable>
                <Pressable onPress={() => setOpen(false)} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 12 },
  fieldLabel: { color: "#667994", fontSize: 14, marginBottom: 8 },
  fieldBox: {
    alignItems: "center",
    borderColor: "#dce4ee",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  fieldValue: { color: "#092542", flex: 1, fontSize: 15, paddingVertical: 10 },
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
    paddingBottom: 0,
    paddingHorizontal: 20,
  },
  sheetActions: { gap: 8, paddingTop: 4 },
  confirmButton: {
    alignItems: "center",
    backgroundColor: "#ef7f19",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 48,
  },
  confirmButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  cancelButton: { alignItems: "center", justifyContent: "center", minHeight: 44 },
  cancelButtonText: { color: "#667994", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.72 },
});
