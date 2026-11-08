import { fireEvent, render, screen } from "@testing-library/react-native";
import Field from "../Field";
import { FormSection, FormSegmentedRow, FormSwitchRow, FormTextRow, Stepper } from "../FormRows";

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

describe("Field", () => {
  it("shows the label and the error instead of the hint", async () => {
    await render(<Field error="Informe o nome." hint="Como aparece na nota" label="Nome" value="" />);

    expect(screen.getByText("Nome")).toBeTruthy();
    expect(screen.getByText("Informe o nome.")).toBeTruthy();
    expect(screen.queryByText("Como aparece na nota")).toBeNull();
  });
});

describe("FormRows", () => {
  it("renders inline label and input rows inside a titled section", async () => {
    const onChangeText = jest.fn();
    await render(
      <FormSection footer="Opcional" title="Contato">
        <FormTextRow label="Telefone" onChangeText={onChangeText} placeholder="(00) 00000-0000" value="" />
      </FormSection>,
    );

    expect(screen.getByText("CONTATO")).toBeTruthy();
    expect(screen.getByText("Opcional")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Telefone"), "11999990000");
    expect(onChangeText).toHaveBeenCalledWith("11999990000");
  });

  it("selects an option in a segmented row", async () => {
    const onChange = jest.fn();
    await render(<FormSegmentedRow label="Voltagem" onChange={onChange} options={["127V", "220V"]} value="127V" />);

    await fireEvent.press(screen.getByText("220V"));
    expect(onChange).toHaveBeenCalledWith("220V");
  });

  it("turns the stepper minus into a remove action at the minimum", async () => {
    const onDecrement = jest.fn();
    const onIncrement = jest.fn();
    await render(
      <Stepper label="Compressor" onDecrement={onDecrement} onIncrement={onIncrement} removeOnMin value={1} />,
    );

    await fireEvent.press(screen.getByLabelText("Remover Compressor"));
    await fireEvent.press(screen.getByLabelText("Aumentar Compressor"));
    expect(onDecrement).toHaveBeenCalledTimes(1);
    expect(onIncrement).toHaveBeenCalledTimes(1);
  });

  it("toggles a switch row", async () => {
    const onValueChange = jest.fn();
    await render(<FormSwitchRow label="OS concluída" onValueChange={onValueChange} testID="switch" value={false} />);

    await fireEvent(screen.getByTestId("switch"), "valueChange", true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
