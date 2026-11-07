import { ActionSheetIOS, Platform } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import NativeSelect from "../../NativeSelect";
import Field from "../Field";

describe("Field", () => {
  it("shows the label and the error instead of the hint", async () => {
    await render(<Field error="Informe o nome." hint="Como aparece na nota" label="Nome" value="" />);

    expect(screen.getByText("Nome")).toBeTruthy();
    expect(screen.getByText("Informe o nome.")).toBeTruthy();
    expect(screen.queryByText("Como aparece na nota")).toBeNull();
  });
});

describe("NativeSelect", () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
    jest.restoreAllMocks();
  });

  it("opens the native iOS action sheet and selects the tapped option", async () => {
    Platform.OS = "ios";
    const sheet = jest
      .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
      .mockImplementation((_options, callback) => callback(1));
    const onSelect = jest.fn();

    await render(<NativeSelect label="Voltagem" onSelect={onSelect} options={["127V", "220V"]} value="127V" />);
    await fireEvent.press(screen.getByLabelText("Voltagem: 127V"));

    expect(sheet).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Voltagem", options: ["127V ✓", "220V", "Cancelar"], cancelButtonIndex: 2 }),
      expect.any(Function),
    );
    expect(onSelect).toHaveBeenCalledWith("220V");
  });
});
