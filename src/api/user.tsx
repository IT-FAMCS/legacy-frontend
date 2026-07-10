import type { Position } from "../types/Position";
import { readErrorResponse, extractErrorMessage } from "../utils/api-error";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function getAuthHeaders() {
  const token = localStorage.getItem("jwt_token");
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function login({
  signal,
  loginData,
}: {
  signal?: AbortSignal;
  loginData: { login: string; password: string };
}) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify(loginData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem("jwt_token", data.access_token);
  }
  return data;
}

export async function logout() {
  localStorage.removeItem("jwt_token");
  const res = await fetch(`${API_BASE}/api/logout`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }
  return true;
}

export async function getUser({ signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch(`${API_BASE}/api/user/me`, {
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
  const userData = await res.json();
  
  // Backend UserResponse doesn't include position flags directly
  // We need to fetch positions and map the flags based on position_name
  // For now, return user data without flags - permissions will be checked by position name
  return userData;
}

export async function editUser({
  signal,
  userData,
}: {
  signal?: AbortSignal;
  userData: Partial<{
    first_name: string;
    last_name: string;
    middle_name: string;
    birth_date: string;
    course: string;
    group: string;
    department_ids: number[];
    telegram: string;
    login?: string;
    position?: string;
    is_active?: boolean;
    is_deactivated?: boolean;
  }>;
}) {
  // Backend expects PUT /api/user/change/{target_login}
  const targetLogin = userData.login;
  if (!targetLogin) {
    throw new Error("Login is required for editing user");
  }
  
  // Remove login from body - it's in the URL path
  const updateData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(userData)) {
    if (key !== "login" && value !== undefined) {
      updateData[key] = value;
    }
  }
  
  const res = await fetch(`${API_BASE}/api/user/change/${encodeURIComponent(targetLogin)}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(updateData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }
  return await res.json();
}

export async function changeUserPassword({
  signal,
  login,
  newPassword,
}: {
  signal?: AbortSignal;
  login: string;
  newPassword: string;
}) {
  // Backend expects PUT /api/user/change-password/{login} with password in body
  const res = await fetch(`${API_BASE}/api/user/change-password/${encodeURIComponent(login)}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify({
      password: newPassword,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }
  return await res.json();
}


export async function changeOwnPassword({
  signal,
  currentPassword,
  newPassword,
}: {
  signal?: AbortSignal;
  currentPassword: string;
  newPassword: string;
}) {
  const res = await fetch(`${API_BASE}/api/user/me/change-password`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }
  return await res.json();
}

export async function getUsers({
  signal,
  departmentId,
}: {
  signal?: AbortSignal;
  departmentId?: number;
} = {}) {
  const url = departmentId
    ? `${API_BASE}/api/users?department_id=${encodeURIComponent(String(departmentId))}`
    : `${API_BASE}/api/users`;
  const res = await fetch(url, {
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
  return await res.json();
}

export async function registerUser({
  signal,
  userData,
}: {
  signal?: AbortSignal;
  userData: {
    login: string;
    password: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    birth_date?: string;
    course?: string;
    group?: string;
    position: string;
    department_ids?: number[];
    telegram?: string;
  };
}) {
  const res = await fetch(`${API_BASE}/api/register`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }
  return await res.json();
}

export type BulkUserRegisterData = {
  login: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  birth_date?: string;
  course?: string;
  group?: string;
  position: string;
  department_ids?: number[];
  telegram?: string;
};

export async function registerUsersBulk({
  signal,
  users,
}: {
  signal?: AbortSignal;
  users: BulkUserRegisterData[];
}) {
  const res = await fetch(`${API_BASE}/api/register/bulk`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify({ users }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }
  return await res.json();
}

export async function getPositions({ signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch(`${API_BASE}/api/positions`, {
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
  return (await res.json()) as Position[];
}

export async function createPosition({
  signal,
  positionData,
}: {
  signal?: AbortSignal;
  positionData: {
    name: string;
    hierarchy_level?: number;
    can_register_users?: boolean;
    can_edit_categories?: boolean;
    can_delete_categories?: boolean;
    can_edit_cards?: boolean;
    can_delete_cards?: boolean;
    can_edit_any_user?: boolean;
    can_manage_positions?: boolean;
  };
}) {
  const res = await fetch(`${API_BASE}/api/positions`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(positionData),
  });
  if (!res.ok) {
    throw new Error((await readErrorResponse(res)) || `HTTP ${res.status}`);
  }
  return await res.json();
}

export async function updatePosition({
  signal,
  positionId,
  positionData,
}: {
  signal?: AbortSignal;
  positionId: number;
  positionData: Partial<{
    name: string;
    hierarchy_level: number;
    can_register_users: boolean;
    can_edit_categories: boolean;
    can_delete_categories: boolean;
    can_edit_cards: boolean;
    can_delete_cards: boolean;
    can_edit_any_user: boolean;
    can_manage_positions: boolean;
  }>;
}) {
  const res = await fetch(`${API_BASE}/api/positions/${positionId}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(positionData),
  });
  if (!res.ok) {
    throw new Error((await readErrorResponse(res)) || `HTTP ${res.status}`);
  }
  return await res.json();
}

export async function deletePosition({
  signal,
  positionId,
}: {
  signal?: AbortSignal;
  positionId: number;
}) {
  const res = await fetch(`${API_BASE}/api/positions/${positionId}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  if (!res.ok) {
    throw new Error((await readErrorResponse(res)) || `HTTP ${res.status}`);
  }
  return true;
}


export async function deactivateUser({
  signal,
  login,
}: {
  signal?: AbortSignal;
  login: string;
}) {
  const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(login)}/deactivate`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  if (!res.ok) {
    throw new Error((await readErrorResponse(res)) || `HTTP ${res.status}`);
  }
  return await res.json();
}

export async function activateUser({
  signal,
  login,
}: {
  signal?: AbortSignal;
  login: string;
}) {
  const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(login)}/activate`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  if (!res.ok) {
    throw new Error((await readErrorResponse(res)) || `HTTP ${res.status}`);
  }
  return await res.json();
}

export async function getVisitHistory({
  signal,
  type,
  userId,
}: {
  signal?: AbortSignal;
  type: "categories" | "cards";
  userId?: number;
}) {
  // For cards endpoint, user_id query param allows fetching another user's history
  const url = type === "cards" && userId !== undefined
    ? `${API_BASE}/api/visits/${type}?user_id=${userId}`
    : `${API_BASE}/api/visits/${type}`;
    
  const res = await fetch(url, {
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
  return await res.json();
}

// getUserVisitHistory removed - using getVisitHistory for current user
// Backend would need endpoint like /api/visits/cards?user_id=X for other users

export async function getUserCardActivity({
  signal,
  userId,
}: {
  signal?: AbortSignal;
  userId?: number;
}) {
  const url = userId !== undefined
    ? `${API_BASE}/api/activity/cards?user_id=${userId}`
    : `${API_BASE}/api/activity/cards`;

  const res = await fetch(url, {
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
  return await res.json();
}

export async function getUserByLogin({
  signal,
  login,
}: {
  signal?: AbortSignal;
  login: string;
}) {
  const users = await getUsers({ signal });
  const user = users.find((u: { login: string }) => u.login === login);
  if (!user) {
    throw new Error("Пользователь не найден");
  }
  return user;
}

export async function getDepartments({ signal }: { signal?: AbortSignal } = {}) {
  // Backend has dedicated /api/departments endpoint
  const res = await fetch(`${API_BASE}/api/departments`, {
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
  return await res.json();
}

export async function createDepartment({
  signal,
  departmentData,
}: {
  signal?: AbortSignal;
  departmentData: {
    name: string;
    description?: string;
  };
}) {
  const res = await fetch(`${API_BASE}/api/departments`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(departmentData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }
  return await res.json();
}


export async function updateDepartment({
  signal,
  departmentId,
  departmentData,
}: {
  signal?: AbortSignal;
  departmentId: number;
  departmentData: { name?: string; description?: string };
}) {
  const res = await fetch(`${API_BASE}/api/departments/${departmentId}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(departmentData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }
  return await res.json();
}

export async function deleteDepartment({
  signal,
  departmentId,
}: {
  signal?: AbortSignal;
  departmentId: number;
}) {
  const res = await fetch(`${API_BASE}/api/departments/${departmentId}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = extractErrorMessage(errorData) || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }
  return true;
}
