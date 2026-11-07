import {
  buildConfirmPayload,
  canConfirm,
  dtoToDraft,
  fieldPathToItemIndex,
  formatBRL,
  formatIssueDate,
  groupItems,
  ITEM_ACTION,
  reconcileManualIds,
  stageIndex,
  summarize,
  summarizeResult,
} from "../stockImport";

function dtoItem(overrides = {}) {
  return {
    id: 1,
    lineNumber: 1,
    description: "GAS R134A 750G",
    quantity: 10,
    unit: "UN",
    unitPrice: 89.5,
    total: 895,
    confidence: 0.95,
    warnings: [],
    match: {
      type: "FUZZY",
      componentId: 12,
      confidence: 0.91,
      candidates: [
        { componentId: 12, name: "Gás R134a", brand: "Chemours", currentQuantity: 20, price: 95, score: 0.91 },
      ],
    },
    action: "ADD_TO_EXISTING",
    ...overrides,
  };
}

function dto(items) {
  return {
    id: 7,
    status: "READY",
    supplier: { name: "FrioSul", cnpj: "12345678000190" },
    invoice: { number: "45", series: "1", issuedAt: "2026-11-01T10:00:00Z", total: 1000 },
    warnings: [],
    items,
  };
}

describe("dtoToDraft", () => {
  it("orders items by line number and resolves the suggested component", () => {
    const draft = dtoToDraft(dto([dtoItem({ id: 2, lineNumber: 2 }), dtoItem({ id: 1, lineNumber: 1 })]));

    expect(draft.items.map((item) => item.id)).toEqual([1, 2]);
    expect(draft.items[0]).toMatchObject({
      key: "1",
      componentId: 12,
      componentName: "Gás R134a",
      componentQuantity: 20,
      action: ITEM_ACTION.ADD,
    });
  });

  it("prefers the reviewed componentId returned after a saved draft", () => {
    const draft = dtoToDraft(dto([dtoItem({ componentId: 99 })]));
    expect(draft.items[0].componentId).toBe(99);
  });
});

describe("attention rules", () => {
  it("blocks confirmation on low confidence, fractional quantity or a missing component", () => {
    const draft = dtoToDraft(
      dto([
        dtoItem({ id: 1, warnings: ["LOW_CONFIDENCE"] }),
        dtoItem({ id: 2, quantity: 2.5 }),
        dtoItem({ id: 3, match: { type: "FUZZY", componentId: null, candidates: [] }, action: "ADD_TO_EXISTING" }),
        dtoItem({ id: 4 }),
      ]),
    );

    const groups = groupItems(draft.items);
    expect(groups.attention.map((item) => item.id)).toEqual([1, 2, 3]);
    expect(groups.ready.map((item) => item.id)).toEqual([4]);
    expect(canConfirm(draft)).toBe(false);
  });

  it("allows confirmation once warnings are reviewed and problems fixed", () => {
    const draft = dtoToDraft(
      dto([dtoItem({ id: 1, warnings: ["LOW_CONFIDENCE"] }), dtoItem({ id: 2, quantity: 2.5 })]),
    );
    draft.items[0] = { ...draft.items[0], reviewed: true };
    draft.items[1] = { ...draft.items[1], action: ITEM_ACTION.IGNORE };

    expect(canConfirm(draft)).toBe(true);
  });

  it("does not allow confirming when every item is ignored", () => {
    const draft = dtoToDraft(dto([dtoItem({ action: "IGNORE" })]));
    expect(canConfirm(draft)).toBe(false);
  });
});

describe("buildConfirmPayload", () => {
  it("sends the full reviewed list and only keeps fields relevant to each action", () => {
    const draft = dtoToDraft(dto([dtoItem({ id: 1 }), dtoItem({ id: 2, match: { type: "NONE", candidates: [] } })]));
    draft.items[0] = { ...draft.items[0], updatePrice: true };
    draft.items[1] = {
      ...draft.items[1],
      action: ITEM_ACTION.CREATE,
      newComponent: { name: "Termostato", brand: null, category: null, description: null },
    };

    const payload = buildConfirmPayload(draft);

    expect(payload.supplier).toEqual({ name: "FrioSul", cnpj: "12345678000190" });
    expect(payload.invoice).toEqual({ number: "45", series: "1", issuedAt: "2026-11-01T10:00:00Z" });
    expect(payload.items).toEqual([
      {
        id: 1,
        description: "GAS R134A 750G",
        quantity: 10,
        unit: "UN",
        unitPrice: 89.5,
        action: "ADD_TO_EXISTING",
        componentId: 12,
        updatePrice: true,
        newComponent: null,
      },
      {
        id: 2,
        description: "GAS R134A 750G",
        quantity: 10,
        unit: "UN",
        unitPrice: 89.5,
        action: "CREATE_NEW",
        componentId: null,
        updatePrice: false,
        newComponent: { name: "Termostato", brand: null, category: null, description: null },
      },
    ]);
  });
});

describe("summaries", () => {
  it("summarizes the draft ignoring skipped items", () => {
    const draft = dtoToDraft(dto([dtoItem({ id: 1 }), dtoItem({ id: 2, action: "IGNORE" })]));
    expect(summarize(draft.items)).toMatchObject({ count: 1, ignored: 1, toUpdate: 1, units: 10, total: 895 });
  });

  it("summarizes a confirmed import from item results", () => {
    const result = summarizeResult({
      items: [
        { total: 100, result: { created: false, previousQuantity: 5, newQuantity: 9 } },
        { total: 50, result: { created: true, previousQuantity: 0, newQuantity: 3 } },
        { total: 10, result: null },
      ],
    });
    expect(result).toEqual({ updated: 1, created: 1, units: 7, total: 150 });
  });
});

describe("helpers", () => {
  it("formats currency in pt-BR", () => {
    expect(formatBRL(1234.5)).toBe("R$ 1.234,50");
    expect(formatBRL(null)).toBe("—");
  });

  it("formats the issue date from the invoice offset without shifting the day", () => {
    expect(formatIssueDate("2026-11-03T00:00:00-03:00")).toBe("03/11/2026");
    expect(formatIssueDate(null)).toBeNull();
  });

  it("maps the backend processing stage to the checklist step", () => {
    expect(stageIndex("RECEIVED")).toBe(0);
    expect(stageIndex("MATCHING")).toBe(2);
    expect(stageIndex(null)).toBeNull();
  });

  it("maps server field paths to item indexes", () => {
    expect(fieldPathToItemIndex("items[2].quantity")).toBe(2);
    expect(fieldPathToItemIndex("supplier.name")).toBeNull();
  });

  it("assigns server ids to manual items in order", () => {
    const draft = {
      items: [
        { key: "1", id: 1 },
        { key: "a", id: null },
        { key: "b", id: null },
      ],
    };
    const next = reconcileManualIds(draft, { items: [{ id: 1 }, { id: 50 }, { id: 51 }] });
    expect(next.items.map((item) => item.id)).toEqual([1, 50, 51]);
  });
});
