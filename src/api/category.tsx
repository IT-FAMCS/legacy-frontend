import type { Category, Card } from "../types/Category";
import { readErrorResponse } from "../utils/api-error";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const CATEGORIES_PATH = `${API_BASE}/api/categories`;
const CARDS_PATH = `${API_BASE}/api/cards`;

function getAuthHeaders() {
  const token = localStorage.getItem("jwt_token");
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function ensureOk(res: Response) {
  if (!res.ok) {
    throw new Error((await readErrorResponse(res)) || `HTTP ${res.status}`);
  }
}

export async function getCategories({ signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch(CATEGORIES_PATH, {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  await ensureOk(res);
  return (await res.json()) as Category[];
}

export async function createCategory({
  signal,
  categoryData,
}: {
  signal?: AbortSignal;
  categoryData: { name: string; description?: string };
}) {
  const res = await fetch(CATEGORIES_PATH, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(categoryData),
  });
  await ensureOk(res);
  return (await res.json()) as Category;
}

export async function updateCategory({
  signal,
  categoryId,
  categoryData,
}: {
  signal?: AbortSignal;
  categoryId: number;
  categoryData: { name: string; description?: string };
}) {
  const res = await fetch(`${CATEGORIES_PATH}/${categoryId}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(categoryData),
  });
  await ensureOk(res);
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
    headers: getAuthHeaders(),
    signal,
  });
  await ensureOk(res);
  return true;
}

export async function getCard({
  signal,
  cardId,
}: {
  signal?: AbortSignal;
  cardId: number;
}) {
  const res = await fetch(`${CARDS_PATH}/${cardId}`, {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  await ensureOk(res);
  return (await res.json()) as Card;
}

export async function updateCard({
  signal,
  cardId,
  cardData,
}: {
  signal?: AbortSignal;
  cardId: number;
  cardData: { title?: string; content?: string; category_id?: number; access_positions?: string; access_logins?: string };
}) {
  const res = await fetch(`${CARDS_PATH}/${cardId}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(cardData),
  });
  await ensureOk(res);
  return (await res.json()) as Card;
}

export async function createCard({
  signal,
  cardData,
}: {
  signal?: AbortSignal;
  cardData: { title: string; content?: string; category_id: number; access_positions?: string; access_logins?: string };
}) {
  const res = await fetch(`${CARDS_PATH}`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(cardData),
  });
  await ensureOk(res);
  return (await res.json()) as Card;
}

export async function getCards({ signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch(`${CARDS_PATH}`, {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  await ensureOk(res);
  return (await res.json()) as Card[];
}

export async function deleteCard({
  signal,
  cardId,
}: {
  signal?: AbortSignal;
  cardId: number;
}) {
  const res = await fetch(`${CARDS_PATH}/${cardId}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  await ensureOk(res);
  return true;
}

export type ActivityLogEntry = {
  id: number;
  user_id: number;
  user_login: string | null;
  user_name: string | null;
  action: "create" | "update" | "delete";
  entity_type: string;
  entity_id: number | null;
  entity_title: string | null;
  details: string | null;
  created_at: string;
};

export async function getCardHistory({
  signal,
  cardId,
}: {
  signal?: AbortSignal;
  cardId: number;
}) {
  const res = await fetch(`${CARDS_PATH}/${cardId}/history`, {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  await ensureOk(res);
  return (await res.json()) as ActivityLogEntry[];
}
