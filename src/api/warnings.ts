import { apiFetch } from "../utils/api-fetch";
import { readErrorResponse } from "../utils/api-error";

export type WarningAccess = { can_view: boolean; can_manage: boolean };
export type MemberWarning = {
  id: number; user_id: number; reason: string; issued_at: string;
  issued_by: {login: string; name: string}; removed_at: string | null;
  removed_by: {login: string; name: string} | null; removal_reason: string | null;
};
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("jwt_token");
  const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api${path}`, {
    ...init, credentials: "include", cache: "no-store",
    headers: {"Content-Type": "application/json", Accept: "application/json",
      ...(token ? {Authorization: `Bearer ${token}`} : {})},
  });
  if (!response.ok) throw new Error((await readErrorResponse(response)) || `HTTP ${response.status}`);
  return response.json() as Promise<T>;
}
export const getWarningAccess = (signal?: AbortSignal) => request<WarningAccess>("/warnings/permissions", {signal});
export const getWarningCounts = (signal?: AbortSignal) => request<Record<string, number>>("/warnings/counts", {signal});
export const getWarnings = (id: number, signal?: AbortSignal) => request<MemberWarning[]>(`/users/${id}/warnings`, {signal});
export const issueWarning = (id: number, reason: string) => request<MemberWarning>(`/users/${id}/warnings`, {method:"POST",body:JSON.stringify({reason})});
export const removeWarning = (id: number, reason: string) => request<MemberWarning>(`/warnings/${id}/remove`, {method:"POST",body:JSON.stringify({reason})});
