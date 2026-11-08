import { thinkingElapsedLabel, thinkingPhrases } from "../chat";

describe("thinkingPhrases", () => {
  it("adapts the phrases to the subject of the question", () => {
    expect(thinkingPhrases("Quais ordens estão atrasadas?")).toEqual([
      "Pensando",
      "Consultando suas ordens de serviço",
      "Verificando os prazos dos consertos",
      "Organizando a resposta",
    ]);
    expect(thinkingPhrases("Quanto faturei com peças do estoque?")).toEqual(
      expect.arrayContaining(["Conferindo o estoque", "Calculando os valores"]),
    );
  });

  it("falls back to generic phrases", () => {
    expect(thinkingPhrases("Bom dia")).toEqual([
      "Pensando",
      "Entendendo sua pergunta",
      "Reunindo as informações",
      "Organizando a resposta",
    ]);
  });
});

describe("thinkingElapsedLabel", () => {
  it("only shows the timer after three seconds", () => {
    const start = new Date(2026, 10, 7, 10, 0, 0);
    expect(thinkingElapsedLabel(start, start.getTime() + 2000)).toBe("");
    expect(thinkingElapsedLabel(start, start.getTime() + 7400)).toBe("7s");
  });
});
