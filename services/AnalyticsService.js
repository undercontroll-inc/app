import { apiClient } from "../providers/api";

class AnalyticsService {
  async getAnalytics() {
    const response = await apiClient.get("/analytics");
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
