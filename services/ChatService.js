import { ApiError, apiClient, authorizedFetch, parseApiError } from "../providers/api";
import { createSseParser } from "../utils/chat";

class ChatService {
  async sendMessage(content) {
    const response = await apiClient.post("/chats/messages", { content }, { timeout: 60000 });
    return response.data;
  }

  async streamMessage({ content, signal, onEvent }) {
    const response = await authorizedFetch("/chats/messages/stream", {
      method: "POST",
      headers: {
        Accept: "text/event-stream, application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
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
}

export const chatService = new ChatService();
