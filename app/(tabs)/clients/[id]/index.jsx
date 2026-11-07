import { memo, useCallback, useMemo } from "react";
import { FlatList, Linking, Pressable, StyleSheet, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import Avatar from "../../../../components/ui/Avatar";
import Card from "../../../../components/ui/Card";
import Icon from "../../../../components/ui/Icon";
import ListSection, { Row } from "../../../../components/ui/ListSection";
import StateView from "../../../../components/ui/StateView";
import StatusBadge from "../../../../components/ui/StatusBadge";
import Text from "../../../../components/ui/Text";
import { useCustomer } from "../../../../hooks/queries/useCustomers";
import { useOrders } from "../../../../hooks/queries/useOrders";
import { getErrorMessage } from "../../../../providers/api";
import { telUrl, whatsappUrl } from "../../../../utils/contact";
import { haptics } from "../../../../utils/haptics";
import {
  formatAppliance,
  formatDateBR,
  formatUserName,
  getStatusColors,
  ORDER_STATUS_LABEL,
} from "../../../../utils/orders";
import { colors, radius } from "../../../../theme";

function QuickAction({ icon, label, onPress, tone = "orange" }) {
  const color = tone === "green" ? colors.success : colors.orange;
  const background = tone === "green" ? colors.successSoft : colors.orangeSoft;
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => {
        haptics.light();
        onPress();
      }}
      style={({ pressed }) => [styles.quick, pressed && styles.pressed]}
    >
      <View style={[styles.quickIcon, { backgroundColor: background }]}>
        <Icon color={color} name={icon} size={22} />
      </View>
      <Text variant="subhead" weight="600">
        {label}
      </Text>
    </Pressable>
  );
}

const ClientOrderRow = memo(function ClientOrderRow({ order, onPress }) {
  const status = String(order.status || "Sem status");
  const statusColors = getStatusColors(status);
  return (
    <Card accessibilityLabel={`Ordem ${order.id}`} onPress={() => onPress(order)} style={styles.orderCard}>
      <View style={styles.orderTop}>
        <Text variant="headline">OS #{order.id}</Text>
        <StatusBadge background={statusColors.background} color={statusColors.color} label={status} />
      </View>
      <Text numberOfLines={1} tone="muted" variant="subhead">
        {formatAppliance(order.appliances?.[0])}
      </Text>
      <Text tone="muted" variant="footnote">
        Recebido em {formatDateBR(order.receivedAt) || "data não informada"}
      </Text>
    </Card>
  );
});

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams();
  const customerQuery = useCustomer(id);
  const ordersQuery = useOrders({ userId: id, enabled: customerQuery.isSuccess });
  const client = customerQuery.data ?? null;
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
  const name = client ? formatUserName(client) : "Cliente";

  function openContact(url) {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  }

  if (customerQuery.isPending || customerQuery.isError) {
    return (
      <View style={styles.screen}>
        <StateView
          error={customerQuery.isError ? getErrorMessage(customerQuery.error) : null}
          loading={customerQuery.isPending}
          loadingText="Carregando cliente..."
          onRetry={customerQuery.refetch}
        />
      </View>
    );
  }

  const details = [
    ["Telefone", client.phone],
    ["E-mail", client.email],
    ["CPF", client.cpf],
    ["CEP", client.CEP],
    ["Endereço", client.address],
  ];

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: name }} />
      <FlatList
        ListEmptyComponent={
          <StateView
            error={ordersQuery.isError ? getErrorMessage(ordersQuery.error) : null}
            icon="wrench"
            loading={ordersQuery.isPending}
            onRetry={ordersQuery.refetch}
            title="Nenhuma ordem ainda"
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.identity}>
              <Avatar name={name} size={72} uri={client.avatarUrl} />
              <Text align="center" variant="title2">
                {name}
              </Text>
            </View>
            <View style={styles.quickRow}>
              {callUrl ? <QuickAction icon="phone" label="Ligar" onPress={() => openContact(callUrl)} /> : null}
              {chatUrl ? (
                <QuickAction icon="whatsapp" label="WhatsApp" onPress={() => openContact(chatUrl)} tone="green" />
              ) : null}
              <QuickAction icon="edit" label="Editar" onPress={() => router.push(`/clients/${id}/edit`)} />
            </View>
            <ListSection title="Dados">
              {details.map(([label, value], index) => (
                <Row key={label} label={label} last={index === details.length - 1} value={value || "Não informado"} />
              ))}
            </ListSection>
            <Text style={styles.historyTitle} tone="muted" variant="footnote" weight="600">
              HISTÓRICO DE ORDENS
            </Text>
          </View>
        }
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={ordersQuery.isPending || ordersQuery.isError ? [] : orders}
        keyExtractor={(order) => String(order.id)}
        renderItem={renderOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { gap: 20, marginBottom: 12 },
  identity: { alignItems: "center", gap: 10 },
  quickRow: { flexDirection: "row", gap: 10 },
  quick: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    flex: 1,
    gap: 8,
    minHeight: 88,
    justifyContent: "center",
    paddingVertical: 12,
  },
  quickIcon: { alignItems: "center", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  historyTitle: { letterSpacing: 0.3, marginBottom: -8, paddingHorizontal: 4 },
  orderCard: { gap: 4, marginBottom: 10 },
  orderTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  pressed: { opacity: 0.8 },
});
