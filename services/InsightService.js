import { apiClient } from "../providers/api";

class InsightService {
  async getInsights() {
    const response = await apiClient.get("/insights");
    return response.data;
  }

  async generate() {
    await apiClient.post("/insights");
  }
}

export const insightService = new InsightService();
