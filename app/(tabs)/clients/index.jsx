import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "../../../components/AppHeader";
import AppShell from "../../../components/AppShell";
import ClientCard from "../../../components/ClientCard";
import SearchField from "../../../components/SearchField";
import { ActionMenuSheet, useActionMenu } from "../../../components/ActionMenu";
import { useCustomers, useDeleteCustomer } from "../../../hooks/queries/useCustomers";
import useRefreshOnFocus from "../../../hooks/useRefreshOnFocus";
import { getErrorMessage } from "../../../providers/api";
import { telUrl, whatsappUrl } from "../../../utils/contact";
import { formatUserName } from "../../../utils/orders";

export default function ClientsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");
  const [pulling, setPulling] = useState(false);
  const menu = useActionMenu();
  const customersQuery = useCustomers();
  const deleteCustomer = useDeleteCustomer();
  const { refetch } = customersQuery;
  useRefreshOnFocus(refetch);

  const clients = useMemo(() => customersQuery.data ?? [], [customersQuery.data]);
  const loading = customersQuery.isPending;
  const error = customersQuery.isError ? getErrorMessage(customersQuery.error) : "";

  async function onRefresh() {
    setPulling(true);
    await refetch();
    setPulling(false);
  }

  const visibleClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return clients.filter((client) => {
      const searchable =
        `${client.name || ""} ${client.lastName || ""} ${client.cpf || ""} ${client.phone || ""} ${client.email || ""}`.toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [clients, search]);

  const fabBottom = Platform.OS === "ios" ? 16 + Math.max(insets.bottom, 8) : 22;

  function openContact(url) {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      setActionError("Não foi possível abrir o aplicativo.");
    });
  }

  function openClientActions(client) {
    const callUrl = telUrl(client.phone);
    const chatUrl = client.hasWhatsApp ? whatsappUrl(client.phone) : null;
    const options = [];
    if (callUrl) {
      options.push({ label: "Ligar", onPress: () => openContact(callUrl) });
    }
    if (chatUrl) {
      options.push({ label: "WhatsApp", onPress: () => openContact(chatUrl) });
    }
    options.push(
      { label: "Editar", onPress: () => router.push(`/clients/${client.id}/edit`) },
      {
        label: "Excluir",
        destructive: true,
        onPress: () => deleteClient(client),
      },
      { label: "Cancelar", cancel: true },
    );
    menu.show({
      title: formatUserName(client),
      message: client.phone || undefined,
      options,
    });
  }

  function deleteClient(client) {
    setActionError("");
    deleteCustomer.mutate(client.id, { onError: (err) => setActionError(getErrorMessage(err)) });
  }

  function renderEmpty() {
    if (loading) {
      return (
        <View style={styles.state}>
          <ActivityIndicator color="#ef7f19" />
          <Text style={styles.stateText}>Carregando clientes...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.state}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }
    return <Text style={styles.empty}>Nenhum cliente encontrado.</Text>;
  }

  return (
    <AppShell>
      <AppHeader />
      <FlatList
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.title}>Clientes</Text>
            <SearchField onChangeText={setSearch} placeholder="Nome, CPF ou telefone" value={search} />
            {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
          </View>
        }
        contentContainerStyle={styles.content}
        data={loading || error ? [] : visibleClients}
        keyExtractor={(client) => String(client.id)}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={pulling} tintColor="#ef7f19" />}
        renderItem={({ item }) => (
          <ClientCard
            client={item}
            onLongPress={() => openClientActions(item)}
            onPress={() => router.push(`/clients/${item.id}`)}
          />
        )}
      />
      <Pressable
        accessibilityLabel="Cadastrar novo cliente"
        onPress={() => router.push("/clients/new")}
        style={({ pressed }) => [styles.newButton, { bottom: fabBottom }, pressed && styles.pressed]}
      >
        <Text style={styles.newButtonText}>＋ Novo Cliente</Text>
      </Pressable>
      <ActionMenuSheet config={menu.config} onClose={menu.close} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
  listHeader: { marginBottom: 12 },
  title: { color: "#092542", fontSize: 22, fontWeight: "800", marginBottom: 12 },
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
  actionError: { color: "#d71929", fontSize: 14, marginTop: 8 },
  errorText: { color: "#d71929", fontSize: 15, textAlign: "center" },
  retry: { marginTop: 12, padding: 10 },
  retryText: { color: "#ef7f19", fontSize: 15, fontWeight: "700" },
  empty: { color: "#667994", fontSize: 16, marginTop: 12, textAlign: "center" },
});
