import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import OrderCard from "../../../components/OrderCard";
import { ActionMenuSheet, useActionMenu } from "../../../components/ActionMenu";
import Banner from "../../../components/ui/Banner";
import GlassFab from "../../../components/ui/GlassFab";
import Segmented from "../../../components/ui/Segmented";
import StateView from "../../../components/ui/StateView";
import { useDeleteOrder, useInfiniteOrders, useUpdateOrderStatus } from "../../../hooks/queries/useOrders";
import SearchField from "../../../components/SearchField";
import useRefreshOnFocus from "../../../hooks/useRefreshOnFocus";
import { getErrorMessage } from "../../../providers/api";
import { ORDER_STATUS_API, isOrderCompleted, toOrderCard } from "../../../utils/orders";
import { colors } from "../../../theme";

const filters = ["Todos", "Pendentes", "Em análise", "Concluídos"];

export default function OrdersScreen() {
  const [search, setSearch] = useState("");
  const [filterIndex, setFilterIndex] = useState(0);
  const [actionError, setActionError] = useState("");
  const menu = useActionMenu();
  const ordersQuery = useInfiniteOrders();
  const { mutate: updateStatus } = useUpdateOrderStatus();
  const { mutate: deleteOrderMutation } = useDeleteOrder();
  const { fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = ordersQuery;
  useRefreshOnFocus(refetch);

  const orders = useMemo(() => (ordersQuery.data ?? []).map(toOrderCard), [ordersQuery.data]);
  const selectedFilter = filters[filterIndex];

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

  const toggleStatus = useCallback(
    (order) => {
      const completed = isOrderCompleted(order.status);
      setActionError("");
      updateStatus(
        { orderId: order.id, status: ORDER_STATUS_API[completed ? "Pendente" : "Concluído"] },
        { onError: (err) => setActionError(getErrorMessage(err)) },
      );
    },
    [updateStatus],
  );

  const confirmDelete = useCallback(
    (order) => {
      Alert.alert(`Excluir OS #${order.id}?`, `A ordem de ${order.client} será removida.`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            setActionError("");
            deleteOrderMutation(order.id, { onError: (err) => setActionError(getErrorMessage(err)) });
          },
        },
      ]);
    },
    [deleteOrderMutation],
  );

  const { show } = menu;
  const openOrderActions = useCallback(
    (order) => {
      const completed = isOrderCompleted(order.status);
      show({
        title: `OS #${order.id}`,
        message: order.client,
        options: [
          { label: completed ? "Marcar como pendente" : "Marcar como concluída", onPress: () => toggleStatus(order) },
          { label: "Excluir", destructive: true, onPress: () => confirmDelete(order) },
          { label: "Cancelar", cancel: true },
        ],
      });
    },
    [confirmDelete, show, toggleStatus],
  );

  const openOrder = useCallback((order) => router.push(`/orders/${order.id}`), []);

  const renderItem = useCallback(
    ({ item }) => (
      <OrderCard
        onDelete={confirmDelete}
        onLongPress={openOrderActions}
        onPress={openOrder}
        onToggleStatus={toggleStatus}
        order={item}
      />
    ),
    [confirmDelete, openOrder, openOrderActions, toggleStatus],
  );

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const showList = !ordersQuery.isPending && !ordersQuery.isError;

  return (
    <View style={styles.screen}>
      <FlatList
        ListEmptyComponent={
          <StateView
            error={ordersQuery.isError ? getErrorMessage(ordersQuery.error) : null}
            icon="wrench"
            loading={ordersQuery.isPending}
            loadingText="Carregando ordens..."
            message={search ? "Tente buscar por outro nome ou número." : "Toque em “Nova O.S.” para começar."}
            onRetry={refetch}
            title="Nenhuma ordem encontrada"
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator color={colors.orange} style={styles.footer} /> : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <SearchField onChangeText={setSearch} placeholder="Buscar por OS, cliente ou aparelho" value={search} />
            <Segmented onChange={setFilterIndex} selectedIndex={filterIndex} values={filters} />
            {actionError ? <Banner message={actionError} tone="danger" /> : null}
          </View>
        }
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={showList ? visibleOrders : []}
        keyExtractor={(order) => order.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={renderItem}
      />
      <GlassFab label="Nova O.S." onPress={() => router.push("/orders/new")} testID="orders-new" />
      <ActionMenuSheet config={menu.config} onClose={menu.close} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: 140, paddingHorizontal: 20, paddingTop: 8 },
  header: { gap: 12, marginBottom: 16 },
  footer: { marginVertical: 16 },
});
