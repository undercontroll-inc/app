import { Pressable, StyleSheet, Text, View } from "react-native";
import { getStatusColors } from "../utils/orders";

export default function OrderCard({ order, onPress, onLongPress }) {
  const colors = getStatusColors(order.status);
  return (
    <Pressable delayLongPress={350} onLongPress={onLongPress} onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.number}>#{order.id}</Text>
        <Text style={[styles.badge, { backgroundColor: colors.background, color: colors.color }]}>{order.status}</Text>
      </View>
      <Text style={styles.client}>{order.client}</Text>
      <Text style={styles.device}>{order.device}</Text>
      <Text style={styles.date}>Recebimento {order.date}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: "#dce4ee",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  number: { color: "#092542", fontSize: 18, fontWeight: "800" },
  badge: {
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  client: { color: "#092542", fontSize: 15, fontWeight: "600", marginTop: 8 },
  device: { color: "#667994", fontSize: 14, marginTop: 2 },
  date: { color: "#667994", fontSize: 13, marginTop: 8 },
});
