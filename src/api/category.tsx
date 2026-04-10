import type { Category, Card } from "../types/Category";

const CATEGORIES_PATH = "/api/categories";
const CARDS_PATH = "/api/cards";

export async function getCategories({ signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch(CATEGORIES_PATH, {
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

export async function createCategory({
  signal,
  categoryData,
}: {
  signal?: AbortSignal;
  categoryData: { title: string; description: string };
}) {
  const res = await fetch(CATEGORIES_PATH, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify(categoryData),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as Category;
}

export async function updateCategory({
  signal,
  categoryId,
  categoryData,
}: {
  signal?: AbortSignal;
  categoryId: number;
  categoryData: { title: string; description: string };
}) {
  const res = await fetch(`${CATEGORIES_PATH}/${categoryId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify(categoryData),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as Category;
}

export async function deleteCategory({
  signal,
  categoryId,
}: {
  signal?: AbortSignal;
  categoryId: number;
}) {
  const res = await fetch(`${CATEGORIES_PATH}/${categoryId}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return true;
}

export async function getCard({
  signal,
  categoryId,
  cardId,
}: {
  signal?: AbortSignal;
  categoryId: number;
  cardId: number;
}) {
  const res = await fetch(`${CARDS_PATH}/${categoryId}/${cardId}`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as Card;
}

export async function updateCard({
  signal,
  cardId,
  cardData,
}: {
  signal?: AbortSignal;
  cardId: number;
  cardData: { title: string; content: string };
}) {
  const res = await fetch(`${CARDS_PATH}/${cardId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify(cardData),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as Card;
}

export async function createCard({
  signal,
  categoryId,
  cardData,
}: {
  signal?: AbortSignal;
  categoryId: number;
  cardData: { title: string; content: string };
}) {
  const res = await fetch(`${CATEGORIES_PATH}/${categoryId}/cards`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify(cardData),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as Card;
}
