import type { Category } from "../types/Category";
import { apiFetch } from "../utils/api-fetch";
import { readErrorResponse } from "../utils/api-error";
import { clearTraineeToken, getTraineeToken } from "../utils/trainee-session";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export type TraineeCard = {
  id: number;
  title: string;
  content: string | null;
  category_id: number;
  category_name: string | null;
  created_at: string;
};

export type TraineeCodeInfo = { code: string | null; updated_at: string | null };
type Token = { access_token: string; token_type: string; expires_in: number };

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error((await readErrorResponse(response)) || `Ошибка запроса (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function loginTrainee(code: string): Promise<Token> {
  // Entry errors are form errors, not expired sessions. Never redirect on a wrong code.
  const response = await fetch(`${API_BASE}/api/trainee/login`, {
    method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return readJson<Token>(response);
}

async function traineeGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const token = getTraineeToken();
  const response = await fetch(`${API_BASE}/api/trainee/${path}`, {
    signal, cache: "no-store",
    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (response.status === 401) {
    clearTraineeToken();
    // Full navigation also discards every cached guest document.
    window.location.replace("/trainee/login?expired=1");
  }
  return readJson<T>(response);
}

export function getTraineeSession({ signal }: { signal?: AbortSignal } = {}) {
  return traineeGet<{ expires_at: string }>("session", signal);
}

export function getTraineeCards({ signal }: { signal?: AbortSignal } = {}) {
  return traineeGet<TraineeCard[]>("cards", signal);
}

export function getTraineeCategories({ signal }: { signal?: AbortSignal } = {}) {
  return traineeGet<Category[]>("categories", signal);
}

export function getTraineeCard(cardId: number, { signal }: { signal?: AbortSignal } = {}) {
  return traineeGet<TraineeCard>(`cards/${cardId}`, signal);
}

async function manageCode(method: "GET" | "POST", signal?: AbortSignal): Promise<TraineeCodeInfo> {
  const token = localStorage.getItem("jwt_token");
  const response = await apiFetch(`${API_BASE}/api/trainee-code`, {
    method, signal, cache: "no-store",
    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  return readJson<TraineeCodeInfo>(response);
}

export function getTraineeCode({ signal }: { signal?: AbortSignal } = {}) {
  return manageCode("GET", signal);
}

export function rotateTraineeCode() {
  return manageCode("POST");
}
