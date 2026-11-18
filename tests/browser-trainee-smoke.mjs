// Requires a built frontend, Chrome, Node 20 --experimental-websocket and the isolated backend fixture.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve, extname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";

const backend = "http://127.0.0.1:8000";
const origin = "http://127.0.0.1:4173";
const chromePath = process.env.CHROME_BIN || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const directory = await mkdtemp(join(tmpdir(), "legacy-chrome-smoke-"));
const artifacts = resolve(process.env.SMOKE_ARTIFACT_DIR || "../.tools/browser");
await mkdir(artifacts, { recursive: true });
const dist = resolve("dist");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".gif": "image/gif" };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, origin).pathname);
    const file = resolve(dist, "." + pathname);
    if (!file.startsWith(dist)) { response.writeHead(403).end(); return; }
    if (pathname.startsWith("/api/")) {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const result = await fetch(backend + pathname, { method: request.method, headers: request.headers,
        body: chunks.length ? Buffer.concat(chunks) : undefined });
      response.writeHead(result.status, { "Content-Type": "application/json" });
      response.end(Buffer.from(await result.arrayBuffer()));
      return;
    }
    const extension = extname(file);
    const body = await readFile(extension ? file : join(dist, "index.html"));
    response.writeHead(200, { "Content-Type": types[extension || ".html"] || "application/octet-stream" });
    response.end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolveReady => server.listen(4173, "127.0.0.1", resolveReady));

let chrome;
let websocket;
const calls = new Map();
let nextId = 0;
const apiRequests = [];
const runtimeErrors = [];
const delay = ms => new Promise(resolveDelay => setTimeout(resolveDelay, ms));
const command = (method, params = {}) => new Promise((resolveCommand, rejectCommand) => {
  const id = ++nextId;
  const timeout = setTimeout(() => { calls.delete(id); rejectCommand(new Error(`CDP timeout: ${method}`)); }, 15_000);
  calls.set(id, { resolve: result => { clearTimeout(timeout); resolveCommand(result); },
    reject: error => { clearTimeout(timeout); rejectCommand(error); } });
  websocket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const waitFor = async (expression, label) => {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    try { if (await evaluate(`Boolean(${expression})`)) return; } catch { /* Navigation can replace the execution context. */ }
    await delay(100);
  }
  throw new Error(`Timed out: ${label}; body: ${await evaluate("document.body.innerText")}`);
};
const navigate = async path => {
  await command("Page.navigate", { url: origin + path });
  await waitFor("document.readyState === 'complete' && document.querySelector('#root')?.children.length > 0", path);
};
const click = async selector => {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await delay(100);
};
const fill = async (selector, value) => {
  await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)});
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', {bubbles: true})); })()`);
  await delay(50);
};
const memberLogin = async login => {
  await navigate("/login");
  await fill("#login", login);
  await fill("#password", "smoke-password");
  await click("button[type=submit]");
  await waitFor("location.pathname === '/home' && document.querySelector('header')", "member login");
};

try {
  assert.equal((await fetch(backend)).status, 200, "Start tests/serve_trainee_smoke.py first");
  const fixtureLogin = await (await fetch(`${backend}/api/login`, { method: "POST",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login: "admin", password: "smoke-password" }) })).json();
  const initialCode = (await (await fetch(`${backend}/api/trainee-code`, {
    headers: { Authorization: `Bearer ${fixtureLogin.access_token}` },
  })).json()).code;
  assert.ok(initialCode, "The isolated fixture must have a trainee code");
  chrome = spawn(chromePath, ["--headless", "--no-sandbox", "--disable-gpu", "--in-process-gpu",
    "--disable-software-rasterizer", "--no-first-run", "--no-default-browser-check",
    `--user-data-dir=${directory}`, "--remote-debugging-port=9225", "about:blank"],
  { windowsHide: true, stdio: "ignore" });
  let pages;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { pages = await (await fetch("http://127.0.0.1:9225/json/list")).json(); if (pages.length) break; } catch { /* booting */ }
    await delay(100);
  }
  assert.ok(pages?.length, "Chrome DevTools must start");
  websocket = new WebSocket(pages.find(page => page.type === "page").webSocketDebuggerUrl);
  websocket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id && calls.has(message.id)) {
      const pending = calls.get(message.id); calls.delete(message.id);
      if (message.error) pending.reject(new Error(JSON.stringify(message.error))); else pending.resolve(message.result);
    }
    if (message.method === "Network.requestWillBeSent" && message.params.request.url.includes("/api/"))
      apiRequests.push(message.params.request.url);
    if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params.exceptionDetails);
  });
  await new Promise((resolveOpen, rejectOpen) => { websocket.addEventListener("open", resolveOpen); websocket.addEventListener("error", rejectOpen); });
  await command("Page.enable"); await command("Runtime.enable"); await command("Network.enable");
  await command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  await navigate("/login");
  assert.equal(await evaluate("document.querySelector('.trainee-invite').innerText.includes('Я стажёр')"), true);
  await click(".trainee-invite");
  await waitFor("location.pathname === '/trainee/login' && document.querySelector('#trainee-code')", "trainee entry");
  await fill("#trainee-code", "wrong"); await click("button[type=submit]");
  await waitFor("document.body.innerText.includes('Неверный код стажёра')", "wrong code error");
  const guestStart = apiRequests.length;
  await fill("#trainee-code", initialCode); await click("button[type=submit]");
  await waitFor("location.pathname === '/trainee' && document.body.innerText.includes('Привет, стажёр')", "guest knowledge base");
  assert.equal(await evaluate("document.body.innerText.includes('Секретная карточка')"), false);
  assert.equal(await evaluate("!!document.querySelector('header a[href*=account]')"), false);
  assert.equal(await evaluate("document.querySelector('header').innerText.toLowerCase().includes('выйти')"), false);
  assert.equal(await evaluate("!!localStorage.getItem('trainee_token') && !localStorage.getItem('jwt_token')"), true);
  await click(".trainee-card-link");
  await waitFor("document.body.innerText.includes('Список участников доступен активу')", "safe guest Markdown");
  await command("Page.reload");
  await waitFor("document.body.innerText.includes('Список участников доступен активу')", "session survives reload");
  const guestRequests = apiRequests.slice(guestStart);
  assert.equal(guestRequests.every(url => url.includes("/api/trainee/")), true, JSON.stringify(guestRequests));
  assert.equal(runtimeErrors.length, 0, JSON.stringify(runtimeErrors));
  const guestToken = await evaluate("localStorage.getItem('trainee_token')");
  const image = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(join(artifacts, "trainee-card.png"), Buffer.from(image.data, "base64"));

  // A genuine new page proves session storage works without React state from the login.
  await navigate("/trainee");
  await waitFor("document.body.innerText.includes('Привет, стажёр')", "restored session");
  await memberLogin("admin");
  assert.equal(await evaluate("localStorage.getItem('trainee_token')"), null);
  await navigate("/card/1/1");
  for (const expected of [false, true]) {
    await waitFor("Array.from(document.querySelectorAll('button')).some(el => el.innerText === 'Редактировать')", "card loaded");
    await evaluate("Array.from(document.querySelectorAll('button')).find(el => el.innerText === 'Редактировать').click()");
    await waitFor("Array.from(document.querySelectorAll('label')).some(el => el.innerText.includes('Доступна стажёрам'))", "sharing checkbox");
    await evaluate("Array.from(document.querySelectorAll('label')).find(el => el.innerText.includes('Доступна стажёрам')).querySelector('input').click()");
    assert.equal(await evaluate("Array.from(document.querySelectorAll('label')).find(el => el.innerText.includes('Доступна стажёрам')).querySelector('input').checked"), expected);
    await evaluate("Array.from(document.querySelectorAll('button')).find(el => el.innerText === 'Сохранить').click()");
    await waitFor("!Array.from(document.querySelectorAll('button')).some(el => el.innerText === 'Сохранить')", "card sharing saved");
    const saved = await evaluate("fetch('http://127.0.0.1:8000/api/cards/1', {headers: {Authorization: 'Bearer ' + localStorage.getItem('jwt_token')}}).then(r => r.json()).then(card => card.trainee_access)");
    assert.equal(saved, expected);
  }
  await waitFor("document.querySelector('header').innerText.includes('Доступ стажёров')", "admin header link");
  await command("Emulation.setDeviceMetricsOverride", { width: 1024, height: 900, deviceScaleFactor: 1, mobile: false });
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, "Member header must fit a tablet viewport");
  await command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await evaluate("Array.from(document.querySelectorAll('header button')).find(el => el.innerText.includes('Доступ стажёров')).click()");
  await waitFor(`document.querySelector('.trainee-code-output')?.innerText === ${JSON.stringify(initialCode)}`, "manager sees code");
  await evaluate("Array.from(document.querySelectorAll('button')).find(el => el.innerText === 'Сгенерировать новый код').click()");
  await waitFor("document.body.innerText.includes('Да, сменить код')", "rotation confirmation");
  await evaluate("Array.from(document.querySelectorAll('button')).find(el => el.innerText === 'Да, сменить код').click()");
  await waitFor(`document.querySelector('.trainee-code-output')?.innerText !== ${JSON.stringify(initialCode)}`, "rotated code");
  const rotatedCode = await evaluate("document.querySelector('.trainee-code-output').innerText");
  assert.equal(rotatedCode.length, 20);

  // Re-open a saved old guest session: revocation should clear it and redirect.
  await evaluate(`localStorage.removeItem('jwt_token'); localStorage.setItem('trainee_token', ${JSON.stringify(guestToken)});`);
  await navigate("/trainee");
  await waitFor("location.pathname === '/trainee/login' && document.body.innerText.includes('Срок доступа истёк')", "rotated guest session revoked");
  assert.equal(await evaluate("localStorage.getItem('trainee_token')"), null);
  await fill("#trainee-code", rotatedCode); await click("button[type=submit]");
  await waitFor("location.pathname === '/trainee' && document.body.innerText.includes('Привет, стажёр')", "new code accepts guest");

  await command("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, "Guest layout must fit a phone viewport");
  // Sign an expired token with the isolated fixture's public test secret.
  const activeToken = await evaluate("localStorage.getItem('trainee_token')");
  const parts = activeToken.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  payload.exp = Math.floor(Date.now() / 1000) - 60;
  const signingInput = `${parts[0]}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}`;
  const expired = `${signingInput}.${createHmac('sha256', 'local-browser-smoke-test-only').update(signingInput).digest('base64url')}`;
  await evaluate(`localStorage.setItem('trainee_token', ${JSON.stringify(expired)})`);
  await navigate("/trainee");
  await waitFor("location.pathname === '/trainee/login' && document.body.innerText.includes('Срок доступа истёк')", "expired session redirected");
  const loginScreenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(join(artifacts, "trainee-login-mobile.png"), Buffer.from(loginScreenshot.data, "base64"));
  await command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await memberLogin("secretary");
  await waitFor("document.querySelector('header').innerText.includes('Пользователи')", "secretary loaded");
  assert.equal(await evaluate("document.querySelector('header').innerText.includes('Доступ стажёров')"), false);
  await navigate("/trainee-access");
  await waitFor("document.body.innerText.includes('Нет доступа')", "secretary direct page denied");
  assert.equal(runtimeErrors.length, 0, JSON.stringify(runtimeErrors));

  console.log("PASS: trainee button, wrong/correct code, filtered cards, no account/logout, nested user-list privacy, reload, member switching, admin code rotation, revoked/expired session redirect, new code, responsive layouts, secretary denied, no runtime errors.");
} finally {
  for (const pending of calls.values()) pending.reject(new Error("Browser test finished"));
  websocket?.close();
  if (chrome && chrome.exitCode === null) { chrome.kill(); await delay(500); }
  await new Promise(resolveClosed => server.close(resolveClosed));
  await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
