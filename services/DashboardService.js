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
  async getMetrics(period = PeriodFilter.ALL, status = StatusFilter.ALL) {
    const response = await apiClient.get("/dashboard/metrics", { params: { period, status } });
    return response.data || { value: 0 };
  }

  async getProfitMargin(period = PeriodFilter.ALL, status = StatusFilter.ALL) {
    const response = await apiClient.get("/dashboard/profit-margin", { params: { period, status } });
    return response.data || { value: 0 };
  }

  async getAverageOrderPrice(period = PeriodFilter.ALL, status = StatusFilter.ALL) {
    const response = await apiClient.get("/dashboard/average-order-price", { params: { period, status } });
    return response.data || { value: 0 };
  }

  async getOngoingOrders(period = PeriodFilter.ALL) {
    const response = await apiClient.get("/dashboard/ongoing-orders", { params: { period } });
    return response.data || { value: 0 };
  }

  async getAverageRepairTime(period = PeriodFilter.ALL, status = StatusFilter.ALL) {
    const response = await apiClient.get("/dashboard/average-repair-time", { params: { period, status } });
    return response.data || { value: 0 };
  }

  async getRevenueEvolution(period = PeriodFilter.THIRTY_DAYS, status = StatusFilter.ALL) {
    const response = await apiClient.get("/dashboard/charts/revenue-evolution", { params: { period, status } });
    return response.data || { dataPoints: [] };
  }

  async getCustomerType(period = PeriodFilter.THIRTY_DAYS, status = StatusFilter.ALL) {
    const response = await apiClient.get("/dashboard/charts/customer-type", { params: { period, status } });
    return response.data || { dataPoints: [] };
  }

  async getOrdersByStatus(period = PeriodFilter.ALL) {
    const response = await apiClient.get("/dashboard/charts/orders-by-status", { params: { period } });
    return response.data || { statusCounts: [] };
  }

  async getTopAppliances(period = PeriodFilter.ALL, status = StatusFilter.ALL) {
    const response = await apiClient.get("/dashboard/charts/top-appliances", { params: { period, status } });
    return response.data || { appliances: [] };
  }

  async getTopComponents(period = PeriodFilter.ALL, status = StatusFilter.ALL) {
    const response = await apiClient.get("/dashboard/charts/top-components", { params: { period, status } });
    return response.data || { components: [] };
  }

  async getAllDashboardData(period = PeriodFilter.THIRTY_DAYS, status = StatusFilter.ALL) {
    const [
      metrics,
      profitMargin,
      averageOrderPrice,
      ongoingOrders,
      averageRepairTime,
      revenueEvolution,
      customerType,
      ordersByStatus,
      topAppliances,
      topComponents,
    ] = await Promise.all([
      this.getMetrics(period, status),
      this.getProfitMargin(period, status),
      this.getAverageOrderPrice(period, status),
      this.getOngoingOrders(period),
      this.getAverageRepairTime(period, status),
      this.getRevenueEvolution(period, status),
      this.getCustomerType(period, status),
      this.getOrdersByStatus(period),
      this.getTopAppliances(period, status),
      this.getTopComponents(period, status),
    ]);

    return {
      metrics,
      profitMargin,
      averageOrderPrice,
      ongoingOrders,
      averageRepairTime,
      revenueEvolution,
      customerType,
      ordersByStatus,
      topAppliances,
      topComponents,
    };
  }
}

export const dashboardService = new DashboardService();
