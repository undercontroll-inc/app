import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ActionMenuSheet, useActionMenu } from "../../../components/ActionMenu";
import Banner from "../../../components/ui/Banner";
import StockItemCard from "../../../components/StockItemCard";
import GlassFab from "../../../components/ui/GlassFab";
import StateView from "../../../components/ui/StateView";
import { useComponents, useDeleteComponent } from "../../../hooks/queries/useComponents";
import SearchField from "../../../components/SearchField";
import useRefreshOnFocus from "../../../hooks/useRefreshOnFocus";
import { getErrorMessage } from "../../../providers/api";
import { stockCategoryLabel } from "../../../utils/stock";
import { colors } from "../../../theme";

export default function StockScreen() {
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");
  const menu = useActionMenu();
  const componentsQuery = useComponents();
  const { mutate: deleteComponent } = useDeleteComponent();
  const { refetch } = componentsQuery;
  useRefreshOnFocus(refetch);

  const visibleItems = useMemo(() => {
    const text = search.trim().toLowerCase();
    return (componentsQuery.data ?? []).filter((item) =>
      `${item.item || ""} ${item.brand || ""} ${item.category || ""} ${item.supplier || ""}`
        .toLowerCase()
        .includes(text),
    );
  }, [componentsQuery.data, search]);

  const openItem = useCallback((item) => router.push(`/stock/${item.id}`), []);

  const confirmDelete = useCallback(
    (item) => {
      Alert.alert("Excluir item?", `“${item.item}” será removido do estoque.`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            setActionError("");
            deleteComponent(item.id, { onError: (err) => setActionError(getErrorMessage(err)) });
          },
        },
      ]);
    },
    [deleteComponent],
  );

  const { show } = menu;
  const openActions = useCallback(
    (item) => {
      show({
        title: item.item,
        message: stockCategoryLabel(item),
        options: [
          { label: "Editar", onPress: () => router.push(`/stock/${item.id}`) },
          { label: "Excluir", destructive: true, onPress: () => confirmDelete(item) },
          { label: "Cancelar", cancel: true },
        ],
      });
    },
    [confirmDelete, show],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <StockItemCard
        item={item}
        onDelete={confirmDelete}
        onEdit={openItem}
        onLongPress={openActions}
        onPress={openItem}
      />
    ),
    [confirmDelete, openActions, openItem],
  );

  const showList = !componentsQuery.isPending && !componentsQuery.isError;

  return (
    <View style={styles.screen}>
      <FlatList
        ListEmptyComponent={
          <StateView
            error={componentsQuery.isError ? getErrorMessage(componentsQuery.error) : null}
            icon="box"
            loading={componentsQuery.isPending}
            loadingText="Carregando estoque..."
            message={search ? "Tente buscar por outro nome." : "Importe uma nota ou cadastre o primeiro item."}
            onRetry={refetch}
            title="Nenhum item encontrado"
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <SearchField onChangeText={setSearch} placeholder="Buscar peça, marca ou fornecedor" value={search} />
            {actionError ? <Banner message={actionError} tone="danger" /> : null}
          </View>
        }
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={showList ? visibleItems : []}
        keyExtractor={(item) => String(item.id)}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        renderItem={renderItem}
      />
      <GlassFab
        actions={[
          {
            label: "Importar nota fiscal",
            description: "A IA lê os itens para você",
            icon: "sparkles",
            onPress: () => router.push("/stock/import"),
            testID: "stock-import",
          },
          {
            label: "Cadastrar manualmente",
            description: "Adicionar um item por vez",
            icon: "compose",
            onPress: () => router.push("/stock/new"),
            testID: "stock-new",
          },
        ]}
        label="Adicionar"
        testID="stock-add"
      />
      <ActionMenuSheet config={menu.config} onClose={menu.close} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: 140, paddingHorizontal: 20, paddingTop: 8 },
  header: { gap: 12, marginBottom: 16 },
});
