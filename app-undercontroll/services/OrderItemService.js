import { apiClient } from "../providers/api";

class OrderItemService {
  async list(orderId) {
    const response = await apiClient.get(`/orders/${orderId}/items`);
    return response.data ?? [];
  }

  async getById(orderId, orderItemId) {
    const response = await apiClient.get(`/orders/${orderId}/items/${orderItemId}`);
    return response.data;
  }

  async create(orderId, payload) {
    const response = await apiClient.post(`/orders/${orderId}/items`, payload);
    return response.data;
  }

  async update(orderId, orderItemId, payload) {
    await apiClient.patch(`/orders/${orderId}/items/${orderItemId}`, payload);
  }

  async remove(orderId, orderItemId) {
    await apiClient.delete(`/orders/${orderId}/items/${orderItemId}`);
  }
}

export const orderItemService = new OrderItemService();
