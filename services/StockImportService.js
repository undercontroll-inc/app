import { File } from "expo-file-system";
import { apiClient, ApiError, authorizedFetch, getErrorMessage, isAbortError, parseApiError } from "../providers/api";
import { MAX_UPLOAD_BYTES } from "../utils/stockImport";

const UPLOAD_TIMEOUT_MS = 60000;

const EXTENSION_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  xml: "application/xml",
};

const ERROR_MESSAGES = {
  STOCK_IMPORT_UNAVAILABLE: "A leitura automática está indisponível agora. Envie o XML da nota ou tente mais tarde.",
  STOCK_IMPORT_NOT_FOUND: "Essa importação não existe mais.",
  STOCK_IMPORT_INVALID_STATE: "Essa importação já foi concluída ou cancelada.",
  COMPONENT_NOT_FOUND: "Um dos produtos escolhidos não existe mais no estoque. Revise as associações.",
};

const INVALID_FILE_MESSAGES = [
  [/10\s?MB|too large|size/i, "O arquivo passa de 10 MB. Tire uma foto com menos resolução."],
  [/pages?/i, "O PDF tem páginas demais. Envie no máximo 5 páginas."],
  [/type|mime|unsupported|match|heic/i, "Formato não suportado. Envie foto, PDF ou XML da nota."],
  [/empty|required/i, "O arquivo está vazio. Tente novamente."],
];

export function stockImportErrorMessage(error) {
  if (error?.code && ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code];
  const message = error?.message || getErrorMessage(error);
  if (error?.code === "STOCK_IMPORT_INVALID") {
    const match = INVALID_FILE_MESSAGES.find(([pattern]) => pattern.test(message));
    return match ? match[1] : "Não foi possível enviar esse arquivo. Tente outro.";
  }
  return message || "Algo deu errado. Tente novamente.";
}

export function guessMimeType(name, fallback) {
  if (fallback) return fallback;
  const extension = String(name ?? "")
    .split(".")
    .pop()
    ?.toLowerCase();
  return EXTENSION_TYPES[extension] ?? "application/octet-stream";
}

export function createFilePart(file, { name, mimeType }) {
  return {
    name: name || "nota",
    type: guessMimeType(name, mimeType),
    bytes: () => file.bytes(),
  };
}

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function openFile(uri) {
  const file = new File(uri);
  if (!file.exists) throw new Error("Não foi possível ler o arquivo selecionado.");
  if ((file.size ?? 0) <= 0) throw new Error("O arquivo está vazio. Tente novamente.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("O arquivo passa de 10 MB. Tire uma foto com menos resolução.");
  return file;
}

class StockImportService {
  async upload({ uri, name, mimeType }) {
    const file = openFile(uri);
    const form = new FormData();
    form.append("file", createFilePart(file, { name, mimeType }));

    const timeout = withTimeout(UPLOAD_TIMEOUT_MS);
    try {
      const response = await authorizedFetch("/stock-imports", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: form,
        signal: timeout.signal,
      });
      const text = await response.text();
      if (!response.ok) throw new ApiError(parseApiError(response.status, text));
      return JSON.parse(text);
    } catch (error) {
      if (isAbortError(error)) throw new Error("O envio demorou demais. Verifique sua conexão e tente de novo.");
      throw error;
    } finally {
      timeout.clear();
    }
  }

  async get(importId, { signal } = {}) {
    const response = await apiClient.get(`/stock-imports/${importId}`, { signal });
    return response.data;
  }

  async list({ status, limit = 20, signal } = {}) {
    const response = await apiClient.get("/stock-imports", {
      signal,
      params: { ...(status ? { status } : {}), limit },
    });
    return response.data ?? [];
  }

  async saveDraft(importId, payload) {
    const response = await apiClient.put(`/stock-imports/${importId}`, payload);
    return response.data;
  }

  async confirm(importId, payload) {
    const response = await apiClient.post(`/stock-imports/${importId}/confirm`, payload);
    return response.data;
  }

  async retry(importId) {
    const response = await apiClient.post(`/stock-imports/${importId}/retry`);
    return response.data;
  }

  async cancel(importId) {
    await apiClient.delete(`/stock-imports/${importId}`);
  }
}

export const stockImportService = new StockImportService();
