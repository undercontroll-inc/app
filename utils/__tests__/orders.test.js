import { formatCurrency, formatDateBR, toOrderCard } from "../orders";

describe("orders utils", () => {
  it("formats ISO and Date values as dd/mm/yyyy", () => {
    expect(formatDateBR("2026-09-02")).toBe("02/09/2026");
    expect(formatDateBR("2026-09-02T10:00:00")).toBe("02/09/2026");
    expect(formatDateBR(new Date(2026, 0, 5))).toBe("05/01/2026");
    expect(formatDateBR("05/01/2026")).toBe("05/01/2026");
    expect(formatDateBR(null)).toBe("");
  });

  it("formats currency in BRL style", () => {
    expect(formatCurrency(1234.5)).toBe("R$ 1234,50");
    expect(formatCurrency("abc")).toBe("R$ 0,00");
  });

  it("maps an API order to the card view model", () => {
    const card = toOrderCard({
      id: 7,
      status: "IN_ANALYSIS",
      receivedAt: "2026-09-02",
      user: { name: "Maria", lastName: "Silva" },
      appliances: [{ type: "Geladeira", brand: "Consul", model: "CRM56" }],
    });
    expect(card).toEqual({
      id: "7",
      client: "Maria Silva",
      device: "Geladeira Consul CRM56",
      status: "Em análise",
      date: "02/09/2026",
    });
  });
});
