import { useCallback, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppShell from "../../components/AppShell";
import AppHeader from "../../components/AppHeader";
import ClientCard from "../../components/ClientCard";
import { getAxiosErrorMessage } from "../../providers/api";
import { orderService } from "../../services/OrderService";
import { userService } from "../../services/UserService";
import { ORDER_STATUS_LABEL } from "../../utils/orders";

export default function ClientsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadClients = useCallback(async () => {
    try {
      setError("");
      setClients(await userService.getCustomers());
    } catch (err) {
      setError(getAxiosErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadClients();
    }, [loadClients]),
  );

  async function toggleClient(client) {
    const nextExpanded = expandedId === client.id ? null : client.id;
    setExpandedId(nextExpanded);
    if (nextExpanded == null || history[client.id]) return;

    setHistory((current) => ({ ...current, [client.id]: { loading: true, data: [], error: "" } }));
    try {
      const response = await orderService.list({ userId: client.id, page: 0, size: 50 });
      const data = (response.data ?? []).map((order) => ({ ...order, status: ORDER_STATUS_LABEL[order.status] || order.status }));
      setHistory((current) => ({ ...current, [client.id]: { loading: false, data, error: "" } }));
    } catch (err) {
      setHistory((current) => ({ ...current, [client.id]: { loading: false, data: [], error: getAxiosErrorMessage(err) } }));
    }
  }

  const normalizedSearch = search.trim().toLowerCase();
  const visibleClients = clients.filter((client) => {
    const searchable = `${client.name || ""} ${client.lastName || ""} ${client.cpf || ""} ${client.phone || ""} ${client.email || ""}`.toLowerCase();
    return searchable.includes(normalizedSearch);
  });
  const fabBottom = Platform.OS === "ios" ? 16 + Math.max(insets.bottom, 8) : 22;

  return (
    <AppShell>
      <AppHeader />
      <View style={styles.scrollWrap}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Gestão de Clientes</Text>
          <View style={styles.search}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput onChangeText={setSearch} placeholder="Pesquise por nome ou CPF..." placeholderTextColor="#667994" style={styles.searchInput} value={search} />
          </View>
          {loading && (
            <View style={styles.state}>
              <ActivityIndicator color="#ef7f19" />
              <Text style={styles.stateText}>Carregando clientes...</Text>
            </View>
          )}
          {!loading && !!error && (
            <View style={styles.state}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={loadClients} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text></Pressable>
            </View>
          )}
          {!loading && !error && visibleClients.length === 0 && <Text style={styles.empty}>Nenhum cliente encontrado.</Text>}
          {!loading && !error && visibleClients.length > 0 && (
            <View style={styles.clientsList}>
              {visibleClients.map((client) => {
                const clientHistory = history[client.id] || { data: [], loading: false, error: "" };
                return <ClientCard key={client.id} client={client} expanded={expandedId === client.id} history={clientHistory.data} historyError={clientHistory.error} historyLoading={clientHistory.loading} onEdit={() => router.push(`/clients/${client.id}`)} onToggle={() => toggleClient(client)} />;
              })}
            </View>
          )}
        </ScrollView>
      </View>
      <Pressable accessibilityLabel="Cadastrar novo cliente" onPress={() => router.push("/clients/new")} style={({ pressed }) => [styles.newButton, { bottom: fabBottom }, pressed && styles.pressed]}>
        <Text style={styles.newButtonText}>＋ Novo Cliente</Text>
      </Pressable>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scrollWrap: { flex: 1 },
  content: { padding: 24, paddingBottom: 120 },
  title: { color: "#092542", fontSize: 30, fontWeight: "800", marginBottom: 24 },
  search: { alignItems: "center", borderColor: "#dce4ee", borderRadius: 14, borderWidth: 2, flexDirection: "row", height: 62, paddingHorizontal: 16 },
  searchIcon: { color: "#667994", fontSize: 30 },
  searchInput: { color: "#092542", flex: 1, fontSize: 16, marginLeft: 8 },
  clientsList: { marginTop: 16 },
  state: { alignItems: "center", paddingVertical: 32 },
  stateText: { color: "#667994", fontSize: 15, marginTop: 12 },
  errorText: { color: "#d71929", fontSize: 15, textAlign: "center" },
  retry: { padding: 10 },
  retryText: { color: "#ef7f19", fontSize: 15, fontWeight: "700" },
  empty: { color: "#667994", fontSize: 16, marginTop: 28, textAlign: "center" },
  newButton: { alignSelf: "flex-end", backgroundColor: "#ef7f19", borderRadius: 28, elevation: 8, paddingHorizontal: 22, paddingVertical: 16, position: "absolute", right: 22, shadowColor: "#092542", shadowOffset: { height: 6, width: 0 }, shadowOpacity: 0.25, shadowRadius: 8 },
  newButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.8 },
});
