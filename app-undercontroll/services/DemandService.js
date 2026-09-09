import { apiClient } from "../providers/api";

class DemandService {
  async list(orderId, { componentId } = {}) {
    const response = await apiClient.get(`/orders/${orderId}/demands`, {
      params: componentId != null ? { componentId } : undefined,
    });
    return response.data ?? [];
  }

  async create(orderId, { componentPartId, quantity }) {
    const response = await apiClient.post(`/orders/${orderId}/demands`, {
      componentPartId,
      quantity,
    });
    return response.data;
  }

  async remove(orderId, demandId) {
    await apiClient.delete(`/orders/${orderId}/demands/${demandId}`);
  }

  async removeAll(orderId) {
    await apiClient.delete(`/orders/${orderId}/demands`);
  }
}

export const demandService = new DemandService();
