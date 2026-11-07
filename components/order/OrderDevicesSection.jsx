import { Pressable, StyleSheet, View } from "react-native";
import Icon from "../ui/Icon";
import Text from "../ui/Text";
import { colors, radius } from "../../theme";
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
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: !isCollapsed }}
                onPress={() => onToggle(device.key)}
                style={styles.deviceToggle}
              >
                <Text style={styles.deviceTitle} variant="headline">
                  {deviceSummary(device)}
                </Text>
                <Icon color={colors.muted} name={isCollapsed ? "chevronDown" : "chevronUp"} size={16} />
              </Pressable>
              <Pressable
                accessibilityLabel="Remover aparelho"
                onPress={() => onRemove(device.key)}
                style={styles.iconButton}
              >
                <Icon color={colors.danger} name="trash" size={18} />
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
  deviceCard: {
    backgroundColor: colors.background,
    borderRadius: radius.control,
    gap: 14,
    marginBottom: 4,
    padding: 12,
  },
  deviceHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  deviceToggle: { alignItems: "center", flex: 1, flexDirection: "row", gap: 8, minHeight: 48, paddingRight: 8 },
  deviceTitle: { flex: 1 },
  iconButton: { alignItems: "center", height: 48, justifyContent: "center", width: 48 },
});
