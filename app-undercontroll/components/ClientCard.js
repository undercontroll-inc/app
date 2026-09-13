import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { formatAppliance, formatDateBR, formatUserName } from "../utils/orders";

function initials(client) {
  return formatUserName(client)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function ClientCard({ client, expanded, history, historyError, historyLoading, onEdit, onToggle }) {
  const safeHistory = Array.isArray(history) ? history : [];

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityLabel={`${expanded ? "Recolher" : "Expandir"} dados de ${formatUserName(client)}`}
        onPress={onToggle}
        style={({ pressed }) => [styles.summary, expanded && styles.selectedSummary, pressed && styles.pressed]}
      >
        {client.avatarUrl ? (
          <Image source={{ uri: client.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initials(client)}</Text>
          </View>
        )}
        <View style={styles.summaryCopy}>
          <Text numberOfLines={1} style={styles.name}>{formatUserName(client)}</Text>
          <Text style={styles.phone}>{client.phone || "Telefone não informado"}</Text>
        </View>
        <Feather color="#667994" name={expanded ? "chevron-up" : "chevron-down"} size={22} />
      </Pressable>

      {expanded && (
        <View style={styles.details}>
          <Detail label="E-mail" value={client.email} />
          <Detail label="CPF" value={client.cpf} />
          <Detail label="CEP" value={client.CEP} />
          <Detail label="Endereço" value={client.address} />
          <Pressable accessibilityLabel={`Editar ${formatUserName(client)}`} onPress={onEdit} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
            <Feather color="#ef7f19" name="edit-2" size={16} />
            <Text style={styles.editText}>Editar cliente</Text>
          </Pressable>
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Histórico Recente</Text>
            {historyLoading ? (
              <View style={styles.historyState}>
                <ActivityIndicator color="#ef7f19" size="small" />
                <Text style={styles.muted}>Carregando ordens...</Text>
              </View>
            ) : historyError ? (
              <Text style={styles.error}>{String(historyError)}</Text>
            ) : safeHistory.length === 0 ? (
              <Text style={styles.muted}>Nenhuma ordem encontrada.</Text>
            ) : (
              safeHistory.map((order) => {
                const status = String(order.status || "Sem status");
                return (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderTitle}>OS: #{order.id}</Text>
                      <Text style={styles.orderDate}>{String(formatDateBR(order.receivedAt) || "Data não informada")}</Text>
                    </View>
                    <View style={styles.orderFooter}>
                      <Text numberOfLines={1} style={styles.orderMeta}>{String(formatAppliance(order.appliances?.[0]))}</Text>
                      <View style={styles.statusWrap}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                        <Text style={[styles.status, { color: getStatusColor(status) }]}>{status}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function getStatusColor(status) {
  if (status === "Concluído") return "#0b9f76";
  if (status === "Entregue") return "#099ab3";
  if (status === "Pendente") return "#c79200";
  if (status === "Em análise") return "#d83e3e";
  return "#667994";
}

function Detail({ label, value }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "Não informado"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderColor: "#dce4ee", borderRadius: 16, borderWidth: 2, marginBottom: 14, overflow: "hidden" },
  summary: { alignItems: "center", flexDirection: "row", minHeight: 92, padding: 16 },
  selectedSummary: { backgroundColor: "#eef3f8" },
  avatar: { backgroundColor: "#dce4ee", borderRadius: 28, height: 56, width: 56 },
  avatarFallback: { alignItems: "center", backgroundColor: "#092542", borderRadius: 28, height: 56, justifyContent: "center", width: 56 },
  avatarText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  summaryCopy: { flex: 1, marginHorizontal: 14 },
  name: { color: "#092542", fontSize: 17, fontWeight: "800" },
  phone: { color: "#667994", fontSize: 14, marginTop: 5 },
  details: { borderColor: "#dce4ee", borderTopWidth: 1, padding: 16 },
  detail: { marginBottom: 12 },
  detailLabel: { color: "#667994", fontSize: 12, marginBottom: 3 },
  detailValue: { color: "#092542", fontSize: 15 },
  editButton: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 8, marginBottom: 4, paddingVertical: 8 },
  editText: { color: "#ef7f19", fontSize: 14, fontWeight: "800" },
  historySection: { borderColor: "#dce4ee", borderTopWidth: 1, marginTop: 4, paddingTop: 16 },
  historyTitle: { color: "#092542", fontSize: 16, fontWeight: "800", marginBottom: 12 },
  historyState: { alignItems: "center", flexDirection: "row", gap: 8 },
  muted: { color: "#667994", fontSize: 14 },
  error: { color: "#d71929", fontSize: 14 },
  orderCard: { backgroundColor: "#f3f6fa", borderColor: "#dce4ee", borderRadius: 8, borderWidth: 1, marginBottom: 8, padding: 10 },
  orderHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  orderFooter: { alignItems: "center", flexDirection: "row", marginTop: 8 },
  orderTitle: { color: "#092542", fontSize: 13, fontWeight: "800" },
  orderDate: { color: "#667994", fontSize: 12 },
  orderMeta: { color: "#667994", flex: 1, fontSize: 13, marginRight: 8 },
  statusWrap: { alignItems: "center", flexDirection: "row" },
  statusDot: { borderRadius: 4, height: 8, marginRight: 5, width: 8 },
  status: { fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});