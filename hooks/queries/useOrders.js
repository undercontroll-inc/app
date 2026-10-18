import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { demandService } from "../../services/DemandService";
import { orderService } from "../../services/OrderService";
import { queryKeys } from "./keys";

const PAGE_SIZE = 50;

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
      const snapshots = queryClient.getQueriesData({ queryKey: ["orders", "list"] });
      queryClient.setQueriesData({ queryKey: ["orders", "list"] }, (current) =>
        current?.data
          ? {
              ...current,
              data: current.data.map((order) => (String(order.id) === String(orderId) ? { ...order, status } : order)),
            }
          : current,
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
