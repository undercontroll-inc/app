import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stockImportService } from "../../services/StockImportService";
import { normalizeError } from "../../providers/apiError";
import { IMPORT_STATUS } from "../../utils/stockImport";
import { queryKeys } from "./keys";

export const STOCK_IMPORT_POLL_INTERVAL_MS = 2000;

export function stockImportRefetchInterval(query) {
  return query.state.data?.status === IMPORT_STATUS.PROCESSING ? STOCK_IMPORT_POLL_INTERVAL_MS : false;
}

function withFieldErrors(error) {
  const normalized = normalizeError(error);
  const fieldErrors = error?.response?.data?.errors;
  if (Array.isArray(fieldErrors)) normalized.fieldErrors = fieldErrors;
  return normalized;
}

export function useStockImport(importId, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.stockImports.detail(importId),
    queryFn: ({ signal }) => stockImportService.get(importId, { signal }),
    enabled: enabled && importId != null,
    refetchInterval: stockImportRefetchInterval,
    refetchIntervalInBackground: false,
  });
}

export function usePendingStockImports() {
  return useQuery({
    queryKey: queryKeys.stockImports.list(IMPORT_STATUS.READY),
    queryFn: ({ signal }) => stockImportService.list({ status: IMPORT_STATUS.READY, signal }),
  });
}

export function useUploadStockImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => stockImportService.upload(file),
    onSuccess: (dto) => queryClient.setQueryData(queryKeys.stockImports.detail(dto.id), dto),
  });
}

export function useSaveStockImportDraft(importId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => stockImportService.saveDraft(importId, payload),
    onSuccess: (dto) => queryClient.setQueryData(queryKeys.stockImports.detail(importId), dto),
  });
}

export function useConfirmStockImport(importId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      try {
        return await stockImportService.confirm(importId, payload);
      } catch (error) {
        throw withFieldErrors(error);
      }
    },
    onSuccess: (dto) => queryClient.setQueryData(queryKeys.stockImports.detail(importId), dto),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.components.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockImports.list(IMPORT_STATUS.READY) });
    },
  });
}

export function useRetryStockImport(importId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => stockImportService.retry(importId),
    onSuccess: (dto) => queryClient.setQueryData(queryKeys.stockImports.detail(importId), dto),
  });
}

export function useCancelStockImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (importId) => stockImportService.cancel(importId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.stockImports.all }),
  });
}
