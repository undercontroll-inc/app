import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const clients = new Set();

afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.clear();
});

export function createTestQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  clients.add(client);
  return client;
}

export async function renderWithProviders(ui, { queryClient = createTestQueryClient() } = {}) {
  const utils = await render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  return { ...utils, queryClient };
}
