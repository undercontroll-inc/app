import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import OrderForm from "../OrderForm";
import { renderWithProviders } from "../../test/renderWithProviders";
import { orderService } from "../../services/OrderService";
import { userService } from "../../services/UserService";
import { componentService } from "../../services/ComponentService";
import { demandService } from "../../services/DemandService";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
  useFocusEffect: jest.fn(),
}));
jest.mock("../../services/OrderService", () => ({
  orderService: { getById: jest.fn(), update: jest.fn(), create: jest.fn(), list: jest.fn() },
}));
jest.mock("../../services/UserService", () => ({ userService: { getCustomers: jest.fn() } }));
jest.mock("../../services/ComponentService", () => ({ componentService: { list: jest.fn() } }));
jest.mock("../../services/DemandService", () => ({ demandService: { list: jest.fn() } }));

const order = {
  id: 101,
  status: "PENDING",
  user: { id: 2, name: "Maria", lastName: "Silva", phone: "11987654321" },
  appliances: [
    { id: 1, type: "Geladeira", brand: "Consul", model: "CRM56", volt: "220V", series: "GL-1", laborValue: 180 },
  ],
  parts: [{ id: 10, item: "Compressor", price: 420 }],
  discount: 20,
  receivedAt: "2026-09-02",
  deadline: "2026-09-09",
  customerDescription: "Não gela",
  technicalDescription: "Compressor",
};

beforeEach(() => {
  jest.clearAllMocks();
  userService.getCustomers.mockResolvedValue([order.user]);
  componentService.list.mockResolvedValue([]);
  demandService.list.mockResolvedValue([{ componentId: 10, quantity: 2 }]);
  orderService.getById.mockResolvedValue(order);
  orderService.update.mockResolvedValue(undefined);
});

describe("OrderForm", () => {
  it("loads an order and saves it with the update DTO keys", async () => {
    await renderWithProviders(<OrderForm edit orderId="101" />);

    expect(await screen.findByText("Maria Silva")).toBeTruthy();
    expect(screen.getByText("Geladeira Consul CRM56 · 220V")).toBeTruthy();

    await fireEvent.press(screen.getByText("Salvar alterações"));

    await waitFor(() => expect(orderService.update).toHaveBeenCalledTimes(1));
    expect(orderService.update).toHaveBeenCalledWith("101", {
      status: "PENDING",
      appliances: [
        { id: 1, type: "Geladeira", brand: "Consul", model: "CRM56", volt: "220V", series: "GL-1", laborValue: 180 },
      ],
      parts: [{ componentId: 10, quantity: 2 }],
      customerDescription: "Não gela",
      technicalDescription: "Compressor",
    });
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/orders"));
  });

  it("blocks the first step until a client is selected", async () => {
    await renderWithProviders(<OrderForm edit={false} />);

    await fireEvent.press(screen.getByText("Continuar"));

    expect(await screen.findByText("Selecione um cliente da lista.")).toBeTruthy();
    expect(orderService.create).not.toHaveBeenCalled();
  });
});
