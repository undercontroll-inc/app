export function parseDecimalBR(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  let text = String(value ?? "").replace(/[^\d.,-]/g, "");
  if (text.includes(",")) text = text.replace(/\./g, "").replace(",", ".");
  const amount = Number(text);
  return Number.isFinite(amount) ? amount : 0;
}

export function formatDecimalBR(value) {
  if (value == null || value === "") return "";
  return Number(value).toFixed(2).replace(".", ",");
}

export const emptyStockForm = {
  item: "",
  brand: "",
  category: "",
  quantity: "",
  price: "",
  supplier: "",
  description: "",
};

export function componentToForm(component) {
  return {
    item: component?.item ?? "",
    brand: component?.brand ?? "",
    category: component?.category ?? "",
    quantity: component?.quantity != null ? String(component.quantity) : "",
    price: formatDecimalBR(component?.price),
    supplier: component?.supplier ?? "",
    description: component?.description ?? "",
  };
}

export function validateStockForm(form) {
  if (!form.item.trim()) return "Informe o nome do item.";
  if (!form.price.trim() || parseDecimalBR(form.price) <= 0) return "Informe um preço válido.";
  return "";
}

function baseComponentPayload(form) {
  return {
    item: form.item.trim(),
    description: form.description.trim(),
    brand: form.brand.trim(),
    category: form.category.trim(),
    price: parseDecimalBR(form.price),
    supplier: form.supplier.trim(),
  };
}

export function buildRegisterComponentPayload(form) {
  return {
    ...baseComponentPayload(form),
    quantity: Math.max(0, Math.trunc(parseDecimalBR(form.quantity))),
  };
}

export function buildUpdateComponentPayload(form) {
  return baseComponentPayload(form);
}

export function stockCategoryLabel(component) {
  return [component.brand, component.category].filter(Boolean).join(" · ") || "Sem categoria";
}
