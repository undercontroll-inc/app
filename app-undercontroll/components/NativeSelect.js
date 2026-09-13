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
            <View style={styles.sheetActions}>
              <Pressable onPress={confirm} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}>
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </Pressable>
              <Pressable onPress={() => setOpen(false)} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
                <Text style={[styles.cancelButtonText, dark && styles.darkActionText]}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
  },
  darkSheet: { backgroundColor: "#092542" },
  sheetActions: { gap: 8, paddingTop: 4 },
  confirmButton: {
    alignItems: "center",
    backgroundColor: "#ef7f19",
    borderRadius: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  confirmButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  cancelButton: { alignItems: "center", minHeight: 44, justifyContent: "center" },
  cancelButtonText: { color: "#667994", fontSize: 16, fontWeight: "700" },
  darkActionText: { color: "#9fb0c5" },
  picker: { minHeight: 180, width: "100%" },
  darkItem: { color: "#ffffff" },
  pressed: { opacity: 0.72 },
});
