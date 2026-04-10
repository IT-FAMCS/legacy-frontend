import type { UserInfo } from "../stores/user";

const API_BASE = "/api";

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
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(loginData),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data.token) {
    localStorage.setItem("jwt_token", data.token);
  }
  return data.user as UserInfo;
}

export async function register({
  signal,
  registerData,
}: {
  signal?: AbortSignal;
  registerData: {
    login: string;
    password: string;
    firstName: string;
    lastName: string;
    patronymic?: string;
    department?: string;
    course?: string;
    group?: string;
    hb?: string;
    position?: string;
    role: "admin" | "chairman" | "member" | "guest";
  };
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(registerData),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data.token) {
    localStorage.setItem("jwt_token", data.token);
  }
  return data.user as UserInfo;
}

export async function getUser({ signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch(`${API_BASE}/user/me`, {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as UserInfo;
}

export async function editUser({
  signal,
  userData,
}: {
  signal?: AbortSignal;
  userData: Partial<UserInfo>;
}) {
  const res = await fetch(`${API_BASE}/user/me`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP ${res.status}`);
  }
  return (await res.json()) as UserInfo;
}

export async function logout() {
  localStorage.removeItem("jwt_token");
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return true;
}

export async function getUsers({ signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch(`${API_BASE}/users`, {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as UserInfo[];
}

export async function updateUser({
  signal,
  userId,
  userData,
}: {
  signal?: AbortSignal;
  userId: number;
  userData: Partial<UserInfo>;
}) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    signal,
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP ${res.status}`);
  }
  return (await res.json()) as UserInfo;
}

export async function deactivateUser(userId: number) {
  const res = await fetch(`${API_BASE}/users/${userId}/deactivate`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return true;
}

export async function activateUser(userId: number) {
  const res = await fetch(`${API_BASE}/users/${userId}/activate`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return true;
}
