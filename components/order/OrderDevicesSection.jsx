import { Pressable, StyleSheet, View } from "react-native";
import Icon from "../ui/Icon";
import Text from "../ui/Text";
import { FormButtonRow, FormSection, FormSegmentedRow, FormTextRow, FormValueRow } from "../ui/FormRows";
import { deviceSummary } from "../../utils/orderForm";
import { formatCurrency } from "../../utils/orders";
import { colors } from "../../theme";

const VOLTAGES = ["127V", "220V"];

function CollapseToggle({ collapsed, onPress }) {
  return (
    <Pressable
      accessibilityLabel={collapsed ? "Mostrar detalhes do aparelho" : "Ocultar detalhes do aparelho"}
      accessibilityRole="button"
      accessibilityState={{ expanded: !collapsed }}
      hitSlop={10}
      onPress={onPress}
      style={styles.toggle}
    >
      <Text tone="accent" variant="subhead" weight="600">
        {collapsed ? "Mostrar" : "Ocultar"}
      </Text>
      <Icon color={colors.orange} name={collapsed ? "chevronDown" : "chevronUp"} size={13} />
    </Pressable>
  );
}

export default function OrderDevicesSection({ devices, collapsed, laborTotal, onAdd, onRemove, onToggle, onChange }) {
  return (
    <View style={styles.root}>
      {devices.map((device) => {
        const isCollapsed = Boolean(collapsed[device.key]);
        return (
          <FormSection
            action={<CollapseToggle collapsed={isCollapsed} onPress={() => onToggle(device.key)} />}
            key={device.key}
            plainTitle
            title={deviceSummary(device)}
          >
            {isCollapsed ? (
              <FormValueRow label="Mão de obra" value={formatCurrency(device.labor)} />
            ) : (
              [
                <FormTextRow
                  key="appliance"
                  label="Aparelho"
                  onChangeText={(value) => onChange(device.key, "appliance", value)}
                  placeholder="Ex.: Geladeira"
                  value={device.appliance}
                />,
                <FormTextRow
                  key="brand"
                  label="Marca"
                  onChangeText={(value) => onChange(device.key, "brand", value)}
                  placeholder="Ex.: Consul"
                  value={device.brand}
                />,
                <FormTextRow
                  key="model"
                  label="Modelo"
                  onChangeText={(value) => onChange(device.key, "model", value)}
                  placeholder="Ex.: CRM56"
                  value={device.model}
                />,
                <FormSegmentedRow
                  key="voltage"
                  label="Voltagem"
                  onChange={(value) => onChange(device.key, "voltage", value)}
                  options={
                    VOLTAGES.includes(device.voltage) || !device.voltage ? VOLTAGES : [...VOLTAGES, device.voltage]
                  }
                  value={device.voltage}
                />,
                <FormTextRow
                  autoCapitalize="characters"
                  key="serial"
                  label="Nº de série"
                  onChangeText={(value) => onChange(device.key, "serial", value)}
                  placeholder="Opcional"
                  value={device.serial}
                />,
                <FormTextRow
                  key="labor"
                  keyboardType="decimal-pad"
                  label="Mão de obra"
                  onChangeText={(value) => onChange(device.key, "labor", value)}
                  placeholder="0,00"
                  prefix="R$"
                  value={String(device.labor ?? "")}
                />,
                <FormButtonRow
                  icon="trash"
                  key="remove"
                  label="Remover aparelho"
                  onPress={() => onRemove(device.key)}
                  tone="danger"
                />,
              ]
            )}
          </FormSection>
        );
      })}
      <FormSection>
        <FormButtonRow label="Adicionar aparelho" onPress={onAdd} testID="order-add-device" />
        <FormValueRow label="Subtotal de mão de obra" tone="default" value={formatCurrency(laborTotal)} />
      </FormSection>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 20 },
  toggle: { alignItems: "center", flexDirection: "row", gap: 4, minHeight: 32 },
});
