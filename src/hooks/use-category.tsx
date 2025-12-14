import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCategories, addCategory, editCategory, deleteCategory } from "../api/category";
import type { Category } from "../types/Category";

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

  return useMutation({
    mutationFn: ({ categoryInfo }: { categoryInfo: Category }) => addCategory({ categoryInfo }),
    onSuccess: (data: Category) => {
      queryClient.setQueryData<Category[]>(['categories'], (categories) => [...(categories ?? []), data]);
    },
    onError: (err) => {},
  });
};

export function useEditCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, categoryInfo }: { id: number; categoryInfo: Category }) => editCategory({ id, categoryInfo }),

    onSuccess: (data: Category) => {  
      queryClient.setQueryData<Category[]>(['categories'], (categories) => {
        return categories?.map((category) => category.id === data.id ? data : category) || []
      });
    },
    onError: (err) => {},
  });
};

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteCategory({ id }),
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Category[]>(['categories'], (categories) => 
        categories?.filter((category) => category.id !== deletedId) || []
      );
    },

    onError: (err) => {},
  });
};
