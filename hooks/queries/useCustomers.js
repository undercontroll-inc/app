import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "../../services/UserService";
import { queryKeys } from "./keys";

export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers.list(),
    queryFn: ({ signal }) => userService.getCustomers({ signal }),
  });
}

export function useCustomer(customerId, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.customers.detail(customerId),
    queryFn: ({ signal }) => userService.getById(customerId, { signal }),
    enabled: enabled && customerId != null,
  });
}

export function useSaveCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, payload }) =>
      customerId != null ? userService.update(customerId, payload) : userService.create(payload),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customerId) => userService.remove(customerId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
  });
}
