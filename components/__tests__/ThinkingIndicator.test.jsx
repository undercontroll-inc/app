import { act, render, screen } from "@testing-library/react-native";
import ThinkingIndicator from "../chat/ThinkingIndicator";

describe("ThinkingIndicator", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("cycles through phrases related to the question and shows elapsed time", async () => {
    const startedAt = new Date().toISOString();
    await render(<ThinkingIndicator prompt="Quais ordens estão atrasadas?" startedAt={startedAt} />);

    expect(screen.getByLabelText("Ana está trabalhando: Pensando")).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(2400);
    });
    expect(screen.getByLabelText("Ana está trabalhando: Consultando suas ordens de serviço")).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(2400);
    });
    expect(screen.getByText("4s")).toBeTruthy();
  });
});
