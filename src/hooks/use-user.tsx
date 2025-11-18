// hooks/useLoadUser.ts — запускаем запрос и синхронизируем в store
import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useUserStore, type UserInfo } from "../stores/user";
import { editUser, getUser } from "../api/user";

export function useLoadUser() {
  const setUser = useUserStore((s) => s.setUserInfo);

  const q = useQuery({
    queryKey: [],
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

export function useEditUser({ newInfoUser }: { newInfoUser: UserInfo }) {
  const setUser = useUserStore((s) => s.setUserInfo);

  return useMutation({
    onSuccess: (data: UserInfo) => {
      setUser(data);
    },
    // откат при ошибке
    onError: (err) => {},
  });
}
