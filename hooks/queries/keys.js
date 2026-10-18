export const queryKeys = {
  orders: {
    all: ["orders"],
    list: (filters = {}) => ["orders", "list", filters],
    infinite: () => ["orders", "infinite"],
    detail: (orderId) => ["orders", "detail", String(orderId)],
    demands: (orderId) => ["orders", "demands", String(orderId)],
  },
  customers: {
    all: ["customers"],
    list: () => ["customers", "list"],
    detail: (customerId) => ["customers", "detail", String(customerId)],
  },
  components: {
    all: ["components"],
    list: () => ["components", "list"],
    detail: (componentId) => ["components", "detail", String(componentId)],
  },
  chatSuggestions: ["chat", "suggestions"],
  insights: ["insights"],
  dashboard: (period) => ["dashboard", period],
};
