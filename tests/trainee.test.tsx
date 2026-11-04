import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownRenderer } from "../src/components/MarkdownRenderer";
import { getTraineeCards, getTraineeCode, loginTrainee } from "../src/api/trainee";
import { getTraineeToken, setTraineeToken, clearTraineeToken } from "../src/utils/trainee-session";
import { isAdminChairOrDeputy } from "../src/hooks/use-permissions";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}, configurable: true });

test("trainee token is stored separately and cannot remove member credentials", () => {
  localStorage.setItem("jwt_token", "member-token");
  setTraineeToken("guest-token");
  assert.equal(getTraineeToken(), "guest-token");
  clearTraineeToken();
  assert.equal(getTraineeToken(), null);
  assert.equal(localStorage.getItem("jwt_token"), "member-token");
});

test("guest reads send only the trainee token to guest API with caching disabled", async () => {
  setTraineeToken("guest-token");
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/trainee/cards");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer guest-token");
    assert.equal(init?.cache, "no-store");
    return new Response(JSON.stringify([]));
  };
  assert.deepEqual(await getTraineeCards(), []);
});

test("invalid entry code leaves the existing session and page intact", async () => {
  setTraineeToken("guest-token");
  globalThis.fetch = async (_url, init) => {
    assert.equal(new Headers(init?.headers).get("Authorization"), null);
    return new Response(JSON.stringify({ detail: "Неверный код стажёра" }), { status: 401 });
  };
  await assert.rejects(loginTrainee("wrong"), /Неверный код/);
  assert.equal(getTraineeToken(), "guest-token");
});

test("expired guest token is cleared and redirects to trainee login", async () => {
  let redirected = "";
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    location: { replace: (path: string) => { redirected = path; } },
  } });
  setTraineeToken("expired");
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: "Сессия истекла" }), { status: 401 });
  await assert.rejects(getTraineeCards(), /Сессия истекла/);
  assert.equal(getTraineeToken(), null);
  assert.equal(redirected, "/trainee/login?expired=1");
});

test("management requests use member credentials", async () => {
  setTraineeToken("guest-token");
  localStorage.setItem("jwt_token", "member-token");
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/trainee-code");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer member-token");
    return new Response(JSON.stringify({ code: null, updated_at: null }));
  };
  assert.equal((await getTraineeCode()).code, null);
});

test("manager visibility includes admin/chair/deputies and excludes other staff", () => {
  for (const name of ["admin", "админ", "председатель", "председатель студсовета", "заместитель председателя по IT", "зам. председателя", " ADMIN ", " Председатель "])
    assert.equal(isAdminChairOrDeputy(name), true, name);
  for (const name of ["секретарь", "участник", "руководитель отдела", "заместитель руководителя отдела"])
    assert.equal(isAdminChairOrDeputy(name), false, name);
});

test("trainee markdown disables live member lists in paragraphs, spoilers, quotes, lists and tables", () => {
  // No QueryClient provider: mounting DepartmentUserList would throw, even during SSR.
  for (const content of [
    ":::users IT", ":::spoiler Люди\n:::users IT\n:::", "> :::users IT", "- :::users IT",
    "| Люди |\n| --- |\n| :::users IT |",
  ]) {
    const html = renderToStaticMarkup(<MarkdownRenderer content={content} allowUserLists={false} />);
    assert.match(html, /Список участников доступен сотрудникам/);
    assert.doesNotMatch(html, /private-member/);
  }
  const html = renderToStaticMarkup(<MarkdownRenderer content={"# Привет\n\n- [ ] Прочитать"} allowUserLists={false} />);
  assert.match(html, /<h1>Привет<\/h1>/);
  assert.match(html, /readonly=""/i);
});
