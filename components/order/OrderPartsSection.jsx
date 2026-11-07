import { Pressable, StyleSheet, View } from "react-native";
import Icon from "../ui/Icon";
import Text from "../ui/Text";
import { formatCurrency } from "../../utils/orders";
import { haptics } from "../../utils/haptics";
import { colors, radius } from "../../theme";
import { Section, Summary, formStyles } from "./OrderFormParts";

function StepButton({ icon, label, onPress }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={({ pressed }) => [styles.stepperButton, pressed && formStyles.pressed]}
    >
      <Icon color={colors.navy} name={icon} size={18} weight="bold" />
    </Pressable>
  );
}

export default function OrderPartsSection({ parts, partsTotal, onAdd, onRemove, onChangeQuantity }) {
  return (
    <Section action="Adicionar" onAction={onAdd} title="Peças">
      {parts.length === 0 ? (
        <Text tone="muted" variant="subhead">
          Nenhuma peça selecionada.
        </Text>
      ) : null}
      {parts.map((part) => (
        <View key={part.key} style={styles.part}>
          <View style={styles.partHead}>
            <Text style={styles.partName} variant="headline">
              {part.name}
            </Text>
            <Pressable
              accessibilityLabel="Remover peça"
              accessibilityRole="button"
              onPress={() => onRemove(part.key)}
              style={styles.remove}
            >
              <Icon color={colors.danger} name="trash" size={18} />
            </Pressable>
          </View>
          <View style={styles.partRow}>
            <View style={styles.stepper}>
              <StepButton icon="minus" label="Diminuir quantidade" onPress={() => onChangeQuantity(part.key, -1)} />
              <Text style={styles.stepperValue} variant="headline">
                {part.quantity}
              </Text>
              <StepButton icon="plus" label="Aumentar quantidade" onPress={() => onChangeQuantity(part.key, 1)} />
            </View>
            <Text style={styles.price} variant="callout" weight="700">
              {formatCurrency(part.price)}
            </Text>
          </View>
        </View>
      ))}
      <Summary label="Subtotal de peças" value={formatCurrency(partsTotal)} />
    </Section>
  );
}

const styles = StyleSheet.create({
  part: { backgroundColor: colors.background, borderRadius: radius.control, gap: 8, padding: 12 },
  partHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  partName: { flex: 1, paddingRight: 8 },
  remove: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  partRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  stepper: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: "row",
  },
  stepperButton: { alignItems: "center", height: 48, justifyContent: "center", width: 48 },
  stepperValue: { minWidth: 32, textAlign: "center" },
  price: { flex: 1, textAlign: "right" },
});
