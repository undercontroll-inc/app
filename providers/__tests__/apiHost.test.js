import { extractDevHost, resolveApiBaseURL } from "../apiHost";

describe("extractDevHost", () => {
  it("strips the Metro port from the Expo host URI", () => {
    expect(extractDevHost("192.168.0.12:8081")).toBe("192.168.0.12");
  });

  it("handles scheme-prefixed URIs", () => {
    expect(extractDevHost("exp://10.0.0.5:8081/--/home")).toBe("10.0.0.5");
  });

  it("ignores tunnel hosts because they only proxy Metro", () => {
    expect(extractDevHost("abc-anonymous-8081.exp.direct")).toBeNull();
  });

  it("returns null when there is no host URI", () => {
    expect(extractDevHost(undefined)).toBeNull();
    expect(extractDevHost("")).toBeNull();
  });
});

describe("resolveApiBaseURL", () => {
  it("prefers EXPO_PUBLIC_API_URL when provided", () => {
    expect(
      resolveApiBaseURL({ apiUrl: "https://api.example.com/v1/api", hostUri: "192.168.0.12:8081", platform: "ios" }),
    ).toBe("https://api.example.com/v1/api");
  });

  it("uses the dev machine LAN host from Expo for physical devices", () => {
    expect(resolveApiBaseURL({ hostUri: "192.168.0.12:8081", platform: "android" })).toBe(
      "http://192.168.0.12:8080/v1/api",
    );
  });

  it("applies a custom port to the derived host", () => {
    expect(resolveApiBaseURL({ apiPort: "3001", hostUri: "192.168.0.12:8081", platform: "ios" })).toBe(
      "http://192.168.0.12:3001/v1/api",
    );
  });

  it("falls back to the Android emulator loopback alias", () => {
    expect(resolveApiBaseURL({ platform: "android" })).toBe("http://10.0.2.2:8080/v1/api");
  });

  it("falls back to localhost on iOS and when tunneling", () => {
    expect(resolveApiBaseURL({ platform: "ios" })).toBe("http://localhost:8080/v1/api");
    expect(resolveApiBaseURL({ hostUri: "abc-anonymous-8081.exp.direct", platform: "ios" })).toBe(
      "http://localhost:8080/v1/api",
    );
  });
});
