import { useEffect, useState } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import ReviewScreen from "../../app/(tabs)/stock/import/[importId]/review";
import ItemSheet from "../../app/(tabs)/stock/import/[importId]/item/[itemKey]";
import ConfirmScreen from "../../app/(tabs)/stock/import/[importId]/confirm";
import { StockImportDraftProvider } from "../../contexts/StockImportDraftContext";
import { stockImportService } from "../../services/StockImportService";
import { renderWithProviders } from "../../test/renderWithProviders";

let mockParams = {};
let mockOpenSheet = () => {};

jest.mock("expo-router", () => ({
  router: { push: jest.fn((path) => mockOpenSheet(path)), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn() },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => mockParams,
}));
jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => {
  const { View } = jest.requireActual("react-native");
  return function MockSwipeable({ children }) {
    return <View>{children}</View>;
  };
});
jest.mock("react-native-keyboard-controller", () => {
  const { ScrollView } = jest.requireActual("react-native");
  return { ...jest.requireActual("react-native-keyboard-controller/jest"), KeyboardAwareScrollView: ScrollView };
});
jest.mock("@react-native-segmented-control/segmented-control", () => {
  const { Pressable, Text, View } = jest.requireActual("react-native");
  return function MockSegmentedControl({ values, onChange }) {
    return (
      <View>
        {values.map((value, index) => (
          <Pressable key={value} onPress={() => onChange({ nativeEvent: { selectedSegmentIndex: index } })}>
            <Text>{value}</Text>
          </Pressable>
        ))}
      </View>
    );
  };
});
jest.mock("../../services/StockImportService", () => ({
  ...jest.requireActual("../../services/StockImportService"),
  stockImportService: { get: jest.fn(), saveDraft: jest.fn(), confirm: jest.fn(), cancel: jest.fn() },
}));
jest.mock("../../services/ComponentService", () => ({
  componentService: { list: jest.fn(async () => []) },
}));

const readyImport = {
  id: 7,
  status: "READY",
  supplier: { name: "FrioSul", cnpj: "12345678000190" },
  invoice: { number: "45", series: "1", issuedAt: "2026-11-01T10:00:00Z", total: 1104.4 },
  itemsTotal: 1104.4,
  warnings: [],
  duplicateOfImportId: null,
  items: [
    {
      id: 1,
      lineNumber: 1,
      description: "GAS R134A 750G",
      quantity: 10,
      unit: "UN",
      unitPrice: 89.5,
      total: 895,
      confidence: 0.95,
      warnings: [],
      match: {
        type: "FUZZY",
        componentId: 12,
        confidence: 0.91,
        candidates: [{ componentId: 12, name: "Gás R134a", currentQuantity: 20, score: 0.91 }],
      },
      action: "ADD_TO_EXISTING",
    },
    {
      id: 2,
      lineNumber: 2,
      description: "FILTRO SEC. 15G",
      quantity: 6,
      unit: "PC",
      unitPrice: 34.9,
      total: 209.4,
      confidence: 0.62,
      warnings: ["LOW_CONFIDENCE"],
      match: {
        type: "FUZZY",
        componentId: null,
        confidence: 0.68,
        candidates: [{ componentId: 13, name: "Filtro secador", currentQuantity: 15, score: 0.68 }],
      },
      action: "ADD_TO_EXISTING",
    },
  ],
};

function Harness() {
  const [route, setRoute] = useState("review");
  useEffect(() => {
    mockOpenSheet = (path) => {
      if (path.includes("/item/")) {
        mockParams = { importId: "7", itemKey: decodeURIComponent(path.split("/item/")[1]) };
        setRoute("item");
      } else if (path.endsWith("/confirm")) {
        mockParams = { importId: "7" };
        setRoute("confirm");
      }
    };
    router.back.mockImplementation(() => setRoute("review"));
  }, []);
  return (
    <StockImportDraftProvider>
      {route === "review" ? <ReviewScreen /> : null}
      {route === "item" ? <ItemSheet /> : null}
      {route === "confirm" ? <ConfirmScreen /> : null}
    </StockImportDraftProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { importId: "7" };
  stockImportService.get.mockResolvedValue(readyImport);
  stockImportService.saveDraft.mockResolvedValue(readyImport);
  stockImportService.confirm.mockResolvedValue({ ...readyImport, status: "CONFIRMED" });
});

describe("stock import review", () => {
  it("blocks continuing until the low-confidence item is resolved, then confirms the reviewed list", async () => {
    await renderWithProviders(<Harness />);

    expect(await screen.findByText("Precisa de atenção · 1")).toBeTruthy();
    expect(screen.getByText("Revise 1 item para continuar")).toBeTruthy();
    expect(screen.getByTestId("review-continue").props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(screen.getByTestId("import-item-2"));
    expect(await screen.findByText("Revisar item")).toBeTruthy();
    await fireEvent.press(screen.getByText("Filtro secador"));
    await fireEvent.press(screen.getByText("Salvar"));

    expect(await screen.findByText("Prontos · 2")).toBeTruthy();
    expect(screen.getByTestId("review-continue").props.accessibilityState.disabled).toBe(false);

    await fireEvent.press(screen.getByTestId("review-continue"));
    expect(await screen.findByText("Tudo pronto")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("confirm-submit"));

    await waitFor(() => expect(stockImportService.confirm).toHaveBeenCalledTimes(1));
    const [importId, payload] = stockImportService.confirm.mock.calls[0];
    expect(importId).toBe("7");
    expect(payload.items).toEqual([
      expect.objectContaining({ id: 1, action: "ADD_TO_EXISTING", componentId: 12, quantity: 10 }),
      expect.objectContaining({ id: 2, action: "ADD_TO_EXISTING", componentId: 13, quantity: 6 }),
    ]);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/stock/import/7/done"));
  });

  it("ignores an item with the long-press shortcut", async () => {
    await renderWithProviders(<Harness />);

    await fireEvent(await screen.findByTestId("import-item-2"), "longPress");

    expect(await screen.findByText("Ignorados · 1")).toBeTruthy();
    expect(screen.getByTestId("review-continue").props.accessibilityState.disabled).toBe(false);
  });
});
