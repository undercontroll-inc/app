import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Linking, RefreshControl, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import ClientCard from "../../../components/ClientCard";
import { ActionMenuSheet, useActionMenu } from "../../../components/ActionMenu";
import Banner from "../../../components/ui/Banner";
import GlassFab from "../../../components/ui/GlassFab";
import StateView from "../../../components/ui/StateView";
import { useCustomers, useDeleteCustomer } from "../../../hooks/queries/useCustomers";
import SearchField from "../../../components/SearchField";
import useRefreshOnFocus from "../../../hooks/useRefreshOnFocus";
import { getErrorMessage } from "../../../providers/api";
import { telUrl, whatsappUrl } from "../../../utils/contact";
import { formatUserName } from "../../../utils/orders";
import { colors } from "../../../theme";

function openContact(url, onFail) {
  Linking.openURL(url).catch(onFail);
}

export default function ClientsScreen() {
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");
  const [pulling, setPulling] = useState(false);
  const menu = useActionMenu();
  const customersQuery = useCustomers();
  const { mutate: deleteCustomer } = useDeleteCustomer();
  const { refetch } = customersQuery;
  useRefreshOnFocus(refetch);

  const clients = useMemo(() => customersQuery.data ?? [], [customersQuery.data]);

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

  const confirmDelete = useCallback(
    (client) => {
      Alert.alert("Excluir cliente?", `${formatUserName(client)} será removido.`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            setActionError("");
            deleteCustomer(client.id, { onError: (err) => setActionError(getErrorMessage(err)) });
          },
        },
      ]);
    },
    [deleteCustomer],
  );

  const swipeActions = useCallback(
    (client) => {
      const onFail = () => setActionError("Não foi possível abrir o aplicativo.");
      const callUrl = telUrl(client.phone);
      const chatUrl = client.hasWhatsApp ? whatsappUrl(client.phone) : null;
      const actions = [];
      if (callUrl)
        actions.push({
          label: "Ligar",
          icon: "phone",
          color: colors.success,
          onPress: () => openContact(callUrl, onFail),
        });
      if (chatUrl)
        actions.push({
          label: "WhatsApp",
          icon: "whatsapp",
          color: "#1f9e58",
          onPress: () => openContact(chatUrl, onFail),
        });
      actions.push({
        label: "Editar",
        icon: "edit",
        color: colors.orange,
        onPress: () => router.push(`/clients/${client.id}/edit`),
      });
      actions.push({ label: "Excluir", icon: "trash", color: colors.danger, onPress: () => confirmDelete(client) });
      return { actions };
    },
    [confirmDelete],
  );

  const { show } = menu;
  const openClientActions = useCallback(
    (client) => {
      const openContact = (url) => {
        Linking.openURL(url).catch(() => {
          setActionError("Não foi possível abrir o aplicativo.");
        });
      };
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
        { label: "Excluir", destructive: true, onPress: () => confirmDelete(client) },
        { label: "Cancelar", cancel: true },
      );
      show({
        title: formatUserName(client),
        message: client.phone || undefined,
        options,
      });
    },
    [confirmDelete, show],
  );

  const openClient = useCallback((client) => router.push(`/clients/${client.id}`), []);

  const renderItem = useCallback(
    ({ item }) => (
      <ClientCard client={item} onLongPress={openClientActions} onPress={openClient} {...swipeActions(item)} />
    ),
    [openClient, openClientActions, swipeActions],
  );

  const showList = !customersQuery.isPending && !customersQuery.isError;

  return (
    <View style={styles.screen}>
      <FlatList
        ListEmptyComponent={
          <StateView
            error={customersQuery.isError ? getErrorMessage(customersQuery.error) : null}
            icon="users"
            loading={customersQuery.isPending}
            loadingText="Carregando clientes..."
            message={search ? "Tente outro nome, CPF ou telefone." : "Toque em “Novo cliente” para cadastrar."}
            onRetry={refetch}
            title="Nenhum cliente encontrado"
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <SearchField onChangeText={setSearch} placeholder="Nome, CPF ou telefone" value={search} />
            {actionError ? <Banner message={actionError} tone="danger" /> : null}
          </View>
        }
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={showList ? visibleClients : []}
        keyExtractor={(client) => String(client.id)}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={pulling} tintColor={colors.orange} />}
        renderItem={renderItem}
      />
      <GlassFab label="Novo cliente" onPress={() => router.push("/clients/new")} testID="clients-new" />
      <ActionMenuSheet config={menu.config} onClose={menu.close} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: 140, paddingHorizontal: 20, paddingTop: 8 },
  header: { gap: 12, marginBottom: 16 },
});
