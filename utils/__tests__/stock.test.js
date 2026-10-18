import { componentToForm, parseDecimalBR, validateStockForm } from "../stock";

describe("stock utils", () => {
  it("parses Brazilian decimal input", () => {
    expect(parseDecimalBR("1.250,50")).toBe(1250.5);
    expect(parseDecimalBR("R$ 18,00")).toBe(18);
    expect(parseDecimalBR("42.5")).toBe(42.5);
    expect(parseDecimalBR("")).toBe(0);
  });

  it("maps a ComponentDto to form values", () => {
    expect(componentToForm({ item: "Motor", price: 220, quantity: 8, brand: null })).toEqual({
      item: "Motor",
      brand: "",
      category: "",
      quantity: "8",
      price: "220,00",
      supplier: "",
      description: "",
    });
  });

  it("requires a name and a positive price", () => {
    expect(validateStockForm({ item: "", price: "10" })).toBe("Informe o nome do item.");
    expect(validateStockForm({ item: "Motor", price: "0" })).toBe("Informe um preço válido.");
    expect(validateStockForm({ item: "Motor", price: "10,00" })).toBe("");
  });
});
