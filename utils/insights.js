export const INSIGHTS_POLL_INTERVAL_MS = 15000;

export const INSIGHT_TYPES = {
  TENDENCIA_ALTA: { color: "#ef7f19", icon: "trending-up", title: "TENDÊNCIA DE ALTA" },
  OPORTUNIDADE_ESTOQUE: { color: "#08b77a", icon: "box", title: "OPORTUNIDADE DE ESTOQUE" },
  ALERTA_PRECO: { color: "#367ff1", icon: "dollar-sign", title: "ALERTA DE PREÇO" },
  OPORTUNIDADE_REPARO: { color: "#ef7f19", icon: "tool", title: "OPORTUNIDADE DE REPARO" },
  DESTAQUE_MARCA: { color: "#8b5cf6", icon: "award", title: "DESTAQUE DE MARCA" },
  ALERTA_MERCADO: { color: "#ed3d4d", icon: "alert-triangle", title: "ALERTA DE MERCADO" },
  RECOMENDACAO: { color: "#f59e0b", icon: "star", title: "RECOMENDAÇÃO" },
};

const DEFAULT_INSIGHT_TYPE = { color: "#667994", icon: "info", title: "INSIGHT" };

export function insightTypeInfo(type) {
  return INSIGHT_TYPES[type] || DEFAULT_INSIGHT_TYPE;
}

const FAILURE_MESSAGES = {
  INSIGHTS_DISABLED: "A geração de insights está desativada no servidor.",
  MARKET_DATA: "Os dados de mercado estão indisponíveis.",
  TIMEOUT: "A geração demorou demais.",
  RATE_LIMITED: "O limite de uso da IA foi atingido.",
  INVALID_OUTPUT: "A IA retornou uma resposta inválida.",
};

export function failureMessage(reason) {
  return FAILURE_MESSAGES[reason] || "Não foi possível gerar os insights.";
}

export function hasInsightsContent(data) {
  return Boolean(data?.insights?.length || data?.risingProducts?.length);
}

export function describeInsightsState(data) {
  const requested = data?.requestedMonth || "este mês";
  const available = data?.availableMonth;
  switch (data?.state) {
    case "READY":
      return { tone: "ok", message: "", polling: false, canGenerate: false };
    case "STALE":
      return {
        tone: "warning",
        message: `Exibindo insights de ${available || "um mês anterior"}. Os dados de ${requested} ainda não foram analisados.`,
        polling: false,
        canGenerate: true,
      };
    case "AWAITING_DATA":
      return {
        tone: "info",
        message: `Aguardando os dados de mercado de ${requested}. Os insights aparecem assim que forem publicados.`,
        polling: false,
        canGenerate: false,
      };
    case "GENERATING":
      return {
        tone: "info",
        message: `Gerando insights de ${requested}. Isso pode levar alguns minutos.`,
        polling: true,
        canGenerate: false,
      };
    case "FAILED":
      return {
        tone: "error",
        message: `${failureMessage(data.failureReason)}${available ? ` Exibindo insights de ${available}.` : ""}`,
        polling: false,
        canGenerate: data.failureReason !== "INSIGHTS_DISABLED",
      };
    default:
      return { tone: "info", message: "", polling: false, canGenerate: false };
  }
}

export function formatMedianPrice(product) {
  if (product?.medianPrice == null) return "Preço indisponível";
  const amount = Number(product.medianPrice).toFixed(2).replace(".", ",");
  const count = product.validPriceCount ?? 0;
  return `R$ ${amount} · ${count} ${count === 1 ? "preço" : "preços"}`;
}

export function insightJobErrorMessage(error) {
  if (error?.code === "AWAITING_DATA") return "Ainda não há dados de mercado publicados para gerar insights.";
  if (error?.code === "INSIGHTS_DISABLED") return "A geração de insights está desativada no servidor.";
  if (error?.code === "MARKET_DATA_UNAVAILABLE") return "Os dados de mercado estão indisponíveis. Tente mais tarde.";
  return error?.message || "Não foi possível solicitar a geração de insights.";
}
