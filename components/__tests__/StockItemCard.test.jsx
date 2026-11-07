import { Platform } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import StockItemCard, { stockStatus } from "../StockItemCard";

jest.mock("../ui/SwipeRow", () => {
  const { Platform, Pressable, Text, View } = jest.requireActual("react-native");
  return function MockSwipeRow({ actions = [], children }) {
    return (
      <View>
        {children}
        {Platform.OS === "ios"
          ? actions.map((action) => (
              <Pressable accessibilityLabel={action.label} key={action.label} onPress={action.onPress}>
                <Text>{action.label}</Text>
              </Pressable>
            ))
          : null}
      </View>
    );
  };
});

const item = { id: 10, item: "Compressor 1/4 HP", brand: "Embraco", category: "Refrigeração", price: 420, quantity: 6 };

describe("stockStatus", () => {
  it("communicates stock level in words", () => {
    expect(stockStatus(0).label).toBe("Sem estoque");
    expect(stockStatus(1).label).toBe("Estoque baixo · 1 unidade");
    expect(stockStatus(2).label).toBe("Estoque baixo · 2 unidades");
    expect(stockStatus(6).label).toBe("6 em estoque");
  });
});

describe("StockItemCard", () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    Platform.OS = originalOS;
  });

  it("exposes edit and delete swipe actions on iOS", async () => {
    Platform.OS = "ios";
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    await render(
      <StockItemCard item={item} onDelete={onDelete} onEdit={onEdit} onLongPress={jest.fn()} onPress={jest.fn()} />,
    );

    expect(screen.getByText("6 em estoque")).toBeTruthy();
    expect(screen.getByText("R$ 420,00")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Excluir"));
    expect(onDelete).toHaveBeenCalledWith(item);
    await fireEvent.press(screen.getByLabelText("Editar"));
    expect(onEdit).toHaveBeenCalledWith(item);
  });

  it("has no swipe actions on Android", async () => {
    Platform.OS = "android";
    await render(
      <StockItemCard item={item} onDelete={jest.fn()} onEdit={jest.fn()} onLongPress={jest.fn()} onPress={jest.fn()} />,
    );

    expect(screen.queryByLabelText("Excluir")).toBeNull();
  });
});
