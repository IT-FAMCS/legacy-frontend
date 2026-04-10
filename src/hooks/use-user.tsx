// hooks/useLoadUser.ts — запускаем запрос и синхронизируем в store
import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useUserStore, type UserInfo } from "../stores/user";
import { getUser, editUser as editUserApi } from "../api/user";
import { useErrorStore } from "../stores/error";

export function useLoadUser() {
  const setUser = useUserStore((s) => s.setUserInfo);
  const setError = useErrorStore((s) => s.setError);

  const q = useQuery({
    queryKey: ['user'],
    queryFn: ({ signal }) => getUser({ signal }),
    refetchOnWindowFocus: false,
    staleTime: 300000,
  });

  useEffect(() => {
    if (q.isSuccess) {
      setUser(q.data ?? null);
    } else if (q.isError) {
      setUser(null);
      setError(q.error instanceof Error ? q.error.message : "Ошибка загрузки пользователя");
    }
  }, [q.isSuccess, q.isError, q.data, q.error, setUser, setError]);
};

export function useEditUser() {
  const setUser = useUserStore((s) => s.setUserInfo);
  const setError = useErrorStore((s) => s.setError);

  return useMutation({
    mutationFn: (userData: Partial<UserInfo>) => editUserApi({ userData }),
    onSuccess: (data: UserInfo) => {
      setUser(data);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка обновления профиля");
    },
  });
};
