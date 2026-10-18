import { apiClient } from "../providers/api";

class UserService {
  async list({ type, hasEmail, signal } = {}) {
    const response = await apiClient.get("/users", {
      signal,
      params: {
        ...(type ? { type } : {}),
        ...(hasEmail != null ? { hasEmail } : {}),
      },
    });
    return response.data ?? [];
  }

  async getCustomers({ signal } = {}) {
    return this.list({ type: "CUSTOMER", signal });
  }

  async getById(userId, { signal } = {}) {
    const response = await apiClient.get(`/users/${userId}`, { signal });
    return response.data;
  }

  async create(payload) {
    const response = await apiClient.post("/users", payload);
    return response.data;
  }

  async update(userId, payload) {
    const response = await apiClient.patch(`/users/${userId}`, payload);
    return response.data;
  }

  async remove(userId) {
    await apiClient.delete(`/users/${userId}`);
  }

  async changePassword(userId, { newPassword, inFirstLogin = false }) {
    await apiClient.patch(`/users/${userId}/password`, {
      newPassword,
      inFirstLogin,
    });
  }
}

export const userService = new UserService();
