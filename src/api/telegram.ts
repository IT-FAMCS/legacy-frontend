import { apiFetch } from '../utils/api-fetch';
import { readErrorResponse } from '../utils/api-error';
export type TelegramIdentity = { telegram_user_id: number; username: string | null; display_name: string | null; linked_at: string };
export type TelegramPending = { id: number; expires_at: string; telegram_user_id: number | null; username: string | null; display_name: string | null };
export type TelegramLinkState = { enabled: boolean; binding: TelegramIdentity | null; pending: TelegramPending | null };
export type TelegramChallenge = { id: number; expires_at: string; url: string };
const API = `${import.meta.env.VITE_API_BASE_URL || ''}/api/telegram/link`;
async function request<T>(path = '', method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const token = localStorage.getItem('jwt_token');
  const response = await apiFetch(API + path, { method, signal, cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) throw new Error((await readErrorResponse(response)) || `Ошибка ${response.status}`);
  return response.json();
}
export const getTelegramLink = (signal?: AbortSignal) => request<TelegramLinkState>('', 'GET', undefined, signal);
export const issueTelegramLink = () => request<TelegramChallenge>('', 'POST');
export const confirmTelegramLink = (challengeId: number) => request<TelegramIdentity>('/confirm', 'POST', { challenge_id: challengeId });
export const unlinkTelegram = () => request<{ unlinked: boolean }>('', 'DELETE');
