import { useCallback, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppShell from "../../../components/AppShell";
import AppHeader from "../../../components/AppHeader";
import OrderCard from "../../../components/OrderCard";
import { getAxiosErrorMessage } from "../../../providers/api";
import { orderService } from "../../../services/OrderService";
import { toOrderCard } from "../../../utils/orders";

const filters = ["Todos", "Pendentes", "Em análise", "Concluídos"];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Todos");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const visibleOrders = orders.filter((order) => {
    const matchesSearch = `${order.id} ${order.client} ${order.device}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      selectedFilter === "Todos" ||
      (selectedFilter === "Pendentes" && order.status === "Pendente") ||
      (selectedFilter === "Concluídos" && order.status === "Concluído") ||
      order.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const fabBottom = Platform.OS === "ios" ? 16 + Math.max(insets.bottom, 8) : 22;

  return (
    <AppShell>
      <AppHeader />
      <View collapsable={false} style={styles.scrollWrap}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Ordens de Serviço</Text>
          <View style={styles.search}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput onChangeText={setSearch} placeholder="Pesquise por OS ou cliente..." placeholderTextColor="#667994" style={styles.searchInput} value={search} />
          </View>
          <View style={styles.filters}>
            {filters.map((item) => (
              <Pressable key={item} onPress={() => setSelectedFilter(item)} style={[styles.filter, selectedFilter === item && styles.activeFilter]}>
                <Text style={[styles.filterText, selectedFilter === item && styles.activeFilterText]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          {loading && (
            <View style={styles.state}>
              <ActivityIndicator color="#ef7f19" />
              <Text style={styles.stateText}>Carregando ordens...</Text>
            </View>
          )}
          {!loading && !!error && (
            <View style={styles.state}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={loadOrders} style={styles.retry}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          )}
          {!loading && !error && visibleOrders.length === 0 && (
            <Text style={styles.empty}>Nenhuma ordem de serviço encontrada.</Text>
          )}
          {!loading && !error && visibleOrders.map((order) => (
            <OrderCard key={order.id} order={order} onPress={() => router.push(`/orders/${order.id}`)} />
          ))}
        </ScrollView>
      </View>
      <Pressable
        onPress={() => router.push("/orders/new")}
        style={({ pressed }) => [styles.newButton, { bottom: fabBottom }, pressed && styles.pressed]}
      >
        <Text style={styles.newButtonText}>＋ Nova O.S.</Text>
      </Pressable>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scrollWrap: { flex: 1 },
  content: { padding: 24, paddingBottom: 120 },
  title: { color: "#092542", fontSize: 32, fontWeight: "800", marginBottom: 26 },
  search: { alignItems: "center", borderColor: "#dce4ee", borderRadius: 14, borderWidth: 2, flexDirection: "row", height: 62, paddingHorizontal: 16 },
  searchIcon: { color: "#667994", fontSize: 30 },
  searchInput: { color: "#092542", flex: 1, fontSize: 16, marginLeft: 8 },
  filters: { flexDirection: "row", gap: 6, marginVertical: 24 },
  filter: { alignItems: "center", borderColor: "#dce4ee", borderRadius: 22, borderWidth: 2, flex: 1, justifyContent: "center", minWidth: 0, paddingHorizontal: 4, paddingVertical: 10 },
  filterText: { color: "#667994", fontSize: 13, textAlign: "center" },
  activeFilter: { backgroundColor: "#ef7f19", borderColor: "#ef7f19" },
  activeFilterText: { color: "#fff", fontWeight: "700" },
  newButton: { alignSelf: "flex-end", backgroundColor: "#ef7f19", borderRadius: 28, elevation: 8, paddingHorizontal: 22, paddingVertical: 16, position: "absolute", right: 22, shadowColor: "#092542", shadowOffset: { height: 6, width: 0 }, shadowOpacity: 0.25, shadowRadius: 8 },
  newButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.8 },
  state: { alignItems: "center", paddingVertical: 32 },
  stateText: { color: "#667994", fontSize: 15, marginTop: 12 },
  errorText: { color: "#d71929", fontSize: 15, textAlign: "center" },
  retry: { marginTop: 12, padding: 10 },
  retryText: { color: "#ef7f19", fontSize: 15, fontWeight: "700" },
  empty: { color: "#667994", fontSize: 16, marginTop: 12, textAlign: "center" },
});
