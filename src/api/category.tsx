import type { Category } from "../types/Category";

const CATEGORY_INFO_PATH = "/api/category/info";
const CATEGORY_EDIT_PATH = "/api/category/edit";

export async function getCategories({ signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch(CATEGORY_INFO_PATH, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as Category[];
}

export async function addCategory({
  signal,
  categoryInfo,
}: {
  signal?: AbortSignal;
  categoryInfo: Category;
}) {
  const res = await fetch(CATEGORY_EDIT_PATH, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify(categoryInfo),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as Category;
}

export async function editCategory({
  id,
  signal,
  categoryInfo,
}: {
  id: number;
  signal?: AbortSignal;
  categoryInfo: Category;
}) {
  const res = await fetch(`${CATEGORY_EDIT_PATH}/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify(categoryInfo),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as Category;
}

export async function deleteCategory({
  id,
  signal,
}: {
  id: number;
  signal?: AbortSignal;
}) {
  const res = await fetch(`${CATEGORY_EDIT_PATH}/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return id;
}
