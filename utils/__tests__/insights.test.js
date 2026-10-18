import { insightsRefetchInterval } from "../../hooks/queries/useInsights";
import { describeInsightsState, formatMedianPrice, insightJobErrorMessage, insightTypeInfo } from "../insights";

describe("describeInsightsState", () => {
  const base = { requestedMonth: "outubro de 2026", availableMonth: "setembro de 2026" };

  it.each([
    ["READY", { tone: "ok", polling: false, canGenerate: false }],
    ["STALE", { tone: "warning", polling: false, canGenerate: true }],
    ["AWAITING_DATA", { tone: "info", polling: false, canGenerate: false }],
    ["GENERATING", { tone: "info", polling: true, canGenerate: false }],
    ["FAILED", { tone: "error", polling: false, canGenerate: true }],
  ])("describes %s", (state, expected) => {
    expect(describeInsightsState({ ...base, state })).toMatchObject(expected);
  });

  it("explains failures and does not offer a retry when insights are disabled", () => {
    const status = describeInsightsState({ ...base, state: "FAILED", failureReason: "INSIGHTS_DISABLED" });
    expect(status.message).toBe(
      "A geração de insights está desativada no servidor. Exibindo insights de setembro de 2026.",
    );
    expect(status.canGenerate).toBe(false);
  });
});

describe("insightsRefetchInterval", () => {
  it("polls only while generating", () => {
    expect(insightsRefetchInterval({ state: { data: { state: "GENERATING" } } })).toBe(15000);
    expect(insightsRefetchInterval({ state: { data: { state: "READY" } } })).toBe(false);
    expect(insightsRefetchInterval({ state: { data: undefined } })).toBe(false);
  });
});

describe("insight helpers", () => {
  it("formats rising product prices including a null median", () => {
    expect(formatMedianPrice({ medianPrice: 10, validPriceCount: 1 })).toBe("R$ 10,00 · 1 preço");
    expect(formatMedianPrice({ medianPrice: null, validPriceCount: 0 })).toBe("Preço indisponível");
  });

  it("maps types and job errors", () => {
    expect(insightTypeInfo("ALERTA_PRECO").title).toBe("ALERTA DE PREÇO");
    expect(insightTypeInfo("NOVO_TIPO").title).toBe("INSIGHT");
    expect(insightJobErrorMessage({ code: "INSIGHTS_DISABLED" })).toBe(
      "A geração de insights está desativada no servidor.",
    );
  });
});
