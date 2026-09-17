import { apiClient } from "../providers/api";

class ComponentService {
  async list({ category, name } = {}) {
    const response = await apiClient.get("/components", {
      params: {
        ...(category ? { category } : {}),
        ...(name ? { name } : {}),
      },
    });
    return response.data ?? [];
  }

  async getById(componentId) {
    const response = await apiClient.get(`/components/${componentId}`);
    return response.data;
  }

  async create(payload) {
    const response = await apiClient.post("/components", payload);
    return response.data;
  }

  async update(componentId, payload) {
    const response = await apiClient.put(`/components/${componentId}`, payload);
    return response.data;
  }

  async remove(componentId) {
    await apiClient.delete(`/components/${componentId}`);
  }
}

export const componentService = new ComponentService();
