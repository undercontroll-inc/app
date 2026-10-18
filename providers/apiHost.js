const API_PATH = "/v1/api";
const DEFAULT_PORT = "8080";
const TUNNEL_HOST_PATTERN = /(\.exp\.direct|\.ngrok\.io|\.ngrok-free\.app)$/i;

export function extractDevHost(hostUri) {
  if (!hostUri || typeof hostUri !== "string") return null;
  const authority = hostUri.replace(/^[a-z]+:\/\//i, "").split("/")[0];
  const host = authority.startsWith("[") ? authority.slice(0, authority.indexOf("]") + 1) : authority.split(":")[0];
  if (!host || TUNNEL_HOST_PATTERN.test(host)) return null;
  return host;
}

export function resolveApiBaseURL({ apiUrl, apiPort, hostUri, platform }) {
  if (apiUrl) return apiUrl;
  const port = apiPort || DEFAULT_PORT;
  const devHost = extractDevHost(hostUri);
  const host = devHost ?? (platform === "android" ? "10.0.2.2" : "localhost");
  return `http://${host}:${port}${API_PATH}`;
}
