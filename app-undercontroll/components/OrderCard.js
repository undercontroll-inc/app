import { Pressable, StyleSheet, Text, View } from "react-native";

export default function OrderCard({ order, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.number}>#{order.id}</Text>
        <Text style={[styles.badge, statusStyles[order.status]]}>
          {order.status}
        </Text>
      </View>
      <Text style={styles.client}>Cliente: {order.client}</Text>
      <Text style={styles.device}>{order.device}</Text>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.dateLabel}>Recebimento</Text>
        <Text style={styles.date}>{order.date}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: "#dce4ee",
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 18,
    padding: 22,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  number: { color: "#092542", fontSize: 28, fontWeight: "800" },
  badge: {
    borderRadius: 10,
    fontSize: 14,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  done: { backgroundColor: "#def4ed", color: "#0b9f76" },
  delivered: { backgroundColor: "#def5fa", color: "#099ab3" },
  pending: { backgroundColor: "#fff7de", color: "#c79200" },
  analysis: { backgroundColor: "#ffe8e8", color: "#d83e3e" },
  client: { color: "#092542", fontSize: 18, fontWeight: "600", marginTop: 24 },
  device: { color: "#667994", fontSize: 16, marginTop: 10 },
  divider: { backgroundColor: "#dce4ee", height: 1, marginVertical: 20 },
  dateLabel: { color: "#667994", fontSize: 14 },
  date: { color: "#092542", fontSize: 15, fontWeight: "800" },
});

const statusStyles = {
  Concluído: styles.done,
  Entregue: styles.delivered,
  Pendente: styles.pending,
  "Em análise": styles.analysis,
};
