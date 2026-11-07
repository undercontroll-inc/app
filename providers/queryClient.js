import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, focusManager } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { normalizeError } from "./apiError";

const MAX_RETRIES = 2;

export function shouldRetry(failureCount, error) {
  return failureCount < MAX_RETRIES && normalizeError(error).retryable;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        staleTime: 30 * 1000,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export const queryClient = createQueryClient();

export function onAppStateChange(status) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

export function subscribeAppFocus() {
  const subscription = AppState.addEventListener("change", onAppStateChange);
  return () => subscription.remove();
}

const PERSIST_KEY = "pelluci-query-cache";
export const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000;

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: PERSIST_KEY,
  throttleTime: 1000,
});

export const persistOptions = {
  persister: queryPersister,
  maxAge: PERSIST_MAX_AGE,
  buster: "chat-history-v1",
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => query.queryKey[0] === "chat" && query.state.status === "success",
  },
};

export async function clearPersistedCache() {
  await AsyncStorage.removeItem(PERSIST_KEY).catch(() => {});
}
