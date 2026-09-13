import axios from "axios";
import { Platform } from "react-native";
import { clearAuth, getRefreshToken, getToken, saveTokens } from "../utils/auth";

export function getApiBaseURL() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const host = Platform.OS === "android" ? "10.0.2.2" : "localhost";
  const port = process.env.EXPO_PUBLIC_API_PORT || "8080";
  return `http://${host}:${port}/v1/api`;
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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isPublicAuthRequest(original.url)
    ) {
      original._retry = true;
      try {
        await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${getToken()}`;
        return apiClient(original);
      } catch {
        await clearAuth();
        onUnauthorized?.();
      }
    }

    return Promise.reject(error);
  },
);

async function refreshAccessToken() {
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

export function getAxiosErrorMessage(error) {
  if (error.response?.data) {
    const data = error.response.data;

    if (typeof data === "string") return data;
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (data.msg) return data.msg;
    if (data.detail) return data.detail;

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map((err) => err.message || err).join(", ");
    }

    return JSON.stringify(data);
  }

  if (error.request) {
    return "Erro de conexão. Verifique se o servidor está rodando.";
  }

  return error.message || "Erro desconhecido";
}
