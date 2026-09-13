import { apiClient } from "../providers/api";

class ChatService {
  async sendMessage(content) {
    const response = await apiClient.post(
      "/chats/messages",
      { content },
      { timeout: 60000 },
    );
    return response.data;
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
