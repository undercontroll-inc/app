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

export function parseApiErrorBody(text) {
  if (!text) return "";
  try {
    const data = JSON.parse(text);
    return data.message || data.error || data.detail || data.code || text;
  } catch {
    return text;
  }
}
