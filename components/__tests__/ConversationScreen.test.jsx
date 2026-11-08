import { Alert, Platform } from "react-native";
import { act, screen, waitFor } from "@testing-library/react-native";
import ConversationScreen from "../../app/(tabs)/chat/[conversationId]";
import { chatService } from "../../services/ChatService";
import { renderWithProviders } from "../../test/renderWithProviders";

let mockOptions = {};

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), dismissTo: jest.fn() },
  Stack: {
    Screen: ({ options }) => {
      mockOptions = options;
      return null;
    },
  },
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => ({ conversationId: "c1" }),
}));
jest.mock("../../services/ChatService", () => ({
  chatService: {
    listConversations: jest.fn(),
    getMessages: jest.fn(),
    renameConversation: jest.fn(),
    streamMessage: jest.fn(),
  },
}));

const originalOS = Platform.OS;

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "ios";
  chatService.listConversations.mockResolvedValue({
    items: [{ conversationId: "c1", title: "Faturamento", preview: "R$", lastMessageAt: new Date().toISOString() }],
    nextCursor: null,
  });
  chatService.getMessages.mockResolvedValue({
    notModified: false,
    etag: '"e"',
    items: [
      { id: 1, role: "user", content: "Quanto faturei?", state: "completed", createdAt: new Date().toISOString() },
    ],
    nextCursor: null,
  });
  chatService.renameConversation.mockResolvedValue({ conversationId: "c1", title: "Faturamento de outubro" });
});

afterAll(() => {
  Platform.OS = originalOS;
});

describe("Conversation header menu", () => {
  it("offers new conversation and rename, and renames through the native prompt", async () => {
    const prompt = jest.spyOn(Alert, "prompt").mockImplementation((_title, _message, buttons) => {
      buttons[1].onPress("Faturamento de outubro");
    });
    await renderWithProviders(<ConversationScreen />);

    await waitFor(() => expect(mockOptions.title).toBe("Faturamento"));
    const [menu] = mockOptions.unstable_headerRightItems();
    expect(menu.type).toBe("menu");
    expect(menu.menu.items.map((item) => item.label)).toEqual(["Nova conversa", "Renomear conversa"]);
    expect(menu.menu.items[1].disabled).toBe(false);

    await act(async () => {
      menu.menu.items[1].onPress();
    });

    expect(prompt).toHaveBeenCalled();
    await waitFor(() => expect(chatService.renameConversation).toHaveBeenCalledWith("c1", "Faturamento de outubro"));
    await waitFor(() => expect(mockOptions.title).toBe("Faturamento de outubro"));
    expect(screen.getByText("Quanto faturei?")).toBeTruthy();
    prompt.mockRestore();
  });
});
