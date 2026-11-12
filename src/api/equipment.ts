import { apiFetch } from "../utils/api-fetch";
import { readErrorResponse } from "../utils/api-error";

export type EquipmentUser = { id: number; login: string; name: string };
export type EquipmentLocation = { id: number; name: string };
export type EquipmentItem = {
  id: number; name: string; description: string; holder_user: EquipmentUser | null;
  location: EquipmentLocation | null; taken_at: string | null; version: number;
};
export type EquipmentOptions = {
  can_manage: boolean; default_location_id: number;
  users: EquipmentUser[]; locations: EquipmentLocation[];
};
export type EquipmentEvent = {
  id: number; action: "created" | "taken" | "assigned"; actor_name: string; actor_login: string;
  holder_name: string; holder_login: string | null; taken_at: string | null; recorded_at: string;
};
export type EquipmentInput = {
  name: string; description: string; holder_user_id?: number | null;
  location_id?: number | null; taken_at?: string;
};
export class EquipmentApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

async function request<T>(path = "", init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("jwt_token");
  const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/equipment${path}`, {
    ...init, credentials: "include", cache: "no-store",
    headers: { Accept: "application/json", "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!response.ok) throw new EquipmentApiError((await readErrorResponse(response)) || `HTTP ${response.status}`, response.status);
  return response.json() as Promise<T>;
}
export const getEquipment = (signal?: AbortSignal) => request<EquipmentItem[]>("", { signal });
export const getEquipmentOptions = (signal?: AbortSignal) => request<EquipmentOptions>("/options", { signal });
export const getEquipmentHistory = (id: number, signal?: AbortSignal) => request<EquipmentEvent[]>(`/${id}/history`, { signal });
export const createEquipment = (data: EquipmentInput) => request<EquipmentItem>("", { method: "POST", body: JSON.stringify(data) });
export const updateEquipment = (item: EquipmentItem, data: EquipmentInput) => request<EquipmentItem>(`/${item.id}`, {
  method: "PATCH", body: JSON.stringify({ ...data, version: item.version }),
});
export const takeEquipment = (item: EquipmentItem) => request<EquipmentItem>(`/${item.id}/take`, {
  method: "POST", body: JSON.stringify({ version: item.version }),
});
export const createEquipmentLocation = (name: string) => request<EquipmentLocation>("/locations", { method: "POST", body: JSON.stringify({ name }) });
