import { useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import PickerField from "./ui/PickerField";
import Text from "./ui/Text";
import { formatDateBR } from "../utils/orders";
import { colors, radius } from "../theme";

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

export default function DateField({ label, value, onChange, disabled = false }) {
  const selected = useMemo(() => parseBRDate(value), [value]);
  const [open, setOpen] = useState(false);

  if (Platform.OS === "ios") {
    return (
      <View style={[styles.iosRow, disabled && styles.disabled]}>
        <Text style={styles.iosLabel} tone="muted" variant="subhead" weight="600">
          {label}
        </Text>
        {disabled ? (
          <Text variant="body">{value || "—"}</Text>
        ) : (
          <DateTimePicker
            accentColor={colors.orange}
            display="compact"
            locale="pt-BR"
            mode="date"
            onChange={(_, date) => date && onChange(formatDateBR(date))}
            value={selected}
          />
        )}
      </View>
    );
  }

  return (
    <View>
      <PickerField
        disabled={disabled}
        icon="calendar"
        label={label}
        onPress={() => setOpen(true)}
        placeholder="Selecionar data"
        value={value}
      />
      {open ? (
        <DateTimePicker
          display="default"
          mode="date"
          onChange={(event, date) => {
            setOpen(false);
            if (event.type !== "dismissed" && date) onChange(formatDateBR(date));
          }}
          value={selected}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  iosRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 56,
    paddingLeft: 14,
    paddingRight: 8,
  },
  iosLabel: { flexShrink: 1 },
  disabled: { backgroundColor: colors.surfaceMuted, paddingRight: 14 },
});
