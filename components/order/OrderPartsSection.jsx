import { StyleSheet, View } from "react-native";
import Text from "../ui/Text";
import { FormButtonRow, FormRow, FormSection, FormValueRow, Stepper } from "../ui/FormRows";
import { formatCurrency } from "../../utils/orders";

function PartRow({ part, onChangeQuantity, onRemove, last }) {
  return (
    <FormRow last={last} minHeight={68}>
      <View style={styles.text}>
        <Text numberOfLines={2} variant="body" weight="600">
          {part.name}
        </Text>
        <Text tone="muted" variant="subhead">
          {formatCurrency(part.price)} cada
        </Text>
      </View>
      <Stepper
        label={part.name}
        onDecrement={() => (Number(part.quantity) <= 1 ? onRemove(part.key) : onChangeQuantity(part.key, -1))}
        onIncrement={() => onChangeQuantity(part.key, 1)}
        removeOnMin
        value={part.quantity}
      />
    </FormRow>
  );
}

export default function OrderPartsSection({ parts, partsTotal, onAdd, onRemove, onChangeQuantity }) {
  return (
    <FormSection footer={parts.length ? "Toque na lixeira para remover uma peça." : undefined} title="Peças">
      {parts.map((part) => (
        <PartRow key={part.key} onChangeQuantity={onChangeQuantity} onRemove={onRemove} part={part} />
      ))}
      <FormButtonRow label="Adicionar peça do estoque" onPress={onAdd} testID="order-add-part" />
      <FormValueRow label="Subtotal de peças" tone="default" value={formatCurrency(partsTotal)} />
    </FormSection>
  );
}

const styles = StyleSheet.create({
  text: { flex: 1, gap: 2 },
});
