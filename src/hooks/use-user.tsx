// hooks/useLoadUser.ts — запускаем запрос и синхронизируем в store
import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useUserStore, type UserInfo } from "../stores/user";
import { getUser, editUser as editUserApi } from "../api/user";
import { useErrorStore } from "../stores/error";

export function useLoadUser() {
  const setUser = useUserStore((s) => s.setUserInfo);
  const setError = useErrorStore((s) => s.setError);

  const token = typeof window !== 'undefined' ? localStorage.getItem("jwt_token") : null;

  const q = useQuery({
    queryKey: ['user'],
    queryFn: ({ signal }) => getUser({ signal }),
    refetchOnWindowFocus: false,
    staleTime: 300000,
    enabled: !!token, // Only query if token exists
    retry: false, // Don't retry on failure
  });

  useEffect(() => {
    if (q.isSuccess) {
      setUser(q.data ?? null);
    } else if (q.isError || !token) {
      setUser(null);
      if (q.isError) {
        setError(q.error instanceof Error ? q.error.message : "Ошибка загрузки пользователя");
      }
    }
  }, [q.isSuccess, q.isError, q.data, q.error, token, setUser, setError]);
};

export function useEditUser() {
  const setUser = useUserStore((s) => s.setUserInfo);
  const setError = useErrorStore((s) => s.setError);

  return useMutation({
    mutationFn: (userData: Partial<{
      first_name: string;
      last_name: string;
      middle_name: string;
      birth_date: string;
      course: string;
      group: string;
      department: string;
      telegram: string;
    }>) => editUserApi({ userData }),
    onSuccess: (data: UserInfo) => {
      setUser(data);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка обновления профиля");
    },
  });
};
