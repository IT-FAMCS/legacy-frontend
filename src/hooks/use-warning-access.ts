import { useQuery } from "@tanstack/react-query";
import { getWarningAccess, getWarningCounts } from "../api/warnings";
import { useUserStore } from "../stores/user";

export function useWarningAccess() {
  const authenticated = useUserStore(state => state.isAuthenticated);
  const query = useQuery({queryKey:["warning-access"],queryFn:({signal})=>getWarningAccess(signal),
    enabled:authenticated, staleTime:0, refetchOnWindowFocus:true});
  return {canView:!query.error && query.data?.can_view === true,
    canManage:!query.error && query.data?.can_manage === true};
}
export function useWarningCounts(enabled: boolean) {
  return useQuery({queryKey:["warnings","counts"],queryFn:({signal})=>getWarningCounts(signal),
    enabled, staleTime:0, refetchOnWindowFocus:true});
}
