import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { componentService } from "../../services/ComponentService";
import { queryKeys } from "./keys";

export function useComponents() {
  return useQuery({
    queryKey: queryKeys.components.list(),
    queryFn: ({ signal }) => componentService.list({ signal }),
  });
}

export function useComponent(componentId, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.components.detail(componentId),
    queryFn: ({ signal }) => componentService.getById(componentId, { signal }),
    enabled: enabled && componentId != null,
  });
}

export function useSaveComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ componentId, payload }) =>
      componentId != null ? componentService.update(componentId, payload) : componentService.create(payload),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.components.all }),
  });
}

export function useDeleteComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (componentId) => componentService.remove(componentId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.components.all }),
  });
}
