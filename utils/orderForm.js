import { ORDER_STATUS_LABEL, formatDateBR } from "./orders";
import { parseNumber } from "./orderPayload";

let deviceSeq = 0;

export function emptyDevice() {
  deviceSeq += 1;
  return {
    key: `device-new-${deviceSeq}`,
    appliance: "",
    brand: "",
    model: "",
    voltage: "127V",
    serial: "",
    labor: 0,
  };
}

export function todayBR(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return formatDateBR(date);
}

export function createEmptyOrderForm() {
  return {
    client: null,
    status: "Pendente",
    note: "",
    technicalNote: "",
    devices: [emptyDevice()],
    parts: [],
    warranty: "90 dias",
    discount: "0",
    receivedAt: todayBR(),
    deadline: todayBR(7),
  };
}

export function orderToForm(order, demands = []) {
  const devices = (order.appliances ?? []).map((item, index) => ({
    key: `device-${item.id ?? index}`,
    id: item.id,
    appliance: item.type || "",
    brand: item.brand || "",
    model: item.model || "",
    voltage: item.volt || "127V",
    serial: item.series || "",
    labor: item.laborValue ?? 0,
  }));
  const quantityByComponent = Object.fromEntries(
    (demands ?? []).map((demand) => [String(demand.componentId), demand.quantity]),
  );

  return {
    client: order.user ?? null,
    status: ORDER_STATUS_LABEL[order.status] || "Pendente",
    note: order.customerDescription || "",
    technicalNote: order.technicalDescription || "",
    devices: devices.length ? devices : [emptyDevice()],
    parts: (order.parts ?? []).map((part) => ({
      key: `part-${part.id}`,
      componentId: part.id,
      name: part.item || part.description || "",
      quantity: Number(quantityByComponent[String(part.id)] ?? 1),
      price: part.price ?? 0,
    })),
    warranty: "90 dias",
    discount: String(order.discount ?? 0),
    receivedAt: formatDateBR(order.receivedAt) || todayBR(),
    deadline: formatDateBR(order.deadline) || todayBR(7),
  };
}

export function computeTotals({ devices = [], parts = [], discount }) {
  const labor = devices.reduce((total, device) => total + parseNumber(device.labor), 0);
  const partsTotal = parts.reduce((total, part) => total + parseNumber(part.price) * (Number(part.quantity) || 0), 0);
  const discountValue = parseNumber(discount);
  return { labor, parts: partsTotal, discount: discountValue, total: labor + partsTotal - discountValue };
}

export function addComponentToParts(parts, component) {
  if (parts.some((part) => part.componentId === component.id)) {
    return parts.map((part) =>
      part.componentId === component.id ? { ...part, quantity: Number(part.quantity || 1) + 1 } : part,
    );
  }
  return [
    ...parts,
    {
      key: `part-${component.id}`,
      componentId: component.id,
      name: component.item || "",
      quantity: 1,
      price: component.price ?? 0,
    },
  ];
}

export function matchesClient(client, query) {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  const digits = query.replace(/\D/g, "");
  const fullName = `${client.name || ""} ${client.lastName || ""}`.toLowerCase();
  const email = (client.email || "").toLowerCase();
  const phone = (client.phone || "").replace(/\D/g, "");
  const cpf = (client.cpf || "").replace(/\D/g, "");
  return (
    fullName.includes(text) || email.includes(text) || (!!digits && (phone.includes(digits) || cpf.includes(digits)))
  );
}

export function matchesComponent(component, query) {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  const haystack = `${component.item || ""} ${component.description || ""} ${component.brand || ""}`.toLowerCase();
  return haystack.includes(text);
}

export function displayContact(value, fallback = "Não informado") {
  return value?.trim() ? value : fallback;
}

export function deviceSummary(device) {
  const label = [device.appliance, device.brand, device.model].filter(Boolean).join(" ");
  if (!label) return "Novo aparelho";
  return device.voltage ? `${label} · ${device.voltage}` : label;
}

export function appendTranscribedText(current, incoming) {
  const next = String(incoming || "").trim();
  if (!next) return String(current || "");
  const prev = String(current || "").trimEnd();
  if (!prev) return next;
  return `${prev}\n${next}`;
}

export function validateOrderForm(form) {
  if (!form.client?.id) return "Selecione um cliente da lista.";
  if (!form.devices.some((device) => String(device.appliance || "").trim())) return "Adicione pelo menos um aparelho.";
  return "";
}
