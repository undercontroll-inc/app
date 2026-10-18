let messageSeq = 0;

export function createMessage({ role, content = "", status = "complete" }) {
  messageSeq += 1;
  return {
    id: `${Date.now()}-${messageSeq}`,
    role,
    content,
    status,
  };
}

export function getGreetingName(user) {
  const name = String(user?.name || "").trim();
  if (!name) return "Administrador";
  return name.split(/\s+/)[0];
}

export function unwrapMessageContent(payload) {
  if (payload == null) return "";
  if (typeof payload === "string") return payload;

  const nested = payload.data ?? payload.message;
  if (typeof nested === "string") return nested;
  if (nested && typeof nested === "object") {
    const fromNested = nested.content ?? nested.reply ?? nested.answer ?? nested.message ?? nested.text;
    if (typeof fromNested === "string") return fromNested;
  }

  const direct = payload.content ?? payload.reply ?? payload.answer ?? payload.text;
  if (typeof direct === "string") return direct;
  return "";
}

export function unwrapSuggestions(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.suggestions)
      ? payload.suggestions
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.suggestions)
          ? payload.data.suggestions
          : [];

  return list
    .map((item, index) => {
      if (typeof item === "string" && item.trim()) {
        return { id: String(index), text: item.trim() };
      }
      if (item && typeof item === "object") {
        const text = item.text ?? item.content ?? item.title ?? item.suggestion ?? "";
        if (!String(text).trim()) return null;
        return { id: String(item.id ?? index), text: String(text).trim() };
      }
      return null;
    })
    .filter(Boolean);
}

export function normalizeMarkdown(value) {
  if (value == null) return "";
  let text = String(value).replace(/\\n/g, "\n");
  text = text.replace(/([^\n])\n(?!\n)/g, "$1  \n");
  return text;
}

export function parseSseBlock(block) {
  let event = "message";
  const dataLines = [];

  for (const line of String(block).split(/\r?\n/)) {
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (!dataLines.length) return null;

  const raw = dataLines.join("\n");
  let data = raw;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { content: raw };
  }
  return { event, data };
}

export function createSseParser(onEvent) {
  let buffer = "";

  return {
    push(chunk) {
      buffer += chunk.replace(/\r\n/g, "\n");
      let index = buffer.indexOf("\n\n");
      while (index !== -1) {
        const event = parseSseBlock(buffer.slice(0, index));
        buffer = buffer.slice(index + 2);
        if (event) onEvent(event);
        index = buffer.indexOf("\n\n");
      }
    },
    flush() {
      if (!buffer.trim()) {
        buffer = "";
        return;
      }
      const event = parseSseBlock(buffer);
      buffer = "";
      if (event) onEvent(event);
    },
  };
}

const CONVERSATION_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function isValidConversationId(value) {
  return typeof value === "string" && CONVERSATION_ID_PATTERN.test(value);
}

export function createConversationId(now = Date.now(), random = Math.random) {
  const suffix = Math.floor(random() * 36 ** 6)
    .toString(36)
    .padStart(6, "0");
  return `app-${now.toString(36)}-${suffix}`;
}

export const CHAT_ERROR_MESSAGES = {
  CHAT_TIMEOUT: "A Ana demorou demais para responder. Tente novamente.",
  CHAT_UNAVAILABLE: "A Ana está indisponível no momento. Tente novamente em instantes.",
  CHAT_CONVERSATION_BUSY: "A Ana ainda está respondendo a mensagem anterior desta conversa. Aguarde um instante.",
};

export const PARTIAL_REASON_MESSAGES = {
  max_tokens: "A resposta atingiu o limite de tamanho.",
  timeout: "A resposta foi interrompida por demora.",
  interrupted: "A resposta foi interrompida.",
};

export function partialNotice(reason) {
  return PARTIAL_REASON_MESSAGES[reason] || PARTIAL_REASON_MESSAGES.interrupted;
}

export function isTerminalStatus(status) {
  return status === "complete" || status === "partial" || status === "error";
}

export function applyChatEvent(message, event) {
  const data = event?.data ?? {};
  switch (event?.event) {
    case "delta":
      return { ...message, content: `${message.content}${data.content ?? ""}`, status: "streaming" };
    case "done": {
      const content = data.content || message.content;
      if (!content) {
        return { ...message, status: "error", errorMessage: "Não recebi uma resposta.", retryable: true };
      }
      return { ...message, content, status: "complete" };
    }
    case "partial":
      return {
        ...message,
        content: data.content || message.content,
        status: "partial",
        reason: data.reason || "interrupted",
        retryable: data.retryable !== false,
      };
    case "error":
      return {
        ...message,
        status: "error",
        code: data.code || null,
        errorMessage: CHAT_ERROR_MESSAGES[data.code] || data.message || "Não foi possível responder.",
        retryable: data.retryable !== false,
      };
    default:
      return message;
  }
}

export function finalizeStream(message) {
  if (isTerminalStatus(message.status)) return message;
  if (message.content) {
    return { ...message, status: "partial", reason: "interrupted", retryable: true };
  }
  return { ...message, status: "error", errorMessage: "Não recebi uma resposta.", retryable: true };
}

export function replaceMessage(messages, id, updater) {
  const lastIndex = messages.length - 1;
  const index = messages[lastIndex]?.id === id ? lastIndex : messages.findIndex((message) => message.id === id);
  if (index === -1) return messages;
  const next = updater(messages[index]);
  if (next === messages[index]) return messages;
  const copy = messages.slice();
  copy[index] = next;
  return copy;
}
