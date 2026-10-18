import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import NativeSelect from "../NativeSelect";
import { deviceSummary } from "../../utils/orderForm";
import { formatCurrency } from "../../utils/orders";
import { Field, Section, Summary } from "./OrderFormParts";

export default function OrderDevicesSection({ devices, collapsed, laborTotal, onAdd, onRemove, onToggle, onChange }) {
  return (
    <Section action="Adicionar" onAction={onAdd} title="Aparelhos">
      {devices.map((device) => {
        const isCollapsed = Boolean(collapsed[device.key]);
        return (
          <View key={device.key} style={styles.deviceCard}>
            <View style={styles.deviceHeading}>
              <Pressable onPress={() => onToggle(device.key)} style={styles.deviceToggle}>
                <Text style={styles.deviceTitle}>{deviceSummary(device)}</Text>
                <Feather color="#667994" name={isCollapsed ? "chevron-down" : "chevron-up"} size={20} />
              </Pressable>
              <Pressable
                accessibilityLabel="Remover aparelho"
                hitSlop={8}
                onPress={() => onRemove(device.key)}
                style={styles.iconButton}
              >
                <Feather color="#d71929" name="trash-2" size={18} />
              </Pressable>
            </View>
            {!isCollapsed ? (
              <>
                <Field
                  label="Aparelho"
                  onChangeText={(value) => onChange(device.key, "appliance", value)}
                  placeholder="Tipo do aparelho"
                  value={device.appliance}
                />
                <Field
                  label="Marca"
                  onChangeText={(value) => onChange(device.key, "brand", value)}
                  value={device.brand}
                />
                <Field
                  label="Modelo"
                  onChangeText={(value) => onChange(device.key, "model", value)}
                  value={device.model}
                />
                <NativeSelect
                  label="Voltagem"
                  onSelect={(value) => onChange(device.key, "voltage", value)}
                  options={["127V", "220V"]}
                  value={device.voltage}
                />
                <Field
                  label="Nº de Série"
                  onChangeText={(value) => onChange(device.key, "serial", value)}
                  value={device.serial}
                />
                <Field
                  keyboardType="decimal-pad"
                  label="Valor Mão de Obra (R$)"
                  onChangeText={(value) => onChange(device.key, "labor", value)}
                  value={String(device.labor ?? "")}
                />
              </>
            ) : null}
          </View>
        );
      })}
      <Summary label="Subtotal de mão de obra" value={formatCurrency(laborTotal)} />
    </Section>
  );
}

const styles = StyleSheet.create({
  deviceCard: { borderBottomColor: "#eef2f6", borderBottomWidth: 1, marginBottom: 12, paddingBottom: 4 },
  deviceHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  deviceToggle: { alignItems: "center", flex: 1, flexDirection: "row", paddingRight: 8 },
  deviceTitle: { color: "#092542", flex: 1, fontSize: 15, fontWeight: "700", paddingRight: 8 },
  iconButton: { padding: 4 },
});
