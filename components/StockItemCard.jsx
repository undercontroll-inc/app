import { memo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Card from "./ui/Card";
import SwipeRow from "./ui/SwipeRow";
import Icon from "./ui/Icon";
import Text from "./ui/Text";
import { formatCurrency } from "../utils/orders";
import { stockCategoryLabel } from "../utils/stock";
import { colors } from "../theme";

export const LOW_STOCK = 2;

export function stockStatus(quantity) {
  if (quantity <= 0) return { label: "Sem estoque", color: colors.danger, background: colors.dangerSoft };
  if (quantity <= LOW_STOCK) {
    return {
      label: `Estoque baixo · ${quantity} ${quantity === 1 ? "unidade" : "unidades"}`,
      color: colors.warning,
      background: colors.warningSoft,
    };
  }
  return { label: `${quantity} em estoque`, color: colors.success, background: colors.successSoft };
}

function StockItemCard({ item, onPress, onLongPress, onEdit, onDelete }) {
  const quantity = item.quantity ?? 0;
  const status = stockStatus(quantity);

  const card = (
    <Card
      accessibilityHint={
        Platform.OS === "ios" ? "Arraste para a direita para ver as ações" : "Segure para ver as ações"
      }
      accessibilityLabel={`${item.item}, ${status.label}, ${formatCurrency(item.price)}`}
      onLongPress={Platform.OS === "ios" ? undefined : () => onLongPress(item)}
      onPress={() => onPress(item)}
      style={styles.card}
    >
      <View style={styles.top}>
        <View style={styles.text}>
          <Text numberOfLines={2} variant="headline">
            {item.item}
          </Text>
          <Text numberOfLines={1} tone="muted" variant="subhead">
            {stockCategoryLabel(item)}
          </Text>
        </View>
        <Icon color={colors.subtle} name="chevronRight" size={14} />
      </View>
      <View style={styles.bottom}>
        <View style={[styles.status, { backgroundColor: status.background }]}>
          <View style={[styles.dot, { backgroundColor: status.color }]} />
          <Text style={{ color: status.color }} variant="subhead" weight="700">
            {status.label}
          </Text>
        </View>
        <Text style={styles.price} tone="accent" variant="headline" weight="700">
          {formatCurrency(item.price)}
        </Text>
      </View>
    </Card>
  );

  return (
    <SwipeRow
      actions={[
        { label: "Editar", icon: "edit", color: colors.orange, onPress: () => onEdit(item) },
        { label: "Excluir", icon: "trash", color: colors.danger, onPress: () => onDelete(item) },
      ]}
      style={styles.wrap}
    >
      {card}
    </SwipeRow>
  );
}

export default memo(StockItemCard);

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  card: { gap: 14 },
  top: { alignItems: "center", flexDirection: "row", gap: 12 },
  text: { flex: 1, gap: 3 },
  bottom: { alignItems: "center", flexDirection: "row", gap: 12, justifyContent: "space-between" },
  status: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    flexShrink: 1,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: { borderRadius: 5, height: 10, width: 10 },
  price: { fontVariant: ["tabular-nums"] },
});
