import { useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Feather from "@expo/vector-icons/Feather";
import { formatDateBR } from "../utils/orders";

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
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Pressable onPress={() => setOpen(false)} style={styles.sheetAction}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={() => apply(draft)} style={styles.sheetAction}>
                  <Text style={styles.confirmText}>Confirmar</Text>
                </Pressable>
              </View>
              <DateTimePicker
                display="spinner"
                locale="pt-BR"
                mode="date"
                onChange={(_, date) => date && setDraft(date)}
                value={draft}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, marginBottom: 18, minWidth: 125 },
  fieldLabel: { color: "#667994", fontSize: 14, marginBottom: 8 },
  fieldBox: {
    alignItems: "center",
    borderColor: "#dce4ee",
    borderRadius: 11,
    borderWidth: 2,
    flexDirection: "row",
    minHeight: 54,
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
    paddingBottom: 16,
  },
  sheetHeader: {
    alignItems: "center",
    borderBottomColor: "#eef2f6",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sheetAction: { padding: 6 },
  cancelText: { color: "#667994", fontSize: 16, fontWeight: "700" },
  confirmText: { color: "#ef7f19", fontSize: 16, fontWeight: "800" },
});
