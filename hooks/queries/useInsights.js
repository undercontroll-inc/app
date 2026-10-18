import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insightService } from "../../services/InsightService";
import { INSIGHTS_POLL_INTERVAL_MS } from "../../utils/insights";
import { normalizeError } from "../../providers/apiError";
import { queryKeys } from "./keys";

export function insightsRefetchInterval(query) {
  return query.state.data?.state === "GENERATING" ? INSIGHTS_POLL_INTERVAL_MS : false;
}

export function useInsights() {
  return useQuery({
    queryKey: queryKeys.insights,
    queryFn: ({ signal }) => insightService.getInsights({ signal }),
    refetchInterval: insightsRefetchInterval,
  });
}

export function useRequestInsightsJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        return await insightService.requestJob();
      } catch (error) {
        throw normalizeError(error);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.insights }),
  });
}
