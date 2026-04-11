 import type { Category, Card } from "../types/Category";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const CATEGORIES_PATH = `${API_BASE}/api/categories`;
const CARDS_PATH = `${API_BASE}/api/cards`;

/**
 * Extract error message from backend response
 * FastAPI returns different formats:
 * - 422: { detail: [{ type, loc, msg, ... }, ...] }
 * - 400/401/403/404: { detail: "string" }
 */
function extractErrorMessage(errorData: unknown): string {
  if (!errorData || typeof errorData !== "object") return "Неизвестная ошибка";
  
  const data = errorData as Record<string, unknown>;
  
  if (typeof data.detail === "string") {
    return data.detail;
  }
  
  if (Array.isArray(data.detail)) {
    // FastAPI validation errors (422)
    return (data.detail as Array<Record<string, unknown>>)
      .map((err) => {
        const errRecord = err as Record<string, unknown>;
        const loc = errRecord.loc as string[] | undefined;
        const field = loc?.slice(1).join(".") || "Поле";
        const msg = (errRecord.msg as string) || "Неверное значение";
        return `${field}: ${msg}`;
      })
      .join("; ");
  }
  
  if (typeof data.detail === "object" && data.detail !== null) {
    // Some errors return object with nested details
    return JSON.stringify(data.detail);
  }
  
  return "Неизвестная ошибка";
}

function getAuthHeaders() {
  const token = localStorage.getItem("jwt_token");
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getCategories({ signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch(CATEGORIES_PATH, {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }
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
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
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
  categoryData: { name: string; description?: string };
}) {
  const res = await fetch(`${CATEGORIES_PATH}/${categoryId}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(categoryData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
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
    headers: getAuthHeaders(),
    signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
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
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
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
  cardData: { title?: string; content?: string; access_positions?: string; access_logins?: string };
}) {
  const res = await fetch(`${CARDS_PATH}/${cardId}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(cardData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }
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
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as Card;
}

export async function getCards({ signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch(`${CARDS_PATH}`, {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }
  return (await res.json()) as Card[];
}
