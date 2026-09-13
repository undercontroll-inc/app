import { apiClient, getAxiosErrorMessage } from "../providers/api";

class AuthService {
  async login(email, password) {
    try {
      const response = await apiClient.post("/auth", {
        provider: "PASSWORD",
        email,
        password,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: getAxiosErrorMessage(error) };
    }
  }

  async refresh(refreshToken) {
    const response = await apiClient.post("/auth/refresh", { refreshToken });
    return response.data;
  }
}

export const authService = new AuthService();
