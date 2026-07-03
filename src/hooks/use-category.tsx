import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCategories, createCategory, updateCategory } from "../api/category";
import { useErrorStore } from "../stores/error";

export function useLoadCategories() {
  const q = useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => getCategories({ signal }),
    refetchOnWindowFocus: false
  });

  return q.data;
};

export function useAddCategory() {
  const queryClient = useQueryClient();
  const setError = useErrorStore((s) => s.setError);

  return useMutation({
    mutationFn: ({ categoryData }: { categoryData: { name: string; description?: string } }) => createCategory({ categoryData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка создания категории");
    },
  });
};

export function useEditCategory() {
  const queryClient = useQueryClient();
  const setError = useErrorStore((s) => s.setError);

  return useMutation({
    mutationFn: ({ id, categoryData }: { id: number; categoryData: { name: string; description?: string } }) => updateCategory({ categoryId: id, categoryData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Ошибка обновления категории");
    },
  });
};
