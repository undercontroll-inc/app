import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { dashboardService } from "../../services/DashboardService";
import { queryKeys } from "./keys";

export function useDashboardMetrics(period) {
  return useQuery({
    queryKey: queryKeys.dashboard(period),
    queryFn: ({ signal }) => dashboardService.getOverview(period, { signal }),
    placeholderData: keepPreviousData,
  });
}
