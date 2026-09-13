import { apiClient } from "../providers/api";

class OrderService {
  async list({ userId, page = 0, size = 50 } = {}) {
    const response = await apiClient.get("/orders", {
      params: {
        page,
        size,
        ...(userId != null ? { userId } : {}),
      },
    });
    return response.data ?? { data: [], totalElements: 0, totalPages: 0, page, size };
  }

  async getById(orderId) {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data?.data ?? response.data;
  }

  async create(payload) {
    const response = await apiClient.post("/orders", payload);
    return response.data;
  }

  async update(orderId, payload) {
    const response = await apiClient.patch(`/orders/${orderId}`, payload);
    return response.data;
  }

  async remove(orderId) {
    await apiClient.delete(`/orders/${orderId}`);
  }

  async exportPdf(orderId) {
    const response = await apiClient.get(`/orders/${orderId}/export`, {
      responseType: "arraybuffer",
    });
    return response.data;
  }
}

export const orderService = new OrderService();
