import { AppState, Platform } from "react-native";
import { QueryClient, focusManager } from "@tanstack/react-query";
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
