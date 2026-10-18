import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export function Section({ title, action, onAction, children, highlight }) {
  return (
    <View style={[styles.section, highlight && styles.highlight]}>
      {title ? (
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {action ? (
            <Pressable onPress={onAction} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Text style={styles.actionText}>{action}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Field({ label, value, onChangeText, placeholder, editable = true, keyboardType }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, !editable && styles.readonlyBox]}>
        <TextInput
          editable={editable}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#667994"
          style={styles.fieldValue}
          value={value}
        />
      </View>
    </View>
  );
}

export function Summary({ label, value, total, red }) {
  return (
    <View style={styles.summary}>
      <Text style={[styles.summaryLabel, total && styles.strong]}>{label}</Text>
      <Text style={[styles.summaryValue, total && styles.total, red && styles.red]}>{value}</Text>
    </View>
  );
}

export const formStyles = StyleSheet.create({
  pressed: { opacity: 0.72 },
});

const styles = StyleSheet.create({
  section: {
    borderColor: "#dce4ee",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  highlight: { borderColor: "#ef7f19", borderLeftWidth: 6 },
  sectionHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#092542",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  action: { backgroundColor: "#fff0e6", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  actionText: { color: "#ef7f19", fontSize: 13, fontWeight: "700" },
  field: { marginBottom: 12 },
  fieldLabel: { color: "#667994", fontSize: 13, marginBottom: 6 },
  fieldBox: {
    alignItems: "center",
    borderColor: "#dce4ee",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  readonlyBox: { backgroundColor: "#f4f7fb" },
  fieldValue: { color: "#092542", flex: 1, fontSize: 15, paddingVertical: 10 },
  summary: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  summaryLabel: { color: "#667994", flexShrink: 1, fontSize: 14, fontWeight: "700" },
  summaryValue: { color: "#ef7f19", fontSize: 15, fontWeight: "800" },
  strong: { color: "#092542", fontWeight: "800" },
  total: { color: "#092542", fontSize: 18 },
  red: { color: "#ef4b43" },
  pressed: { opacity: 0.72 },
});
