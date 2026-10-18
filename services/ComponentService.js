import { apiClient } from "../providers/api";

class ComponentService {
  async list({ category, name, signal } = {}) {
    const response = await apiClient.get("/components", {
      signal,
      params: {
        ...(category ? { category } : {}),
        ...(name ? { name } : {}),
      },
    });
    return response.data ?? [];
  }

  async getById(componentId, { signal } = {}) {
    const response = await apiClient.get(`/components/${componentId}`, { signal });
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
