const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function authHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token") || localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse(response: Response) {
  if (response.status === 204) return null;
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw data ?? { detail: response.statusText };
  return data;
}

export async function deleteCard(cardId: number) {
  const response = await fetch(`${API_BASE}/api/cards/${cardId}`, { method: "DELETE", headers: authHeaders() });
  return parseResponse(response);
}

export async function patchCardContent(cardId: number, content: string) {
  const response = await fetch(`${API_BASE}/api/cards/${cardId}/content`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  return parseResponse(response);
}

export async function getDeactivatedUsers() {
  const response = await fetch(`${API_BASE}/api/users/deactivated`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function deactivateUser(login: string) {
  const response = await fetch(`${API_BASE}/api/users/${encodeURIComponent(login)}/deactivate`, {
    method: "PUT",
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function activateUser(login: string) {
  const response = await fetch(`${API_BASE}/api/users/${encodeURIComponent(login)}/activate`, {
    method: "PUT",
    headers: authHeaders(),
  });
  return parseResponse(response);
}
