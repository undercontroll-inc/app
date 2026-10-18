import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { demandService } from "../../services/DemandService";
import { orderService } from "../../services/OrderService";
import { queryKeys } from "./keys";

const PAGE_SIZE = 50;
export const ORDERS_PAGE_SIZE = 20;

export function getNextOrdersPage(lastPage) {
  const next = (lastPage?.page ?? 0) + 1;
  return next < (lastPage?.totalPages ?? 0) ? next : undefined;
}

export function updateOrderInCache(current, orderId, changes) {
  const patch = (list) =>
    list.map((order) => (String(order.id) === String(orderId) ? { ...order, ...changes } : order));
  if (current?.pages) {
    return {
      ...current,
      pages: current.pages.map((page) => (page?.data ? { ...page, data: patch(page.data) } : page)),
    };
  }
  if (Array.isArray(current?.data)) return { ...current, data: patch(current.data) };
  return current;
}

export function useInfiniteOrders() {
  return useInfiniteQuery({
    queryKey: queryKeys.orders.infinite(),
    queryFn: ({ pageParam, signal }) => orderService.list({ page: pageParam, size: ORDERS_PAGE_SIZE, signal }),
    initialPageParam: 0,
    getNextPageParam: getNextOrdersPage,
    select: (data) => data.pages.flatMap((page) => page?.data ?? []),
  });
}

export function useOrders({ userId, enabled = true } = {}) {
  const filters = userId != null ? { userId: String(userId) } : {};
  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: ({ signal }) => orderService.list({ userId, page: 0, size: PAGE_SIZE, signal }),
    select: (response) => response?.data ?? [],
    enabled,
  });
}

export function useOrder(orderId, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: ({ signal }) => orderService.getById(orderId, { signal }),
    enabled: enabled && orderId != null,
  });
}

export function useOrderDemands(orderId, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.orders.demands(orderId),
    queryFn: ({ signal }) => demandService.list(orderId, { signal }).catch(() => []),
    enabled: enabled && orderId != null,
  });
}

export function useSaveOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }) =>
      orderId != null ? orderService.update(orderId, payload) : orderService.create(payload),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }) => orderService.update(orderId, { status }),
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.all });
      const snapshots = queryClient.getQueriesData({ queryKey: queryKeys.orders.all });
      queryClient.setQueriesData({ queryKey: queryKeys.orders.all }, (current) =>
        updateOrderInCache(current, orderId, { status }),
      );
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId) => orderService.remove(orderId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  });
}
