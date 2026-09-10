export const ORDER_STATUS_LABEL = {
  PENDING: "Pendente",
  IN_ANALYSIS: "Em análise",
  COMPLETED: "Concluído",
  DELIVERED: "Entregue",
};

export const ORDER_STATUS_API = {
  Pendente: "PENDING",
  "Em análise": "IN_ANALYSIS",
  Concluído: "COMPLETED",
  Entregue: "DELIVERED",
};

export const ORDER_STATUS_OPTIONS = ["Pendente", "Em análise", "Concluído", "Entregue"];

export function formatUserName(user) {
  if (!user) return "Cliente";
  return [user.name, user.lastName].filter(Boolean).join(" ").trim() || "Cliente";
}

export function formatAppliance(item) {
  if (!item) return "Sem aparelho";
  return [item.type, item.brand, item.model].filter(Boolean).join(" ").trim() || "Sem aparelho";
}

export function formatDateBR(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${value.getFullYear()}`;
  }
  const text = String(value);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text;
  const iso = text.slice(0, 10);
  const [year, month, day] = iso.split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return text;
}

export function formatCurrency(value) {
  const amount = Number(value) || 0;
  return `R$ ${amount.toFixed(2).replace(".", ",")}`;
}

export function toOrderCard(order) {
  return {
    id: String(order.id),
    client: formatUserName(order.user),
    device: formatAppliance(order.appliances?.[0]),
    status: ORDER_STATUS_LABEL[order.status] || order.status,
    date: formatDateBR(order.receivedAt),
  };
}
