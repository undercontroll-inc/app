import { formatDecimalBR } from "./stock";

export const IMPORT_STATUS = {
  PROCESSING: "PROCESSING",
  READY: "READY",
  FAILED: "FAILED",
  CONFIRMED: "CONFIRMED",
  CANCELED: "CANCELED",
};

export const ITEM_ACTION = {
  ADD: "ADD_TO_EXISTING",
  CREATE: "CREATE_NEW",
  IGNORE: "IGNORE",
};

export const IMPORT_STEPS = ["Enviar", "Analisar", "Revisar", "Confirmar"];

export const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "application/xml", "text/xml"];
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ATTENTION_WARNINGS = ["LOW_CONFIDENCE", "MISSING_UNIT_PRICE", "TOTAL_MISMATCH", "NON_INTEGER_QUANTITY"];

const FAILURE_MESSAGES = {
  UNREADABLE: {
    title: "Não conseguimos ler a nota",
    message: "A foto ficou ilegível. Tente de novo com mais luz e a nota inteira no enquadramento.",
  },
  NOT_AN_INVOICE: {
    title: "Isso não parece uma nota fiscal",
    message: "Envie a foto, o PDF ou o XML de uma nota de compra.",
  },
  INVALID_XML: {
    title: "XML inválido",
    message: "O arquivo XML não é uma NF-e válida. Confira o arquivo ou envie uma foto da nota.",
  },
  AI_UNAVAILABLE: {
    title: "Leitura indisponível",
    message: "A leitura automática está fora do ar no momento. Tente novamente em alguns minutos.",
  },
  TIMEOUT: {
    title: "A leitura demorou demais",
    message: "Não terminamos a análise a tempo. Tente novamente.",
  },
};

const ITEM_WARNING_LABELS = {
  LOW_CONFIDENCE: "Leitura com baixa confiança",
  MISSING_UNIT_PRICE: "Preço unitário não encontrado",
  TOTAL_MISMATCH: "Total não bate com quantidade × preço",
  NON_INTEGER_QUANTITY: "Quantidade fracionada",
};

export function failureCopy(reason) {
  return (
    FAILURE_MESSAGES[reason] ?? {
      title: "Não foi possível analisar a nota",
      message: "Tente novamente ou envie outro arquivo.",
    }
  );
}

export function itemWarningLabel(warning) {
  return ITEM_WARNING_LABELS[warning] ?? null;
}

export function formatBRL(value) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  const [int, dec] = Number(value).toFixed(2).split(".");
  return `R$ ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${dec}`;
}

export function formatQuantity(value) {
  if (value == null) return "";
  const number = Number(value);
  if (Number.isInteger(number)) return String(number);
  return String(number).replace(".", ",");
}

export function formatUnit(unit) {
  return unit ? unit.toLowerCase() : "un";
}

export function formatIssueDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ""));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : null;
}

const STAGE_INDEX = { RECEIVED: 0, EXTRACTING: 1, MATCHING: 2 };

export function stageIndex(stage) {
  return STAGE_INDEX[stage] ?? null;
}

export function formatCnpj(digits) {
  const text = String(digits ?? "").replace(/\D/g, "");
  if (text.length !== 14) return digits || null;
  return text.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function lineTotal(item) {
  if (item.unitPrice == null) return null;
  return Math.round(Number(item.quantity || 0) * Number(item.unitPrice) * 100) / 100;
}

let localKeySeq = 0;
function nextLocalKey() {
  localKeySeq += 1;
  return `local-${Date.now()}-${localKeySeq}`;
}

export function dtoItemToDraft(item) {
  const match = item.match ?? {};
  const candidates = match.candidates ?? [];
  const componentId = item.componentId ?? match.componentId ?? null;
  const selected = candidates.find((c) => c.componentId === componentId);
  return {
    key: String(item.id),
    id: item.id,
    lineNumber: item.lineNumber,
    supplierCode: item.supplierCode ?? null,
    description: item.description ?? "",
    quantity: item.quantity,
    unit: item.unit ?? null,
    unitPrice: item.unitPrice ?? null,
    action: item.action ?? (componentId != null ? ITEM_ACTION.ADD : ITEM_ACTION.CREATE),
    componentId,
    componentName: selected?.name ?? item.componentName ?? null,
    componentQuantity: selected?.currentQuantity ?? null,
    updatePrice: Boolean(item.updatePrice),
    newComponent: item.newComponent ?? null,
    confidence: item.confidence ?? 1,
    warnings: item.warnings ?? [],
    matchType: match.type ?? "NONE",
    matchConfidence: match.confidence ?? 0,
    candidates,
    reviewed: false,
  };
}

export function dtoToDraft(dto) {
  return {
    importId: dto.id,
    supplier: { name: dto.supplier?.name ?? null, cnpj: dto.supplier?.cnpj ?? null },
    invoice: {
      number: dto.invoice?.number ?? null,
      series: dto.invoice?.series ?? null,
      issuedAt: dto.invoice?.issuedAt ?? null,
      total: dto.invoice?.total ?? null,
    },
    warnings: dto.warnings ?? [],
    duplicateOfImportId: dto.duplicateOfImportId ?? null,
    items: [...(dto.items ?? [])].sort((a, b) => (a.lineNumber ?? 0) - (b.lineNumber ?? 0)).map(dtoItemToDraft),
  };
}

export function newManualItem() {
  return {
    key: nextLocalKey(),
    id: null,
    lineNumber: null,
    supplierCode: null,
    description: "",
    quantity: 1,
    unit: "UN",
    unitPrice: null,
    action: ITEM_ACTION.CREATE,
    componentId: null,
    componentName: null,
    componentQuantity: null,
    updatePrice: false,
    newComponent: null,
    confidence: 1,
    warnings: [],
    matchType: "NONE",
    matchConfidence: 0,
    candidates: [],
    reviewed: false,
    manual: true,
  };
}

export function itemProblems(item) {
  if (item.action === ITEM_ACTION.IGNORE) return [];
  const problems = [];
  if (!String(item.description ?? "").trim()) problems.push("Informe a descrição");
  const quantity = Number(item.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) problems.push("Informe a quantidade");
  else if (!Number.isInteger(quantity)) problems.push("Use uma quantidade inteira");
  if (item.action === ITEM_ACTION.ADD && item.componentId == null) problems.push("Escolha o produto do estoque");
  if (item.unitPrice != null && Number(item.unitPrice) < 0) problems.push("Preço inválido");
  return problems;
}

export function itemNeedsAttention(item) {
  if (item.action === ITEM_ACTION.IGNORE) return false;
  if (itemProblems(item).length > 0) return true;
  if (item.reviewed) return false;
  return item.warnings.some((warning) => ATTENTION_WARNINGS.includes(warning));
}

export function attentionReason(item) {
  const problems = itemProblems(item);
  if (problems.length) return problems[0];
  const warning = item.warnings.find((w) => ATTENTION_WARNINGS.includes(w));
  return warning ? itemWarningLabel(warning) : null;
}

export function groupItems(items) {
  const attention = [];
  const ready = [];
  const ignored = [];
  for (const item of items) {
    if (item.action === ITEM_ACTION.IGNORE) ignored.push(item);
    else if (itemNeedsAttention(item)) attention.push(item);
    else ready.push(item);
  }
  return { attention, ready, ignored };
}

export function canConfirm(draft) {
  if (!draft) return false;
  const active = draft.items.filter((item) => item.action !== ITEM_ACTION.IGNORE);
  return active.length > 0 && active.every((item) => !itemNeedsAttention(item));
}

export function summarize(items) {
  const active = items.filter((item) => item.action !== ITEM_ACTION.IGNORE);
  return {
    count: active.length,
    ignored: items.length - active.length,
    toUpdate: active.filter((item) => item.action === ITEM_ACTION.ADD).length,
    toCreate: active.filter((item) => item.action === ITEM_ACTION.CREATE).length,
    units: active.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    total: active.reduce((sum, item) => sum + (lineTotal(item) ?? 0), 0),
  };
}

export function summarizeResult(dto) {
  const items = (dto?.items ?? []).filter((item) => item.result);
  return {
    updated: items.filter((item) => !item.result.created).length,
    created: items.filter((item) => item.result.created).length,
    units: items.reduce((sum, item) => sum + (item.result.newQuantity - item.result.previousQuantity), 0),
    total: items.reduce((sum, item) => sum + (Number(item.total) || lineTotal(item) || 0), 0),
  };
}

export function buildConfirmPayload(draft) {
  return {
    supplier: { name: draft.supplier.name, cnpj: draft.supplier.cnpj },
    invoice: { number: draft.invoice.number, series: draft.invoice.series, issuedAt: draft.invoice.issuedAt },
    items: draft.items.map((item) => ({
      id: item.id,
      description: String(item.description ?? "").trim(),
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: item.unitPrice == null ? null : Number(item.unitPrice),
      action: item.action,
      componentId: item.action === ITEM_ACTION.ADD ? item.componentId : null,
      updatePrice: item.action === ITEM_ACTION.ADD ? Boolean(item.updatePrice) : false,
      newComponent: item.action === ITEM_ACTION.CREATE ? item.newComponent : null,
    })),
  };
}

export function fieldPathToItemIndex(field) {
  const match = /^items\[(\d+)\]/.exec(String(field ?? ""));
  return match ? Number(match[1]) : null;
}

export function priceInputValue(value) {
  return value == null ? "" : formatDecimalBR(value);
}

export function reconcileManualIds(draft, dto) {
  const knownIds = new Set(draft.items.filter((item) => item.id != null).map((item) => item.id));
  const fresh = (dto?.items ?? []).filter((item) => !knownIds.has(item.id)).map((item) => item.id);
  if (!fresh.length) return draft;
  let cursor = 0;
  return {
    ...draft,
    items: draft.items.map((item) => {
      if (item.id != null || cursor >= fresh.length) return item;
      const id = fresh[cursor];
      cursor += 1;
      return { ...item, id };
    }),
  };
}
