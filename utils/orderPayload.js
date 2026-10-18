import { ORDER_STATUS_API } from "./orders";

export function parseNumber(value) {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

export function validDevices(devices = []) {
  return devices.filter((device) => String(device.appliance || "").trim());
}

export function toPartsPayload(parts = []) {
  return parts
    .filter((part) => part.componentId && Number(part.quantity) > 0)
    .map((part) => ({
      componentId: part.componentId,
      quantity: Number(part.quantity) || 1,
    }));
}

export function buildCreateOrderPayload(form) {
  return {
    userId: form.client?.id,
    appliances: validDevices(form.devices).map((device) => ({
      type: device.appliance,
      brand: device.brand,
      model: device.model,
      voltage: device.voltage,
      serial: device.serial,
      laborValue: parseNumber(device.labor),
    })),
    parts: toPartsPayload(form.parts),
    discount: parseNumber(form.discount),
    receivedAt: form.receivedAt,
    deadline: form.deadline,
    customerDescription: form.note,
    technicalDescription: form.technicalNote,
    status: "PENDING",
    returnGuarantee: Boolean(form.warranty),
    fabricGuarantee: false,
  };
}

export function buildUpdateOrderPayload(form) {
  return {
    status: ORDER_STATUS_API[form.status] || "PENDING",
    appliances: validDevices(form.devices).map((device) => ({
      id: device.id,
      type: device.appliance,
      brand: device.brand,
      model: device.model,
      volt: device.voltage,
      series: device.serial,
      laborValue: parseNumber(device.labor),
    })),
    parts: toPartsPayload(form.parts),
    customerDescription: form.note,
    technicalDescription: form.technicalNote,
  };
}
