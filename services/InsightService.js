import { apiClient } from "../providers/api";

class InsightService {
  async getInsights({ signal } = {}) {
    const response = await apiClient.get("/insights", { signal });
    return response.data;
  }

  async requestJob() {
    const response = await apiClient.post("/market/insights/jobs");
    return response.data;
  }
}

export const insightService = new InsightService();
