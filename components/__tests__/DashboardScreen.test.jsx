import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import DashboardScreen from "../../app/(tabs)/dashboard";
import { renderWithProviders } from "../../test/renderWithProviders";
import { dashboardService } from "../../services/DashboardService";
import { insightService } from "../../services/InsightService";
import { ApiError } from "../../providers/apiError";

const mockAuth = { user: { name: "Admin", userType: "ADMINISTRATOR" } };

jest.mock("../../contexts/AuthContext", () => ({ useAuth: () => mockAuth }));
jest.mock("../../components/AppHeader", () => () => null);
jest.mock("../../services/InsightService", () => ({
  insightService: { getInsights: jest.fn(), requestJob: jest.fn() },
}));
jest.mock("../../services/DashboardService", () => ({
  PeriodFilter: { SEVEN_DAYS: "SEVEN_DAYS", THIRTY_DAYS: "THIRTY_DAYS", NINETY_DAYS: "NINETY_DAYS" },
  dashboardService: { getOverview: jest.fn() },
}));

const emptyPayload = {
  requestedBucketKey: "2026-10",
  requestedMonth: "outubro de 2026",
  availableBucketKey: null,
  availableMonth: null,
  generatedAt: null,
  failureReason: null,
  insights: [],
  risingProducts: [],
  limitations: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.user = { name: "Admin", userType: "ADMINISTRATOR" };
  dashboardService.getOverview.mockResolvedValue({
    revenue: 1500,
    ongoingOrders: 4,
    averageOrderPrice: 375,
    averageRepairTime: 30,
    topAppliances: [{ type: "Geladeira", brand: "Consul", count: 3 }],
  });
});

describe("DashboardScreen", () => {
  it("renders READY insights with rising products and a null median price", async () => {
    insightService.getInsights.mockResolvedValue({
      ...emptyPayload,
      state: "READY",
      availableMonth: "outubro de 2026",
      generatedAt: "2026-10-05T10:00:00Z",
      insights: [{ id: "i1", type: "ALERTA_PRECO", text: "Micro-ondas subiram 18%", categoryName: "Micro-ondas" }],
      risingProducts: [
        { name: "Air Fryer X", brand: "Mondial", rank: 1, medianPrice: 399.9, validPriceCount: 12 },
        { name: "Cafeteira Y", brand: "Arno", rank: 2, medianPrice: null, validPriceCount: 0 },
      ],
      limitations: ["Amostra pequena em eletroportáteis"],
    });

    await renderWithProviders(<DashboardScreen />);

    expect(await screen.findByText("Micro-ondas subiram 18%")).toBeTruthy();
    expect(screen.getByText("ALERTA DE PREÇO")).toBeTruthy();
    expect(screen.getByText("R$ 399,90 · 12 preços")).toBeTruthy();
    expect(screen.getByText("Preço indisponível")).toBeTruthy();
    expect(screen.getByText("• Amostra pequena em eletroportáteis")).toBeTruthy();
    expect(screen.getByText("R$ 1500,00")).toBeTruthy();
    expect(screen.queryByText("Gerar insights")).toBeNull();
  });

  it("shows the awaiting data state without content", async () => {
    insightService.getInsights.mockResolvedValue({ ...emptyPayload, state: "AWAITING_DATA" });

    await renderWithProviders(<DashboardScreen />);

    expect(await screen.findByText(/Aguardando os dados de mercado de outubro de 2026/)).toBeTruthy();
    expect(screen.queryByText("Gerar insights")).toBeNull();
  });

  it("lets an admin request a job when stale and explains a 409", async () => {
    insightService.getInsights.mockResolvedValue({
      ...emptyPayload,
      state: "STALE",
      availableMonth: "setembro de 2026",
      insights: [{ id: "i1", type: "RECOMENDACAO", text: "Antecipe peças" }],
    });
    insightService.requestJob.mockRejectedValue(new ApiError({ status: 409, code: "AWAITING_DATA", message: "x" }));

    await renderWithProviders(<DashboardScreen />);

    expect(await screen.findByText(/Exibindo insights de setembro de 2026/)).toBeTruthy();
    await fireEvent.press(screen.getByText("Gerar insights"));

    await waitFor(() => expect(insightService.requestJob).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Ainda não há dados de mercado publicados para gerar insights.")).toBeTruthy();
  });

  it("hides the generate action from non admins and shows the failure reason", async () => {
    mockAuth.user = { name: "Técnico", userType: "EMPLOYEE" };
    insightService.getInsights.mockResolvedValue({ ...emptyPayload, state: "FAILED", failureReason: "TIMEOUT" });

    await renderWithProviders(<DashboardScreen />);

    expect(await screen.findByText("A geração demorou demais.")).toBeTruthy();
    expect(screen.queryByText("Gerar insights")).toBeNull();
  });
});
