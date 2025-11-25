import type { UserInfo } from "../stores/user";

const USER_INFO_PATH = "/api/userinfo";

export async function getUser({ signal }: { signal?: AbortSignal } = {}) {
  const res = await fetch(USER_INFO_PATH, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    //status === 401 403 проверять отдельно
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
  const res = await fetch(USER_INFO_PATH, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
    body: JSON.stringify(userInfo),
  });
  if (!res.ok) {
    //status === 401 403 проверять отдельно
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as UserInfo;
}
