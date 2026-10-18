import { useQuery } from "@tanstack/react-query";
import { componentService } from "../../services/ComponentService";
import { queryKeys } from "./keys";

export function useComponents() {
  return useQuery({
    queryKey: queryKeys.components.list(),
    queryFn: ({ signal }) => componentService.list({ signal }),
  });
}
