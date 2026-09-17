import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppShell from "../../../components/AppShell";
import AppHeader from "../../../components/AppHeader";
import OrderCard from "../../../components/OrderCard";
import SearchField from "../../../components/SearchField";
import { ActionMenuSheet, useActionMenu } from "../../../components/ActionMenu";
import { getAxiosErrorMessage } from "../../../providers/api";
import { orderService } from "../../../services/OrderService";
import { ORDER_STATUS_API, toOrderCard } from "../../../utils/orders";

const filters = ["Todos", "Pendentes", "Em análise", "Concluídos"];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Todos");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const menu = useActionMenu();

  const loadOrders = useCallback(async () => {
    try {
      setError("");
      const response = await orderService.list({ page: 0, size: 50 });
      setOrders((response.data ?? []).map(toOrderCard));
    } catch (err) {
      setError(getAxiosErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOrders();
    }, [loadOrders]),
  );

  const visibleOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesSearch = `${order.id} ${order.client} ${order.device}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesFilter =
          selectedFilter === "Todos" ||
          (selectedFilter === "Pendentes" && order.status === "Pendente") ||
          (selectedFilter === "Concluídos" && order.status === "Concluído") ||
          order.status === selectedFilter;
        return matchesSearch && matchesFilter;
      }),
    [orders, search, selectedFilter],
  );

  const fabBottom = Platform.OS === "ios" ? 16 + Math.max(insets.bottom, 8) : 22;

  function openNew() {
    router.push("/orders/new");
  }

  function isCompleted(order) {
    return order.status === "Concluído" || order.status === "Entregue";
  }

  function openOrderActions(order) {
    const completed = isCompleted(order);
    menu.show({
      title: `OS #${order.id}`,
      message: order.client,
      options: [
        {
          label: completed ? "Marcar como pendente" : "Marcar como concluída",
          onPress: () => setOrderCompleted(order, !completed),
        },
        {
          label: "Excluir",
          destructive: true,
          onPress: () => deleteOrder(order),
        },
        { label: "Cancelar", cancel: true },
      ],
    });
  }

  async function setOrderCompleted(order, completed) {
    const nextStatus = completed ? "Concluído" : "Pendente";
    const previous = order.status;
    setOrders((current) =>
      current.map((item) => (item.id === order.id ? { ...item, status: nextStatus } : item)),
    );
    try {
      await orderService.update(order.id, { status: ORDER_STATUS_API[nextStatus] });
    } catch (err) {
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? { ...item, status: previous } : item)),
      );
      setError(getAxiosErrorMessage(err));
    }
  }

  async function deleteOrder(order) {
    try {
      await orderService.remove(order.id);
      setOrders((current) => current.filter((item) => item.id !== order.id));
    } catch (err) {
      setError(getAxiosErrorMessage(err));
    }
  }

  function renderEmpty() {
    if (loading) {
      return (
        <View style={styles.state}>
          <ActivityIndicator color="#ef7f19" />
          <Text style={styles.stateText}>Carregando ordens...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.state}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadOrders} style={styles.retry}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }
    return <Text style={styles.empty}>Nenhuma ordem de serviço encontrada.</Text>;
  }

  return (
    <AppShell>
      <AppHeader />
      <FlatList
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Ordens de Serviço</Text>
            <SearchField onChangeText={setSearch} placeholder="OS ou cliente" value={search} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
              {filters.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setSelectedFilter(item)}
                  style={[styles.filter, selectedFilter === item && styles.activeFilter]}
                >
                  <Text style={[styles.filterText, selectedFilter === item && styles.activeFilterText]}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        contentContainerStyle={styles.content}
        data={loading || error ? [] : visibleOrders}
        keyExtractor={(order) => order.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <OrderCard
            onLongPress={() => openOrderActions(item)}
            onPress={() => router.push(`/orders/${item.id}`)}
            order={item}
          />
        )}
      />
      <Pressable
        onPress={openNew}
        style={({ pressed }) => [styles.newButton, { bottom: fabBottom }, pressed && styles.pressed]}
      >
        <Text style={styles.newButtonText}>＋ Nova O.S.</Text>
      </Pressable>
      <ActionMenuSheet config={menu.config} onClose={menu.close} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
  title: { color: "#092542", fontSize: 22, fontWeight: "800", marginBottom: 12 },
  filters: { flexGrow: 0, marginBottom: 12, marginTop: 12 },
  filter: {
    alignItems: "center",
    borderColor: "#dce4ee",
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterText: { color: "#667994", fontSize: 14 },
  activeFilter: { backgroundColor: "#ef7f19", borderColor: "#ef7f19" },
  activeFilterText: { color: "#fff", fontWeight: "700" },
  newButton: {
    alignSelf: "flex-end",
    backgroundColor: "#ef7f19",
    borderRadius: 28,
    elevation: 8,
    paddingHorizontal: 22,
    paddingVertical: 16,
    position: "absolute",
    right: 16,
    shadowColor: "#092542",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
  },
  newButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.8 },
  state: { alignItems: "center", paddingVertical: 32 },
  stateText: { color: "#667994", fontSize: 15, marginTop: 12 },
  errorText: { color: "#d71929", fontSize: 15, textAlign: "center" },
  retry: { marginTop: 12, padding: 10 },
  retryText: { color: "#ef7f19", fontSize: 15, fontWeight: "700" },
  empty: { color: "#667994", fontSize: 16, marginTop: 12, textAlign: "center" },
});
