import { memo, useCallback, useMemo, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "../../../components/AppHeader";
import AppShell from "../../../components/AppShell";
import SearchField from "../../../components/SearchField";
import { ActionMenuSheet, useActionMenu } from "../../../components/ActionMenu";
import { useComponents, useDeleteComponent } from "../../../hooks/queries/useComponents";
import useRefreshOnFocus from "../../../hooks/useRefreshOnFocus";
import { getErrorMessage } from "../../../providers/api";
import { formatCurrency } from "../../../utils/orders";
import { stockCategoryLabel } from "../../../utils/stock";

const StockItemCard = memo(function StockItemCard({ item, onPress, onLongPress }) {
  return (
    <Pressable
      delayLongPress={350}
      onLongPress={() => onLongPress(item)}
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.itemCard, pressed && styles.pressed]}
    >
      <View style={styles.itemHeading}>
        <View style={styles.itemNameWrap}>
          <Text style={styles.itemName}>{item.item}</Text>
          <Text style={styles.category}>{stockCategoryLabel(item)}</Text>
        </View>
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.itemDetails}>
        <Text style={styles.detail}>
          Qtd: <Text style={styles.detailStrong}>{item.quantity ?? 0} un</Text>
        </Text>
        <Text style={styles.detail}>
          Fornecedor: <Text style={styles.detailStrong}>{item.supplier || "Não informado"}</Text>
        </Text>
      </View>
    </Pressable>
  );
});

export default function StockScreen() {
  const insets = useSafeAreaInsets();
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

  const { show } = menu;
  const openActions = useCallback(
    (item) => {
      show({
        title: item.item,
        message: stockCategoryLabel(item),
        options: [
          { label: "Editar", onPress: () => router.push(`/stock/${item.id}`) },
          {
            label: "Excluir",
            destructive: true,
            onPress: () => {
              setActionError("");
              deleteComponent(item.id, { onError: (err) => setActionError(getErrorMessage(err)) });
            },
          },
          { label: "Cancelar", cancel: true },
        ],
      });
    },
    [deleteComponent, show],
  );

  const renderItem = useCallback(
    ({ item }) => <StockItemCard item={item} onLongPress={openActions} onPress={openItem} />,
    [openActions, openItem],
  );

  function renderEmpty() {
    if (componentsQuery.isPending) {
      return (
        <View style={styles.state}>
          <ActivityIndicator color="#ef7f19" />
          <Text style={styles.stateText}>Carregando estoque...</Text>
        </View>
      );
    }
    if (componentsQuery.isError) {
      return (
        <View style={styles.state}>
          <Text style={styles.errorText}>{getErrorMessage(componentsQuery.error)}</Text>
          <Pressable onPress={() => refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }
    return <Text style={styles.empty}>Nenhum item encontrado.</Text>;
  }

  return (
    <AppShell>
      <AppHeader />
      <FlatList
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Controle de Estoque</Text>
            <SearchField onChangeText={setSearch} placeholder="Buscar peça ou item..." value={search} />
            {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
          </View>
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.content}
        data={componentsQuery.isError ? [] : visibleItems}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        renderItem={renderItem}
      />
      <Pressable
        onPress={() => router.push("/stock/new")}
        style={({ pressed }) => [
          styles.newButton,
          { bottom: Platform.OS === "ios" ? 16 + Math.max(insets.bottom, 8) : 22 },
          pressed && styles.pressed,
        ]}
      >
        <Feather color="#ffffff" name="plus" size={20} />
        <Text style={styles.newButtonText}>Novo Item</Text>
      </Pressable>
      <ActionMenuSheet config={menu.config} onClose={menu.close} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 120 },
  title: { color: "#092542", fontSize: 32, fontWeight: "800", marginBottom: 26 },
  itemCard: { borderColor: "#dce4ee", borderRadius: 16, borderWidth: 2, marginTop: 18, padding: 22 },
  itemHeading: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  itemNameWrap: { flex: 1, paddingRight: 8 },
  itemName: { color: "#092542", fontSize: 18, fontWeight: "800" },
  category: { color: "#667994", fontSize: 16, marginTop: 10 },
  price: { color: "#ef6f10", fontSize: 18, fontWeight: "800" },
  divider: { backgroundColor: "#dce4ee", height: 1, marginVertical: 20 },
  itemDetails: { flexDirection: "row", justifyContent: "space-between" },
  detail: { color: "#667994", flexShrink: 1, fontSize: 14 },
  detailStrong: { color: "#092542", fontWeight: "800" },
  empty: { color: "#667994", fontSize: 15, marginTop: 28, textAlign: "center" },
  state: { alignItems: "center", paddingVertical: 32 },
  stateText: { color: "#667994", fontSize: 15, marginTop: 12 },
  errorText: { color: "#d71929", fontSize: 15, textAlign: "center" },
  actionError: { color: "#d71929", fontSize: 14, marginTop: 8 },
  retry: { marginTop: 12, padding: 10 },
  retryText: { color: "#ef7f19", fontSize: 15, fontWeight: "700" },
  newButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#ef7f19",
    borderRadius: 28,
    elevation: 8,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 16,
    position: "absolute",
    right: 22,
    shadowColor: "#092542",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  newButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.8 },
});
