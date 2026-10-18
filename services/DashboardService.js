import { apiClient } from "../providers/api";

export const PeriodFilter = {
  SEVEN_DAYS: "SEVEN_DAYS",
  THIRTY_DAYS: "THIRTY_DAYS",
  NINETY_DAYS: "NINETY_DAYS",
  YEAR: "YEAR",
  ALL: "ALL",
};

export const StatusFilter = {
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
  DELIVERED: "DELIVERED",
  ALL: "ALL",
};

class DashboardService {
  async getMetrics(period = PeriodFilter.ALL, status = StatusFilter.ALL, { signal } = {}) {
    const response = await apiClient.get("/dashboard/metrics", { params: { period, status }, signal });
    return response.data || { value: 0 };
  }

  async getProfitMargin(period = PeriodFilter.ALL, status = StatusFilter.ALL, { signal } = {}) {
    const response = await apiClient.get("/dashboard/profit-margin", { params: { period, status }, signal });
    return response.data || { value: 0 };
  }

  async getAverageOrderPrice(period = PeriodFilter.ALL, status = StatusFilter.ALL, { signal } = {}) {
    const response = await apiClient.get("/dashboard/average-order-price", { params: { period, status }, signal });
    return response.data || { value: 0 };
  }

  async getOngoingOrders(period = PeriodFilter.ALL, { signal } = {}) {
    const response = await apiClient.get("/dashboard/ongoing-orders", { params: { period }, signal });
    return response.data || { value: 0 };
  }

  async getAverageRepairTime(period = PeriodFilter.ALL, status = StatusFilter.ALL, { signal } = {}) {
    const response = await apiClient.get("/dashboard/average-repair-time", { params: { period, status }, signal });
    return response.data || { value: 0 };
  }

  async getRevenueEvolution(period = PeriodFilter.THIRTY_DAYS, status = StatusFilter.ALL, { signal } = {}) {
    const response = await apiClient.get("/dashboard/charts/revenue-evolution", { params: { period, status }, signal });
    return response.data || { dataPoints: [] };
  }

  async getCustomerType(period = PeriodFilter.THIRTY_DAYS, status = StatusFilter.ALL, { signal } = {}) {
    const response = await apiClient.get("/dashboard/charts/customer-type", { params: { period, status }, signal });
    return response.data || { dataPoints: [] };
  }

  async getOrdersByStatus(period = PeriodFilter.ALL, { signal } = {}) {
    const response = await apiClient.get("/dashboard/charts/orders-by-status", { params: { period }, signal });
    return response.data || { statusCounts: [] };
  }

  async getTopAppliances(period = PeriodFilter.ALL, status = StatusFilter.ALL, { signal } = {}) {
    const response = await apiClient.get("/dashboard/charts/top-appliances", { params: { period, status }, signal });
    return response.data || { appliances: [] };
  }

  async getTopComponents(period = PeriodFilter.ALL, status = StatusFilter.ALL, { signal } = {}) {
    const response = await apiClient.get("/dashboard/charts/top-components", { params: { period, status }, signal });
    return response.data || { components: [] };
  }

  async getOverview(period = PeriodFilter.THIRTY_DAYS, { signal } = {}) {
    const [revenue, ongoingOrders, averageOrderPrice, averageRepairTime, topAppliances] = await Promise.all([
      this.getMetrics(period, StatusFilter.ALL, { signal }),
      this.getOngoingOrders(period, { signal }),
      this.getAverageOrderPrice(period, StatusFilter.ALL, { signal }),
      this.getAverageRepairTime(period, StatusFilter.ALL, { signal }),
      this.getTopAppliances(period, StatusFilter.ALL, { signal }),
    ]);

    return {
      revenue: revenue?.value ?? 0,
      ongoingOrders: ongoingOrders?.value ?? 0,
      averageOrderPrice: averageOrderPrice?.value ?? 0,
      averageRepairTime: averageRepairTime?.value ?? 0,
      topAppliances: topAppliances?.appliances ?? [],
    };
  }
}

export const dashboardService = new DashboardService();
