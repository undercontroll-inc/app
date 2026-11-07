import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import ChatHomeScreen from "../../app/(tabs)/chat/index";
import { chatService } from "../../services/ChatService";
import { renderWithProviders } from "../../test/renderWithProviders";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), dismissTo: jest.fn() },
  Stack: { Screen: () => null },
  useFocusEffect: jest.fn(),
}));
jest.mock("../../components/ui/HeaderAvatar", () => () => null);
jest.mock("../../services/ChatService", () => ({
  chatService: {
    getSuggestions: jest.fn(),
    refreshSuggestions: jest.fn(),
    listConversations: jest.fn(),
    getMessages: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  chatService.getSuggestions.mockResolvedValue({ suggestions: ["Quais ordens estão pendentes?"] });
  chatService.listConversations.mockResolvedValue({
    items: [
      {
        conversationId: "c1",
        title: "Faturamento do mês",
        preview: "R$ 8.420",
        lastMessageAt: new Date().toISOString(),
      },
      {
        conversationId: "c2",
        title: "Peças mais usadas",
        preview: "Capacitor",
        lastMessageAt: new Date().toISOString(),
      },
      {
        conversationId: "c3",
        title: "Clientes recorrentes",
        preview: "Maria",
        lastMessageAt: new Date().toISOString(),
      },
      { conversationId: "c4", title: "Quarta conversa", preview: "...", lastMessageAt: new Date().toISOString() },
    ],
    nextCursor: null,
  });
});

describe("Ana home", () => {
  it("shows suggestions and only the three most recent conversations", async () => {
    await renderWithProviders(<ChatHomeScreen />);

    expect(await screen.findByText("Quais ordens estão pendentes?")).toBeTruthy();
    expect(await screen.findByText("Faturamento do mês")).toBeTruthy();
    expect(screen.getByText("Clientes recorrentes")).toBeTruthy();
    expect(screen.queryByText("Quarta conversa")).toBeNull();

    await fireEvent.press(screen.getByTestId("recent-see-all"));
    expect(router.push).toHaveBeenCalledWith("/chat/history");
  });

  it("starts a new conversation from a suggestion", async () => {
    await renderWithProviders(<ChatHomeScreen />);

    await fireEvent.press(await screen.findByText("Quais ordens estão pendentes?"));

    await waitFor(() => expect(router.push).toHaveBeenCalled());
    const [{ pathname, params }] = router.push.mock.calls[0];
    expect(pathname).toBe("/chat/[conversationId]");
    expect(params).toMatchObject({ prompt: "Quais ordens estão pendentes?", isNew: "1" });
    expect(params.conversationId).toMatch(/^app-/);
  });

  it("opens a recent conversation", async () => {
    await renderWithProviders(<ChatHomeScreen />);

    await fireEvent.press(await screen.findByText("Peças mais usadas"));

    expect(router.push).toHaveBeenCalledWith({ pathname: "/chat/[conversationId]", params: { conversationId: "c2" } });
  });
});
