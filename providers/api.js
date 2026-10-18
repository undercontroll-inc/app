import axios from "axios";
import Constants from "expo-constants";
import { fetch as expoFetch } from "expo/fetch";
import { Platform } from "react-native";
import { clearAuth, getRefreshToken, getToken, saveTokens } from "../utils/auth";
import { ApiError, UNAUTHORIZED_MESSAGE } from "./apiError";
import { resolveApiBaseURL } from "./apiHost";

export { ApiError, getErrorMessage, isAbortError, normalizeError, parseApiError } from "./apiError";

export function getApiBaseURL() {
  return resolveApiBaseURL({
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    apiPort: process.env.EXPO_PUBLIC_API_PORT,
    hostUri: Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost,
    platform: Platform.OS,
  });
}

const baseURL = getApiBaseURL();

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
});

const refreshClient = axios.create({
  baseURL,
  timeout: 15000,
});

let refreshPromise = null;
let onUnauthorized = null;

export function setOnUnauthorized(handler) {
  onUnauthorized = handler;
}

function isPublicAuthRequest(url = "") {
  const path = String(url).split("?")[0];
  return /\/auth$/.test(path) || /\/auth\/refresh$/.test(path);
}

apiClient.interceptors.request.use((config) => {
  if (!isPublicAuthRequest(config.url)) {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

async function expireSession() {
  await clearAuth();
  onUnauthorized?.();
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry && !isPublicAuthRequest(original.url)) {
      original._retry = true;
      try {
        await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${getToken()}`;
        return apiClient(original);
      } catch {
        await expireSession();
      }
    }

    return Promise.reject(error);
  },
);

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function doRefresh() {
  const token = getRefreshToken();
  if (!token) {
    throw new Error("Refresh token not present");
  }
  const response = await refreshClient.post("/auth/refresh", { refreshToken: token });
  const { accessToken, refreshToken: nextRefresh } = response.data || {};
  if (!accessToken || !nextRefresh) {
    throw new Error("Invalid refresh payload");
  }
  await saveTokens(accessToken, nextRefresh);
}

function withAuthorization(headers = {}) {
  const token = getToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : { ...headers };
}

export async function authorizedFetch(path, init = {}) {
  const url = `${getApiBaseURL()}${path}`;
  const response = await expoFetch(url, { ...init, headers: withAuthorization(init.headers) });
  if (response.status !== 401) return response;

  try {
    await refreshAccessToken();
  } catch {
    await expireSession();
    throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: UNAUTHORIZED_MESSAGE });
  }
  return expoFetch(url, { ...init, headers: withAuthorization(init.headers) });
}
