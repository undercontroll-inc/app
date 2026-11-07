import { fireEvent, render, screen } from "@testing-library/react-native";
import ChatComposer from "../chat/ChatComposer";

const idle = { status: "idle", durationMs: 0, remainingSeconds: 60, cancel: jest.fn(), finish: jest.fn() };

describe("ChatComposer", () => {
  it("shows the microphone when empty and the send button with text", async () => {
    const onMicPress = jest.fn();
    const { rerender } = await render(
      <ChatComposer dictation={idle} onChangeText={jest.fn()} onMicPress={onMicPress} onSend={jest.fn()} value="" />,
    );

    await fireEvent.press(screen.getByTestId("composer-mic"));
    expect(onMicPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("composer-send")).toBeNull();

    await rerender(
      <ChatComposer dictation={idle} onChangeText={jest.fn()} onMicPress={onMicPress} onSend={jest.fn()} value="Oi" />,
    );
    expect(screen.getByTestId("composer-send")).toBeTruthy();
    expect(screen.queryByTestId("composer-mic")).toBeNull();
  });

  it("replaces the input with the recording bar while dictating", async () => {
    const dictation = { ...idle, status: "recording", durationMs: 12000, finish: jest.fn(), cancel: jest.fn() };
    await render(
      <ChatComposer
        dictation={dictation}
        onChangeText={jest.fn()}
        onMicPress={jest.fn()}
        onSend={jest.fn()}
        value=""
      />,
    );

    expect(screen.getByText("0:12")).toBeTruthy();
    expect(screen.getByLabelText("Gravando, 12 segundos")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("dictation-finish"));
    expect(dictation.finish).toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId("dictation-cancel"));
    expect(dictation.cancel).toHaveBeenCalled();
  });

  it("locks the bar while transcribing", async () => {
    const dictation = { ...idle, status: "transcribing", finish: jest.fn() };
    await render(
      <ChatComposer
        dictation={dictation}
        onChangeText={jest.fn()}
        onMicPress={jest.fn()}
        onSend={jest.fn()}
        value=""
      />,
    );

    expect(screen.getByText("Transcrevendo…")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("dictation-finish"));
    expect(dictation.finish).not.toHaveBeenCalled();
  });
});
