// hooks/useLoadUser.ts — запускаем запрос и синхронизируем в store
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "../stores/user";
import { getUser } from "../api/user";


export function useLoadUser() {
  const setUser = useUserStore((s) => s.setUserInfo);

  const q = useQuery({
    queryKey: ["me"],
    queryFn: ({ signal }) => getUser({ signal }),
    refetchOnWindowFocus: false,
    staleTime: 300000,
  });

  useEffect(() => {
    if (q.isSuccess) {
      setUser(q.data ?? null);
    } else if (q.isError) {
      setUser(null);

    }
  }, [q.isSuccess, q.isError, q.data, q.error, setUser]);
}
