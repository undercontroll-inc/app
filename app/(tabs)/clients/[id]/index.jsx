import { memo, useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import AppShell from "../../../../components/AppShell";
import ScreenHeader from "../../../../components/ScreenHeader";
import { useTabBarVisibility } from "../../../../contexts/TabBarVisibilityContext";
import { useCustomer } from "../../../../hooks/queries/useCustomers";
import { useOrders } from "../../../../hooks/queries/useOrders";
import { getErrorMessage } from "../../../../providers/api";
import { telUrl, whatsappUrl } from "../../../../utils/contact";
import {
  formatAppliance,
  formatDateBR,
  formatUserName,
  getStatusColors,
  ORDER_STATUS_LABEL,
} from "../../../../utils/orders";

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams();
  const { setHidden } = useTabBarVisibility();
  useFocusEffect(
    useCallback(() => {
      setHidden(true);
      return () => setHidden(false);
    }, [setHidden]),
  );

  const customerQuery = useCustomer(id);
  const ordersQuery = useOrders({ userId: id, enabled: customerQuery.isSuccess });
  const client = customerQuery.data ?? null;
  const loading = customerQuery.isPending;
  const error = customerQuery.isError ? getErrorMessage(customerQuery.error) : "";
  const historyLoading = ordersQuery.isPending;
  const historyError = ordersQuery.isError ? getErrorMessage(ordersQuery.error) : "";
  const orders = useMemo(
    () =>
      (ordersQuery.data ?? []).map((order) => ({
        ...order,
        status: ORDER_STATUS_LABEL[order.status] || order.status,
      })),
    [ordersQuery.data],
  );

  const openOrder = useCallback((order) => router.push(`/orders/${order.id}`), []);
  const renderOrder = useCallback(({ item }) => <ClientOrderRow onPress={openOrder} order={item} />, [openOrder]);

  const callUrl = telUrl(client?.phone);
  const chatUrl = client?.hasWhatsApp ? whatsappUrl(client?.phone) : null;

  function openContact(url) {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  }

  return (
    <AppShell>
      <ScreenHeader
        closeLabel="Fechar ficha do cliente"
        onClose={() => router.back()}
        title={client ? formatUserName(client) : "Cliente"}
      />
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#ef7f19" />
          <Text style={styles.muted}>Carregando cliente...</Text>
        </View>
      ) : error ? (
        <View style={styles.state}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => customerQuery.refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          ListEmptyComponent={
            historyLoading ? (
              <View style={styles.historyState}>
                <ActivityIndicator color="#ef7f19" size="small" />
                <Text style={styles.muted}>Carregando ordens...</Text>
              </View>
            ) : historyError ? (
              <Text style={styles.error}>{historyError}</Text>
            ) : (
              <Text style={styles.muted}>Nenhuma ordem encontrada.</Text>
            )
          }
          ListHeaderComponent={
            <>
              <Text style={styles.phone}>{client.phone || "Telefone não informado"}</Text>
              <View style={styles.actions}>
                {callUrl ? (
                  <Pressable
                    onPress={() => openContact(callUrl)}
                    style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                  >
                    <Feather color="#ef7f19" name="phone" size={16} />
                    <Text style={styles.actionText}>Ligar</Text>
                  </Pressable>
                ) : null}
                {chatUrl ? (
                  <Pressable
                    onPress={() => openContact(chatUrl)}
                    style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                  >
                    <Feather color="#ef7f19" name="message-circle" size={16} />
                    <Text style={styles.actionText}>WhatsApp</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => router.push(`/clients/${id}/edit`)}
                  style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                >
                  <Feather color="#ef7f19" name="edit-2" size={16} />
                  <Text style={styles.actionText}>Editar</Text>
                </Pressable>
              </View>

              <View style={styles.section}>
                <Detail label="E-mail" value={client.email} />
                <Detail label="CPF" value={client.cpf} />
                <Detail label="CEP" value={client.CEP} />
                <Detail label="Endereço" value={client.address} />
              </View>

              <Text style={styles.historyTitle}>Histórico recente</Text>
            </>
          }
          contentContainerStyle={styles.content}
          data={historyLoading || historyError ? [] : orders}
          keyExtractor={(order) => String(order.id)}
          renderItem={renderOrder}
          showsVerticalScrollIndicator={false}
        />
      )}
    </AppShell>
  );
}

const ClientOrderRow = memo(function ClientOrderRow({ order, onPress }) {
  const status = String(order.status || "Sem status");
  const { color } = getStatusColors(status);
  return (
    <Pressable onPress={() => onPress(order)} style={({ pressed }) => [styles.orderCard, pressed && styles.pressed]}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle}>OS #{order.id}</Text>
        <Text style={styles.orderDate}>{formatDateBR(order.receivedAt) || "Data não informada"}</Text>
      </View>
      <View style={styles.orderFooter}>
        <Text numberOfLines={1} style={styles.orderMeta}>
          {formatAppliance(order.appliances?.[0])}
        </Text>
        <View style={styles.statusWrap}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={[styles.status, { color }]}>{status}</Text>
        </View>
      </View>
    </Pressable>
  );
});

function Detail({ label, value }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "Não informado"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  state: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  phone: { color: "#667994", fontSize: 15, marginBottom: 16 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  action: {
    alignItems: "center",
    borderColor: "#ef7f19",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionText: { color: "#ef7f19", fontSize: 14, fontWeight: "700" },
  section: {
    borderColor: "#dce4ee",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    padding: 14,
  },
  detail: { marginBottom: 12 },
  detailLabel: { color: "#667994", fontSize: 12, marginBottom: 3 },
  detailValue: { color: "#092542", fontSize: 15 },
  historyTitle: { color: "#092542", fontSize: 16, fontWeight: "800", marginBottom: 12 },
  historyState: { alignItems: "center", flexDirection: "row", gap: 8 },
  muted: { color: "#667994", fontSize: 14, marginTop: 12 },
  error: { color: "#d71929", fontSize: 15, textAlign: "center" },
  retry: { marginTop: 12, padding: 10 },
  retryText: { color: "#ef7f19", fontSize: 15, fontWeight: "700" },
  orderCard: {
    backgroundColor: "#f3f6fa",
    borderColor: "#dce4ee",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    padding: 12,
  },
  orderHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  orderFooter: { alignItems: "center", flexDirection: "row", marginTop: 8 },
  orderTitle: { color: "#092542", fontSize: 14, fontWeight: "800" },
  orderDate: { color: "#667994", fontSize: 12 },
  orderMeta: { color: "#667994", flex: 1, fontSize: 13, marginRight: 8 },
  statusWrap: { alignItems: "center", flexDirection: "row" },
  statusDot: { borderRadius: 4, height: 8, marginRight: 5, width: 8 },
  status: { fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
