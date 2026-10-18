import axios, { AxiosError } from "axios";
import { fetch as expoFetch } from "expo/fetch";
import { getToken, saveTokens } from "../../utils/auth";

jest.mock("expo/fetch", () => ({ fetch: jest.fn() }));

const calls = [];
let refreshResponses = [];

function respond(config, status, data) {
  const response = { data, status, statusText: String(status), headers: {}, config };
  if (status >= 200 && status < 300) return Promise.resolve(response);
  return Promise.reject(new AxiosError(`Request failed with ${status}`, "ERR_BAD_REQUEST", config, null, response));
}

axios.defaults.adapter = (config) => {
  calls.push({ url: config.url, authorization: config.headers?.Authorization });
  if (config.url === "/auth/refresh") {
    const next = refreshResponses.shift() ?? { status: 401, data: { message: "invalid" } };
    return new Promise((resolve) => setTimeout(resolve, 10)).then(() => respond(config, next.status, next.data));
  }
  if (config.headers?.Authorization === "Bearer fresh-access") return respond(config, 200, { ok: true });
  return respond(config, 401, { message: "expired" });
};

const { apiClient, authorizedFetch, setOnUnauthorized } = require("../api");

function fetchResponse(status) {
  return { ok: status >= 200 && status < 300, status, headers: { get: () => "application/json" } };
}

beforeEach(async () => {
  calls.length = 0;
  refreshResponses = [];
  expoFetch.mockReset();
  await saveTokens("stale-access", "refresh-1");
});

describe("api refresh", () => {
  it("refreshes once for concurrent 401 responses and retries with the new token", async () => {
    refreshResponses = [{ status: 200, data: { accessToken: "fresh-access", refreshToken: "refresh-2" } }];

    const results = await Promise.all([
      apiClient.get("/orders"),
      apiClient.get("/users"),
      apiClient.get("/components"),
    ]);

    expect(results.map((result) => result.data)).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(calls.filter((call) => call.url === "/auth/refresh")).toHaveLength(1);
    expect(getToken()).toBe("fresh-access");
  });

  it("expires the session when the refresh fails", async () => {
    const onUnauthorized = jest.fn();
    setOnUnauthorized(onUnauthorized);

    await expect(apiClient.get("/orders")).rejects.toMatchObject({ response: { status: 401 } });

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(getToken()).toBeNull();
    setOnUnauthorized(null);
  });
});

describe("authorizedFetch", () => {
  it("sends the bearer token and retries once after refreshing on 401", async () => {
    refreshResponses = [{ status: 200, data: { accessToken: "fresh-access", refreshToken: "refresh-2" } }];
    expoFetch.mockResolvedValueOnce(fetchResponse(401)).mockResolvedValueOnce(fetchResponse(200));

    const response = await authorizedFetch("/chats/messages/stream", { method: "POST", headers: { Accept: "x" } });

    expect(response.status).toBe(200);
    expect(expoFetch).toHaveBeenCalledTimes(2);
    expect(expoFetch.mock.calls[0][1].headers).toEqual({ Accept: "x", Authorization: "Bearer stale-access" });
    expect(expoFetch.mock.calls[1][1].headers).toEqual({ Accept: "x", Authorization: "Bearer fresh-access" });
  });

  it("shares the in-flight refresh with axios requests", async () => {
    refreshResponses = [{ status: 200, data: { accessToken: "fresh-access", refreshToken: "refresh-2" } }];
    expoFetch.mockResolvedValueOnce(fetchResponse(401)).mockResolvedValueOnce(fetchResponse(200));

    await Promise.all([apiClient.get("/orders"), authorizedFetch("/transcriptions", { method: "POST" })]);

    expect(calls.filter((call) => call.url === "/auth/refresh")).toHaveLength(1);
  });

  it("throws a normalized 401 and expires the session when the refresh fails", async () => {
    const onUnauthorized = jest.fn();
    setOnUnauthorized(onUnauthorized);
    expoFetch.mockResolvedValueOnce(fetchResponse(401));

    await expect(authorizedFetch("/transcriptions", { method: "POST" })).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      code: "UNAUTHORIZED",
    });
    expect(expoFetch).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    setOnUnauthorized(null);
  });
});
