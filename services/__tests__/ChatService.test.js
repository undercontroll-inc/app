import { chatService } from "../ChatService";
import { apiClient } from "../../providers/api";

jest.mock("../../providers/api", () => ({
  ApiError: class ApiError extends Error {},
  apiClient: { get: jest.fn(), patch: jest.fn(), delete: jest.fn(), post: jest.fn() },
  authorizedFetch: jest.fn(),
  parseApiError: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

describe("ChatService history", () => {
  it("lists conversations with cursor pagination", async () => {
    apiClient.get.mockResolvedValue({ data: { items: [{ conversationId: "a" }], nextCursor: "c2" } });

    const page = await chatService.listConversations({ cursor: "c1", limit: 20 });

    expect(apiClient.get).toHaveBeenCalledWith("/chats/conversations", {
      params: { cursor: "c1", limit: 20 },
      signal: undefined,
    });
    expect(page).toEqual({ items: [{ conversationId: "a" }], nextCursor: "c2" });
  });

  it("sends If-None-Match and reports a 304 as not modified", async () => {
    apiClient.get.mockResolvedValue({ status: 304, headers: { etag: '"v1"' }, data: "" });

    const page = await chatService.getMessages("app-1", { etag: '"v1"' });

    const [url, config] = apiClient.get.mock.calls[0];
    expect(url).toBe("/chats/conversations/app-1/messages");
    expect(config.headers).toEqual({ "If-None-Match": '"v1"' });
    expect(config.validateStatus(304)).toBe(true);
    expect(page).toEqual({ notModified: true, etag: '"v1"' });
  });

  it("returns the page and the new ETag", async () => {
    apiClient.get.mockResolvedValue({
      status: 200,
      headers: { etag: '"v2"' },
      data: { items: [{ id: 1 }], nextCursor: null },
    });

    const page = await chatService.getMessages("app-1", { cursor: "older" });

    expect(apiClient.get.mock.calls[0][1].params).toEqual({ cursor: "older", limit: 50 });
    expect(page).toEqual({ notModified: false, etag: '"v2"', items: [{ id: 1 }], nextCursor: null });
  });

  it("renames and deletes conversations", async () => {
    apiClient.patch.mockResolvedValue({ data: { title: "Novo" } });
    await chatService.renameConversation("app-1", "Novo");
    await chatService.deleteConversation("app-1");
    expect(apiClient.patch).toHaveBeenCalledWith("/chats/conversations/app-1", { title: "Novo" });
    expect(apiClient.delete).toHaveBeenCalledWith("/chats/conversations/app-1");
  });
});
