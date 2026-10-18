import { buildCreateOrderPayload, buildUpdateOrderPayload, parseNumber } from "../orderPayload";
import { orderToForm } from "../orderForm";
import { getNextOrdersPage, updateOrderInCache } from "../../hooks/queries/useOrders";

const form = {
  client: { id: 2 },
  status: "Em análise",
  devices: [
    {
      key: "d1",
      id: 5,
      appliance: "Geladeira",
      brand: "Consul",
      model: "CRM56",
      voltage: "220V",
      serial: "S1",
      labor: "180,50",
    },
    { key: "d2", appliance: "  ", brand: "", model: "", voltage: "127V", serial: "", labor: 0 },
  ],
  parts: [
    { key: "p1", componentId: 10, quantity: 2, price: 420 },
    { key: "p2", componentId: null, quantity: 1, price: 1 },
  ],
  note: "Não gela",
  technicalNote: "Compressor",
  discount: "15,5",
  receivedAt: "02/09/2026",
  deadline: "09/09/2026",
  warranty: "90 dias",
};

describe("order payloads", () => {
  it("builds CreateOrderRequest with voltage/serial, discount, dates and guarantee", () => {
    expect(buildCreateOrderPayload(form)).toEqual({
      userId: 2,
      appliances: [
        { type: "Geladeira", brand: "Consul", model: "CRM56", voltage: "220V", serial: "S1", laborValue: 180.5 },
      ],
      parts: [{ componentId: 10, quantity: 2 }],
      discount: 15.5,
      receivedAt: "02/09/2026",
      deadline: "09/09/2026",
      customerDescription: "Não gela",
      technicalDescription: "Compressor",
      status: "PENDING",
      returnGuarantee: true,
      fabricGuarantee: false,
    });
  });

  it("builds UpdateOrderRequest with volt/series and only the fields the API accepts", () => {
    const payload = buildUpdateOrderPayload(form);
    expect(payload).toEqual({
      status: "IN_ANALYSIS",
      appliances: [
        { id: 5, type: "Geladeira", brand: "Consul", model: "CRM56", volt: "220V", series: "S1", laborValue: 180.5 },
      ],
      parts: [{ componentId: 10, quantity: 2 }],
      customerDescription: "Não gela",
      technicalDescription: "Compressor",
    });
    expect(payload).not.toHaveProperty("discount");
    expect(payload).not.toHaveProperty("receivedAt");
  });

  it("round-trips an API order into the update payload", () => {
    const order = {
      status: "COMPLETED",
      user: { id: 3 },
      appliances: [{ id: 1, type: "Micro-ondas", brand: "LG", model: "M1", volt: "127V", series: "X", laborValue: 90 }],
      parts: [{ id: 11, item: "Fusível", price: 12 }],
      customerDescription: "a",
      technicalDescription: "b",
    };
    expect(buildUpdateOrderPayload(orderToForm(order, [{ componentId: 11, quantity: 3 }]))).toEqual({
      status: "COMPLETED",
      appliances: [{ id: 1, type: "Micro-ondas", brand: "LG", model: "M1", volt: "127V", series: "X", laborValue: 90 }],
      parts: [{ componentId: 11, quantity: 3 }],
      customerDescription: "a",
      technicalDescription: "b",
    });
  });

  it("parses decimal input", () => {
    expect(parseNumber("R$ 12,30")).toBe(12.3);
    expect(parseNumber("abc")).toBe(0);
  });
});

describe("orders cache helpers", () => {
  it("computes the next page from the API page metadata", () => {
    expect(getNextOrdersPage({ page: 0, totalPages: 3 })).toBe(1);
    expect(getNextOrdersPage({ page: 2, totalPages: 3 })).toBeUndefined();
  });

  it("updates an order in infinite and paged caches and ignores other shapes", () => {
    const infinite = { pages: [{ data: [{ id: 1, status: "PENDING" }] }, { data: [{ id: 2, status: "PENDING" }] }] };
    expect(updateOrderInCache(infinite, "2", { status: "COMPLETED" }).pages[1].data[0].status).toBe("COMPLETED");
    const paged = { data: [{ id: 1, status: "PENDING" }] };
    expect(updateOrderInCache(paged, 1, { status: "DELIVERED" }).data[0].status).toBe("DELIVERED");
    const detail = { id: 1, status: "PENDING" };
    expect(updateOrderInCache(detail, 1, { status: "DELIVERED" })).toBe(detail);
  });
});
