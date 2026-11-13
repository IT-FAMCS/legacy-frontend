export type TaskCard = { id: number; title: string };
export type TaskUser = { id: number; name: string; login: string; active: boolean };
export type Task = {
  id: number; title: string; description: string; deadline: string | null;
  created_at: string; updated_at: string; creator_id: number; event_card_id: number | null;
  event: TaskCard | null; departments: TaskCard[]; department_card_ids: number[];
  assignees: TaskUser[]; assignee_ids: number[]; completed: boolean; archived: boolean; version: number;
};
export type TaskOptions = { departments: TaskCard[]; events: TaskCard[]; users: TaskUser[]; can_delete: boolean };
export type TaskInput = Pick<Task, 'title' | 'description' | 'deadline' | 'event_card_id' | 'department_card_ids' | 'assignee_ids'>;
export type TaskHistoryEntry = { id: number; actor_id: number; actor_name: string; action: 'create' | 'update' | 'archive'; created_at: string; before: Task | null; after: Task | null; restricted: boolean };

import { apiFetch } from '../utils/api-fetch';
import { readErrorResponse } from '../utils/api-error';
const API = `${import.meta.env.VITE_API_BASE_URL || ''}/api/tasks`;
export class TaskApiError extends Error { status: number; constructor(message: string, status: number) { super(message); this.name = 'TaskApiError'; this.status = status; } }
async function request<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const token = localStorage.getItem('jwt_token');
  const response = await apiFetch(API + path, { method, signal, credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) throw new TaskApiError((await readErrorResponse(response)) || `Ошибка ${response.status}`, response.status);
  return response.json();
}
export const getTaskOptions = (signal?: AbortSignal) => request<TaskOptions>('/options', 'GET', undefined, signal);
export const getTasks = (cardId?: number, archived = false, signal?: AbortSignal) =>
  request<Task[]>(`?archived=${archived}${cardId === undefined ? '' : '&card_id=' + cardId}`, 'GET', undefined, signal);
export const createTask = (data: TaskInput) => request<Task>('', 'POST', data);
export const updateTask = (id: number, data: Partial<TaskInput> & { version: number; completed?: boolean }) => request<Task>(`/${id}`, 'PATCH', data);
export const archiveTask = (id: number, version: number) => request<Task>(`/${id}`, 'DELETE', { version });
export const getTaskHistory = (id: number, signal?: AbortSignal) => request<TaskHistoryEntry[]>(`/${id}/history`, 'GET', undefined, signal);


export const getTask = (id: number) => request<Task>(`/${id}`);
