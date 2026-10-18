import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import StockItemForm from "../StockItemForm";
import { renderWithProviders } from "../../test/renderWithProviders";
import { componentService } from "../../services/ComponentService";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), back: jest.fn() },
  useFocusEffect: jest.fn(),
}));
jest.mock("../../services/ComponentService", () => ({
  componentService: { getById: jest.fn(), create: jest.fn(), update: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  componentService.create.mockResolvedValue({ id: 1 });
  componentService.update.mockResolvedValue({ id: 10 });
});

describe("StockItemForm", () => {
  it("registers a component with the RegisterComponentRequest fields", async () => {
    await renderWithProviders(<StockItemForm />);

    await fireEvent.changeText(screen.getByPlaceholderText("Nome do item"), "Capacitor 25uF");
    await fireEvent.changeText(screen.getByPlaceholderText("Marca"), "Nichicon");
    await fireEvent.changeText(screen.getByPlaceholderText("Categoria"), "Capacitores");
    await fireEvent.changeText(screen.getByPlaceholderText("0"), "80");
    await fireEvent.changeText(screen.getByPlaceholderText("0,00"), "1.250,50");
    await fireEvent.press(screen.getByText("Cadastrar Item"));

    await waitFor(() => expect(componentService.create).toHaveBeenCalledTimes(1));
    expect(componentService.create).toHaveBeenCalledWith({
      item: "Capacitor 25uF",
      description: "",
      brand: "Nichicon",
      category: "Capacitores",
      price: 1250.5,
      supplier: "",
      quantity: 80,
    });
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/stock"));
  });

  it("loads a component and updates it without quantity", async () => {
    componentService.getById.mockResolvedValue({
      id: 10,
      item: "Compressor 1/4 HP",
      description: "Refrigerador",
      brand: "Embraco",
      price: 420,
      quantity: 6,
      supplier: "FrioSul",
      category: "Refrigeração",
    });

    await renderWithProviders(<StockItemForm componentId="10" edit />);

    expect(await screen.findByDisplayValue("Compressor 1/4 HP")).toBeTruthy();
    expect(screen.getByDisplayValue("420,00")).toBeTruthy();
    await fireEvent.press(screen.getByText("Salvar Alterações"));

    await waitFor(() => expect(componentService.update).toHaveBeenCalledTimes(1));
    expect(componentService.update).toHaveBeenCalledWith("10", {
      item: "Compressor 1/4 HP",
      description: "Refrigerador",
      brand: "Embraco",
      category: "Refrigeração",
      price: 420,
      supplier: "FrioSul",
    });
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/stock"));
  });

  it("validates the price before saving", async () => {
    await renderWithProviders(<StockItemForm />);

    await fireEvent.changeText(screen.getByPlaceholderText("Nome do item"), "Motor");
    await fireEvent.press(screen.getByText("Cadastrar Item"));

    expect(await screen.findByText("Informe um preço válido.")).toBeTruthy();
    expect(componentService.create).not.toHaveBeenCalled();
  });
});
