import { fetch } from "expo/fetch";
import { apiClient, getApiBaseURL } from "../providers/api";
import { getToken } from "../utils/auth";
import { createSseParser, parseApiErrorBody } from "../utils/chat";

class ChatService {
  async sendMessage(content) {
    const response = await apiClient.post(
      "/chats/messages",
      { content },
      { timeout: 60000 },
    );
    return response.data;
  }

  async streamMessage({ content, signal, onEvent }) {
    const token = getToken();
    const headers = {
      Accept: "text/event-stream, application/json",
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${getApiBaseURL()}/chats/messages/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content }),
      signal,
    });

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    const isJson = contentType.includes("application/json") && !contentType.includes("text/event-stream");

    if (!response.ok || isJson) {
      const text = await response.text();
      throw new Error(parseApiErrorBody(text) || `Erro ${response.status}`);
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
