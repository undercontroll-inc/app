import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { formatCurrency } from "../../utils/orders";
import { Section, Summary, formStyles } from "./OrderFormParts";

export default function OrderPartsSection({ parts, partsTotal, onAdd, onRemove, onChangeQuantity }) {
  return (
    <Section action="Adicionar" onAction={onAdd} title="Peças">
      {parts.length === 0 ? <Text style={styles.emptyParts}>Nenhuma peça selecionada.</Text> : null}
      {parts.map((part) => (
        <View key={part.key} style={styles.part}>
          <View style={styles.partHead}>
            <Text style={styles.partName}>{part.name}</Text>
            <Pressable accessibilityLabel="Remover peça" hitSlop={8} onPress={() => onRemove(part.key)}>
              <Feather color="#d71929" name="trash-2" size={18} />
            </Pressable>
          </View>
          <View style={styles.partRow}>
            <View style={styles.stepper}>
              <Pressable
                accessibilityLabel="Diminuir quantidade"
                onPress={() => onChangeQuantity(part.key, -1)}
                style={({ pressed }) => [styles.stepperButton, pressed && formStyles.pressed]}
              >
                <Feather color="#092542" name="minus" size={16} />
              </Pressable>
              <Text style={styles.stepperValue}>{part.quantity}</Text>
              <Pressable
                accessibilityLabel="Aumentar quantidade"
                onPress={() => onChangeQuantity(part.key, 1)}
                style={({ pressed }) => [styles.stepperButton, pressed && formStyles.pressed]}
              >
                <Feather color="#092542" name="plus" size={16} />
              </Pressable>
            </View>
            <Text style={styles.price}>{formatCurrency(part.price)}</Text>
          </View>
        </View>
      ))}
      <Summary label="Subtotal de peças" value={formatCurrency(partsTotal)} />
    </Section>
  );
}

const styles = StyleSheet.create({
  emptyParts: { color: "#667994", fontSize: 14, marginBottom: 8 },
  part: {
    backgroundColor: "#f4f7fb",
    borderRadius: 10,
    marginBottom: 8,
    padding: 12,
  },
  partName: { color: "#092542", flex: 1, fontSize: 15, fontWeight: "700", paddingRight: 8 },
  partHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  partRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  stepper: {
    alignItems: "center",
    borderColor: "#dce4ee",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
  },
  stepperButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  stepperValue: {
    color: "#092542",
    fontSize: 16,
    fontWeight: "800",
    minWidth: 28,
    textAlign: "center",
  },
  price: { color: "#092542", flex: 1, fontSize: 15, fontWeight: "800", textAlign: "right" },
});
