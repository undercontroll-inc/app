import { ApiError, apiClient, authorizedFetch, parseApiError } from "../providers/api";
import { createSseParser } from "../utils/chat";

const encode = (id) => encodeURIComponent(id);

class ChatService {
  async sendMessage({ content, conversationId }) {
    const response = await apiClient.post("/chats/messages", { content, conversationId }, { timeout: 60000 });
    return response.data;
  }

  async streamMessage({ content, conversationId, signal, onEvent }) {
    const response = await authorizedFetch("/chats/messages/stream", {
      method: "POST",
      headers: {
        Accept: "text/event-stream, application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, conversationId }),
      signal,
    });

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    const isJson = contentType.includes("application/json") && !contentType.includes("text/event-stream");

    if (!response.ok || isJson) {
      throw new ApiError(parseApiError(response.status, await response.text()));
    }

    if (!response.body) {
      throw new Error("Stream indisponível neste dispositivo.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const parser = createSseParser(onEvent);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(typeof value === "string" ? value : decoder.decode(value, { stream: true }));
    }
    parser.flush();
  }

  async getSuggestions() {
    const response = await apiClient.get("/chats/suggestions");
    return response.data;
  }

  async refreshSuggestions() {
    const response = await apiClient.post("/chats/suggestions");
    return response.data;
  }

  async listConversations({ cursor, limit = 20, signal } = {}) {
    const response = await apiClient.get("/chats/conversations", {
      signal,
      params: { limit, ...(cursor ? { cursor } : {}) },
    });
    return { items: response.data?.items ?? [], nextCursor: response.data?.nextCursor ?? null };
  }

  async getConversation(conversationId, { signal } = {}) {
    const response = await apiClient.get(`/chats/conversations/${encode(conversationId)}`, { signal });
    return response.data;
  }

  async getMessages(conversationId, { cursor, limit = 50, etag, signal } = {}) {
    const response = await apiClient.get(`/chats/conversations/${encode(conversationId)}/messages`, {
      signal,
      params: { limit, ...(cursor ? { cursor } : {}) },
      headers: etag ? { "If-None-Match": etag } : undefined,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
    });
    const responseEtag = response.headers?.etag ?? response.headers?.ETag ?? etag ?? null;
    if (response.status === 304) return { notModified: true, etag: responseEtag };
    return {
      notModified: false,
      etag: responseEtag,
      items: response.data?.items ?? [],
      nextCursor: response.data?.nextCursor ?? null,
    };
  }

  async renameConversation(conversationId, title) {
    const response = await apiClient.patch(`/chats/conversations/${encode(conversationId)}`, { title });
    return response.data;
  }

  async deleteConversation(conversationId) {
    await apiClient.delete(`/chats/conversations/${encode(conversationId)}`);
  }
}

export const chatService = new ChatService();
