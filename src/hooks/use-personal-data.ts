import { useQuery } from "@tanstack/react-query";
import { getDataStatus } from "../api/personal-data";
import { useUserStore } from "../stores/user";
export function usePersonalDataStatus(){
  const uid=useUserStore(state=>state.user?.id);
  return useQuery({queryKey:["personal-data",uid],queryFn:getDataStatus,staleTime:0,refetchOnMount:"always",refetchOnWindowFocus:"always",refetchInterval:15000});
}
