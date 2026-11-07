import {
  conversationTitle,
  decorateMessages,
  formatConversationTime,
  groupConversations,
  historyToMessages,
  mergeMessages,
} from "../chat";

const NOW = new Date(2026, 10, 7, 15, 0, 0);

describe("conversationTitle", () => {
  it("uses the first non-empty line and collapses spaces", () => {
    expect(conversationTitle("\n   Quais   ordens\nsegunda linha")).toBe("Quais ordens");
  });

  it("cuts long titles at a word boundary with an ellipsis", () => {
    const text = "Quero saber quais clientes mais trouxeram aparelhos para conserto no último trimestre";
    const title = conversationTitle(text);
    expect(title.endsWith("…")).toBe(true);
    expect(title.length).toBeLessThanOrEqual(61);
    expect(title).toBe("Quero saber quais clientes mais trouxeram aparelhos para…");
  });

  it("falls back to a default title", () => {
    expect(conversationTitle("   ")).toBe("Nova conversa");
  });
});

describe("history mapping", () => {
  it("maps server messages and keeps partial reasons", () => {
    const [user, assistant] = historyToMessages([
      { id: 1, role: "user", content: "Oi", state: "completed", createdAt: "x" },
      { id: 2, role: "assistant", content: "Olá", state: "partial", reason: "max_tokens", createdAt: "y" },
    ]);
    expect(user).toMatchObject({ id: "srv-1", serverId: 1, status: "complete" });
    expect(assistant).toMatchObject({ status: "partial", reason: "max_tokens", retryable: false });
  });

  it("drops live messages already persisted and keeps their keys stable", () => {
    const history = historyToMessages([{ id: 7, role: "user", content: "Oi", state: "completed" }]);
    const live = [
      { id: "local-1", serverId: 7, role: "user", content: "Oi" },
      { id: "local-2", role: "assistant", content: "", status: "pending" },
    ];
    const merged = mergeMessages(history, live);
    expect(merged.map((message) => message.id)).toEqual(["local-1", "local-2"]);
  });
});

describe("dates", () => {
  it("formats conversation times like the Messages app", () => {
    expect(formatConversationTime(new Date(2026, 10, 7, 9, 5), NOW)).toBe("09:05");
    expect(formatConversationTime(new Date(2026, 10, 6, 20, 0), NOW)).toBe("Ontem");
    expect(formatConversationTime(new Date(2026, 10, 3, 20, 0), NOW)).toBe("terça");
    expect(formatConversationTime(new Date(2026, 9, 1, 20, 0), NOW)).toBe("01/10");
  });

  it("groups conversations into dated sections", () => {
    const rows = groupConversations(
      [
        { conversationId: "a", lastMessageAt: new Date(2026, 10, 7, 10).toISOString() },
        { conversationId: "b", lastMessageAt: new Date(2026, 10, 6, 10).toISOString() },
        { conversationId: "c", lastMessageAt: new Date(2026, 10, 2, 10).toISOString() },
        { conversationId: "d", lastMessageAt: new Date(2026, 8, 2, 10).toISOString() },
      ],
      NOW,
    );
    expect(rows.filter((row) => row.type === "header").map((row) => row.title)).toEqual([
      "Hoje",
      "Ontem",
      "Últimos 7 dias",
      "Mais antigas",
    ]);
  });

  it("adds day separators and groups consecutive bubbles", () => {
    const decorated = decorateMessages(
      [
        { id: "1", role: "user", createdAt: new Date(2026, 10, 6, 10, 0).toISOString() },
        { id: "2", role: "assistant", createdAt: new Date(2026, 10, 6, 10, 0, 5).toISOString() },
        { id: "3", role: "assistant", createdAt: new Date(2026, 10, 6, 10, 0, 30).toISOString() },
        { id: "4", role: "user", createdAt: new Date(2026, 10, 7, 14, 2).toISOString() },
      ],
      NOW,
    );
    expect(decorated.map((message) => message.dateLabel)).toEqual(["Ontem 10:00", null, null, "Hoje 14:02"]);
    expect(decorated.map((message) => message.groupedWithNext)).toEqual([false, true, false, false]);
  });
});
