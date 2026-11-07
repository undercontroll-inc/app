import { memo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Card from "./ui/Card";
import Icon from "./ui/Icon";
import StatusBadge from "./ui/StatusBadge";
import SwipeRow from "./ui/SwipeRow";
import Text from "./ui/Text";
import { getStatusColors, isOrderCompleted } from "../utils/orders";
import { colors } from "../theme";

function OrderCard({ order, onPress, onLongPress, onToggleStatus, onDelete }) {
  const status = getStatusColors(order.status);
  const completed = isOrderCompleted(order.status);
  const actions = [];
  if (onToggleStatus) {
    actions.push(
      completed
        ? { label: "Reabrir", icon: "refresh", color: colors.warning, onPress: () => onToggleStatus(order) }
        : { label: "Concluir", icon: "checkCircle", color: colors.success, onPress: () => onToggleStatus(order) },
    );
  }
  if (onDelete) actions.push({ label: "Excluir", icon: "trash", color: colors.danger, onPress: () => onDelete(order) });

  return (
    <SwipeRow actions={actions} style={styles.wrap}>
      <Card
        accessibilityLabel={`Ordem ${order.id}, ${order.client}, ${order.status}`}
        onLongPress={Platform.OS === "ios" ? undefined : () => onLongPress?.(order)}
        onPress={() => onPress?.(order)}
        style={styles.card}
      >
        <View style={styles.top}>
          <Text tone="muted" variant="subhead" weight="600">
            OS #{order.id}
          </Text>
          <StatusBadge background={status.background} color={status.color} label={order.status} />
        </View>
        <View style={styles.main}>
          <View style={styles.text}>
            <Text numberOfLines={1} variant="headline">
              {order.client}
            </Text>
            <Text numberOfLines={1} tone="muted" variant="subhead">
              {order.device}
            </Text>
            {order.date ? (
              <Text tone="muted" variant="footnote">
                Recebido em {order.date}
              </Text>
            ) : null}
          </View>
          <Icon color={colors.subtle} name="chevronRight" size={14} />
        </View>
      </Card>
    </SwipeRow>
  );
}

export default memo(OrderCard);

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  card: { gap: 10 },
  top: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  main: { alignItems: "center", flexDirection: "row", gap: 12 },
  text: { flex: 1, gap: 3 },
});
