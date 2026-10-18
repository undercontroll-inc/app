import {
  applyChatEvent,
  createConversationId,
  createSseParser,
  finalizeStream,
  isValidConversationId,
  replaceMessage,
} from "../chat";

function collect(chunks) {
  const events = [];
  const parser = createSseParser((event) => events.push(event));
  chunks.forEach((chunk) => parser.push(chunk));
  parser.flush();
  return events;
}

describe("createSseParser", () => {
  it("parses events split across chunks and ignores heartbeats", () => {
    const events = collect([
      'event: start\ndata: {"conversationId":"abc"}\n\n: keepalive\n\nevent: del',
      'ta\ndata: {"content":"Olá"}\n\n',
      'event: partial\r\ndata: {"state":"partial","content":"Olá","reason":"max_tokens","retryable":true}\r\n\r\n',
    ]);

    expect(events).toEqual([
      { event: "start", data: { conversationId: "abc" } },
      { event: "delta", data: { content: "Olá" } },
      { event: "partial", data: { state: "partial", content: "Olá", reason: "max_tokens", retryable: true } },
    ]);
  });

  it("flushes a trailing error event without a blank line", () => {
    const events = collect(['event: error\ndata: {"state":"failed","code":"CHAT_TIMEOUT","retryable":true}']);
    expect(events).toEqual([{ event: "error", data: { state: "failed", code: "CHAT_TIMEOUT", retryable: true } }]);
  });
});

describe("applyChatEvent", () => {
  const base = { id: "1", role: "assistant", content: "", status: "pending" };

  it("accumulates deltas and completes with the final content", () => {
    const streaming = applyChatEvent(base, { event: "delta", data: { content: "Oi" } });
    expect(streaming).toMatchObject({ content: "Oi", status: "streaming" });
    expect(applyChatEvent(streaming, { event: "done", data: { content: "Oi, tudo bem?" } })).toMatchObject({
      content: "Oi, tudo bem?",
      status: "complete",
    });
  });

  it("keeps streamed content on partial and maps error codes", () => {
    const streaming = { ...base, content: "Parte", status: "streaming" };
    expect(applyChatEvent(streaming, { event: "partial", data: { reason: "timeout", retryable: true } })).toMatchObject(
      {
        content: "Parte",
        status: "partial",
        reason: "timeout",
        retryable: true,
      },
    );
    expect(
      applyChatEvent(streaming, { event: "error", data: { code: "CHAT_UNAVAILABLE", message: "x", retryable: false } }),
    ).toMatchObject({
      content: "Parte",
      status: "error",
      code: "CHAT_UNAVAILABLE",
      errorMessage: "A Ana está indisponível no momento. Tente novamente em instantes.",
      retryable: false,
    });
  });

  it("ignores start, status and unknown events", () => {
    expect(applyChatEvent(base, { event: "status", data: { phase: "generating" } })).toBe(base);
    expect(applyChatEvent(base, { event: "start", data: { conversationId: "x" } })).toBe(base);
  });
});

describe("finalizeStream", () => {
  it("turns an unterminated stream into a retryable partial or error", () => {
    expect(finalizeStream({ content: "meio", status: "streaming" })).toMatchObject({
      status: "partial",
      reason: "interrupted",
    });
    expect(finalizeStream({ content: "", status: "pending" })).toMatchObject({ status: "error", retryable: true });
    const done = { content: "ok", status: "complete" };
    expect(finalizeStream(done)).toBe(done);
  });
});

describe("conversation ids", () => {
  it("creates ids accepted by the API pattern", () => {
    const id = createConversationId(1760000000000, () => 0.5);
    expect(isValidConversationId(id)).toBe(true);
    expect(isValidConversationId("has space")).toBe(false);
    expect(isValidConversationId("a".repeat(65))).toBe(false);
  });
});

describe("replaceMessage", () => {
  it("replaces only the target message and keeps the array when unchanged", () => {
    const messages = [{ id: "a" }, { id: "b", content: "" }];
    const next = replaceMessage(messages, "b", (message) => ({ ...message, content: "x" }));
    expect(next).not.toBe(messages);
    expect(next[0]).toBe(messages[0]);
    expect(next[1].content).toBe("x");
    expect(replaceMessage(messages, "missing", () => ({}))).toBe(messages);
  });
});
