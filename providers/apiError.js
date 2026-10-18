export const NETWORK_ERROR_MESSAGE = "Erro de conexão. Verifique se o servidor está rodando.";
export const FORBIDDEN_MESSAGE = "Você não tem permissão para realizar esta ação.";
export const UNAUTHORIZED_MESSAGE = "Sua sessão expirou. Entre novamente.";

export class ApiError extends Error {
  constructor({ status = 0, code = null, message, retryable = false }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

function isRetryableStatus(status) {
  return !status || status === 408 || status === 429 || status >= 500;
}

function parseBody(body) {
  if (typeof body !== "string") return body;
  const text = body.trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function messageFromData(data) {
  if (data == null) return "";
  if (typeof data === "string") return data.trim();
  if (typeof data !== "object") return "";
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const details = data.errors.map((err) => err?.message || err).filter(Boolean);
    if (details.length) return details.join(", ");
  }
  return data.message || data.detail || data.msg || data.error || "";
}

export function parseApiError(status, body) {
  const data = parseBody(body);
  const code = data && typeof data === "object" && data.code ? String(data.code) : null;
  let message = messageFromData(data);
  if (status === 403) message = FORBIDDEN_MESSAGE;
  if (!message) message = status ? `Erro ${status}` : "Erro desconhecido";
  return { status: status || 0, code, message, retryable: isRetryableStatus(status) };
}

export function isAbortError(error) {
  return error?.name === "AbortError" || error?.code === "ABORTED" || /aborted/i.test(String(error?.message || ""));
}

export function normalizeError(error) {
  if (error instanceof ApiError) return error;
  if (error?.response) {
    const data = error.response.data instanceof ArrayBuffer ? null : error.response.data;
    return new ApiError(parseApiError(error.response.status, data));
  }
  if (error?.code === "ERR_CANCELED" || isAbortError(error)) {
    return new ApiError({ code: "ABORTED", message: "Requisição cancelada.", retryable: true });
  }
  if (error?.request || error instanceof TypeError) {
    return new ApiError({ code: "NETWORK", message: NETWORK_ERROR_MESSAGE, retryable: true });
  }
  return new ApiError({ message: error?.message || "Erro desconhecido" });
}

export function getErrorMessage(error) {
  return normalizeError(error).message;
}
