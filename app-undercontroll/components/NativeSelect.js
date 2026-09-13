import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Picker } from "@react-native-picker/picker";

function getStatusColor(status) {
  if (status === "Concluído") return "#25cf79";
  if (status === "Entregue") return "#099ab3";
  if (status === "Pendente") return "#f2c94c";
  return "#f2994a";
}

export default function NativeSelect({
  label,
  value,
  options,
  onSelect,
  dark,
  statusIndicator,
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  function openPicker() {
    setDraft(value);
    setOpen(true);
  }

  function confirm() {
    onSelect(draft);
    setOpen(false);
  }

  return (
    <View style={styles.field}>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <Pressable
        onPress={openPicker}
        style={[styles.fieldBox, dark && styles.darkSelect]}
      >
        <View style={styles.valueRow}>
          {statusIndicator && <View style={[styles.statusDot, { backgroundColor: getStatusColor(value) }]} />}
          <Text style={[styles.fieldValue, dark && styles.darkSelectValue]}>{value}</Text>
        </View>
        <Feather color={dark ? "#ffffff" : "#667994"} name="chevron-down" size={20} />
      </Pressable>
      <Modal animationType="slide" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View style={styles.overlay}>
          <Pressable onPress={() => setOpen(false)} style={styles.overlayDismiss} />
          <View style={[styles.sheet, dark && styles.darkSheet]}>
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setOpen(false)} style={styles.sheetAction}>
                <Text style={[styles.cancelText, dark && styles.darkActionText]}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={confirm} style={styles.sheetAction}>
                <Text style={styles.confirmText}>Confirmar</Text>
              </Pressable>
            </View>
            <Picker
              itemStyle={dark ? styles.darkItem : undefined}
              onValueChange={setDraft}
              selectedValue={draft}
              style={styles.picker}
            >
              {options.map((option) => (
                <Picker.Item
                  color={Platform.OS === "android" && dark ? "#ffffff" : undefined}
                  key={option}
                  label={option}
                  value={option}
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>
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
  valueRow: { alignItems: "center", flex: 1, flexDirection: "row" },
  statusDot: { borderRadius: 6, height: 12, marginRight: 10, width: 12 },
  fieldValue: { color: "#092542", flex: 1, fontSize: 15, paddingVertical: 10 },
  darkSelect: { backgroundColor: "#092542", borderColor: "#092542" },
  darkSelectValue: { color: "#fff", fontWeight: "800" },
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
  darkSheet: { backgroundColor: "#092542" },
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
  darkActionText: { color: "#9fb0c5" },
  picker: { minHeight: 180, width: "100%" },
  darkItem: { color: "#ffffff" },
});
