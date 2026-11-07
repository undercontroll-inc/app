import { fireEvent, render, screen } from "@testing-library/react-native";
import GlassFab from "../GlassFab";

describe("GlassFab", () => {
  it("runs the action directly when there is no menu", async () => {
    const onPress = jest.fn();
    await render(<GlassFab label="Nova O.S." onPress={onPress} testID="fab" />);

    await fireEvent.press(screen.getByTestId("fab"));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Fechar")).toBeNull();
  });

  it("expands the options, runs the chosen one and collapses", async () => {
    const importInvoice = jest.fn();
    const manual = jest.fn();
    await render(
      <GlassFab
        actions={[
          { label: "Importar nota fiscal", icon: "sparkles", onPress: importInvoice, testID: "opt-import" },
          { label: "Cadastrar manualmente", icon: "compose", onPress: manual, testID: "opt-manual" },
        ]}
        label="Adicionar"
        testID="fab"
      />,
    );

    expect(screen.queryByTestId("opt-import")).toBeNull();
    await fireEvent.press(screen.getByTestId("fab"));
    expect(screen.getByTestId("fab").props.accessibilityState).toEqual({ expanded: true });
    expect(screen.getByText("Fechar")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("opt-import"));

    expect(importInvoice).toHaveBeenCalledTimes(1);
    expect(manual).not.toHaveBeenCalled();
    expect(screen.queryByTestId("opt-import")).toBeNull();
    expect(screen.getByText("Adicionar")).toBeTruthy();
  });

  it("closes when the backdrop is tapped", async () => {
    await render(
      <GlassFab
        actions={[{ label: "Opção", icon: "plus", onPress: jest.fn(), testID: "opt" }]}
        label="Adicionar"
        testID="fab"
      />,
    );

    await fireEvent.press(screen.getByTestId("fab"));
    await fireEvent.press(screen.getAllByLabelText("Fechar opções")[0]);

    expect(screen.queryByTestId("opt")).toBeNull();
  });
});
