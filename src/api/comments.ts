import { readErrorResponse } from "../utils/api-error";
import { apiFetch } from "../utils/api-fetch";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const CARDS_PATH = `${API_BASE}/api/cards`;
const COMMENTS_PATH = `${API_BASE}/api/comments`;

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

export type CardComment = {
  id: number;
  card_id: number;
  author_id: number;
  author_login: string | null;
  author_name: string | null;
  quoted_text: string;
  body: string;
  resolved: boolean;
  resolved_by_name: string | null;
  resolved_at: string | null;
  created_at: string;
};

export async function getCardComments({
  signal,
  cardId,
}: {
  signal?: AbortSignal;
  cardId: number;
}) {
  const res = await apiFetch(`${CARDS_PATH}/${cardId}/comments`, {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  await ensureOk(res);
  return (await res.json()) as CardComment[];
}

export async function createCardComment({
  signal,
  cardId,
  quotedText,
  body,
}: {
  signal?: AbortSignal;
  cardId: number;
  quotedText: string;
  body: string;
}) {
  const res = await apiFetch(`${CARDS_PATH}/${cardId}/comments`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify({ quoted_text: quotedText, body }),
  });
  await ensureOk(res);
  return (await res.json()) as CardComment;
}

export async function updateCardComment({
  signal,
  commentId,
  resolved,
}: {
  signal?: AbortSignal;
  commentId: number;
  resolved: boolean;
}) {
  const res = await apiFetch(`${COMMENTS_PATH}/${commentId}`, {
    method: "PATCH",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify({ resolved }),
  });
  await ensureOk(res);
  return (await res.json()) as CardComment;
}

export async function deleteCardComment({
  signal,
  commentId,
}: {
  signal?: AbortSignal;
  commentId: number;
}) {
  const res = await apiFetch(`${COMMENTS_PATH}/${commentId}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  await ensureOk(res);
  return true;
}
