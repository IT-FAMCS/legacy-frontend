import type { UserInfo } from "../stores/user";

const USER_INFO_PATH = "/api/user/info";
const USER_EDIT_PATH = "/api/user/edit";
const USER_LOGIN_PATH = "/api/auth/login";
const USER_LOGOUT_PATH = "/api/auth/logout";
const USER_REGISTER_PATH = "/api/auth/register";
const USER_LIST_PATH = "/api/users/list";
const USER_DEACTIVATE_PATH = "/api/users/deactivate";

export async function getUser({ signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch(USER_INFO_PATH, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as UserInfo;
}

export async function editUser({
  signal,
  userInfo,
}: {
  signal?: AbortSignal;
  userInfo: UserInfo;
}) {
  const res = await fetch(USER_EDIT_PATH, {
    method: "PUT",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify(userInfo),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as UserInfo;
}

export async function login({
  signal,
  login: loginParam,
  password,
}: {
  signal?: AbortSignal;
  login: string;
  password: string;
}) {
  const res = await fetch(USER_LOGIN_PATH, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({ login: loginParam, password }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as UserInfo;
}

export async function logout({ signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch(USER_LOGOUT_PATH, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return true;
}

export async function register({
  signal,
  userData,
}: {
  signal?: AbortSignal;
  userData: {
    login: string;
    password: string;
    firstName: string;
    lastName: string;
    patronymic?: string;
    course?: number;
    group?: number;
    department?: string;
    position: string;
    hb?: string;
    role: string;
  };
}) {
  const res = await fetch(USER_REGISTER_PATH, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as UserInfo;
}

export async function getUsersList({
  signal,
  showInactive = false,
}: {
  signal?: AbortSignal;
  showInactive?: boolean;
} = {}) {
  const res = await fetch(`${USER_LIST_PATH}?showInactive=${showInactive}`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as UserInfo[];
}

export async function deactivateUser({
  signal,
  userId,
}: {
  signal?: AbortSignal;
  userId: number;
}) {
  const res = await fetch(USER_DEACTIVATE_PATH, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as UserInfo;
}
