import { useUserStore } from "../stores/user";

// Drop-in replacement for `fetch` used by every authenticated api/* call.
// The JWT is valid for 30 days (see legacy-back/AGENT.md) with no refresh
// mechanism — once it expires, every request just starts coming back 401,
// but nothing was previously watching for that, so the app kept rendering
// as if the user were still logged in until they manually hit "Войти".
// Intentionally excluded from the login call itself (api/user.tsx) — a 401
// there means "wrong password", not "session expired", and redirecting away
// mid-login-attempt would wipe the error message before the user sees it.
let redirectingToLogin = false;

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status === 401 && !redirectingToLogin) {
    redirectingToLogin = true;
    useUserStore.getState().logout();
    window.location.href = "/login";
  }

  return res;
}
