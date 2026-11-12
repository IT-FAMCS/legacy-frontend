// Requires a built frontend, Chrome, Node 20 --experimental-websocket and the isolated backend fixture.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve, extname, join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

const backend = "http://127.0.0.1:8012";
const origin = "http://127.0.0.1:4174";
const chromePath = process.env.CHROME_BIN || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const directory = await mkdtemp(join(tmpdir(), "legacy-equipment-chrome-"));
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
await new Promise(resolveReady => server.listen(4174, "127.0.0.1", resolveReady));

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
  await evaluate("if (location.protocol === 'http:') localStorage.removeItem('jwt_token')");
  await navigate("/login");
  await fill("#login", login);
  await fill("#password", "smoke-password");
  await click("button[type=submit]");
  await waitFor("location.pathname === '/home' && document.querySelector('header')", "member login");
};


try {
  assert.equal((await fetch(backend)).status, 200, "Start tests/serve_equipment_smoke.py first");
  chrome = spawn(chromePath, ["--headless", "--no-sandbox", "--disable-gpu", "--in-process-gpu",
    "--disable-software-rasterizer", "--no-first-run", "--no-default-browser-check",
    `--user-data-dir=${directory}`, "--remote-debugging-port=9226", "about:blank"],
  { windowsHide: true, stdio: "ignore" });
  let pages;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { pages = await (await fetch("http://127.0.0.1:9226/json/list")).json(); if (pages.length) break; } catch { /* booting */ }
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


  const byText = async text => {
    await evaluate(`Array.from(document.querySelectorAll('button')).find(el => el.innerText === ${JSON.stringify(text)}).click()`);
    await delay(100);
  };
  const setDescription = async text => {
    await evaluate(`(() => { const el = document.querySelector('.equipment-form textarea');
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, ${JSON.stringify(text)});
      el.dispatchEvent(new Event('input', {bubbles:true})); })()`);
  };

  await memberLogin("admin");
  await waitFor("document.querySelector('header').innerText.includes('Должности')", "full management menu loaded");
  await command("Emulation.setDeviceMetricsOverride", { width:1024, height:900, deviceScaleFactor:1, mobile:false });
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, "Full leadership navigation fits tablet viewport");
  await command("Emulation.setDeviceMetricsOverride", { width:1440, height:1000, deviceScaleFactor:1, mobile:false });
  await byText("Оборудка");
  await waitFor("document.body.innerText.includes('Здесь пока нет аппаратуры')", "empty inventory");
  await byText("Добавить предмет");
  await waitFor("document.querySelector('dialog[open] .equipment-form')", "create modal");
  await fill(".equipment-form > input", "Тестовый микрофон");
  await setDescription("Радиосистема для мероприятий");
  await byText("Сохранить");
  await waitFor("!document.querySelector('dialog[open]') && document.querySelector('.equipment-table tbody')?.innerText.includes('в главке')", "created with default storage");
  await byText("Редактировать");
  await waitFor("document.querySelector('.equipment-form')", "edit modal");
  await fill(".equipment-inline input", "на складе");
  await byText("Добавить место");
  await waitFor("document.querySelector('.equipment-selected')?.innerText.includes('на складе')", "new shared location selected");
  await byText("Сохранить");
  await waitFor("!document.querySelector('dialog[open]') && document.querySelector('.equipment-table tbody')?.innerText.includes('на складе')", "saved location");
  await writeFile(join(artifacts, "equipment-desktop.png"), Buffer.from((await command("Page.captureScreenshot", {format:"png"})).data, "base64"));

  await memberLogin("member");
  await byText("Оборудка");
  await waitFor("document.querySelector('.equipment-table tbody')", "member inventory");
  assert.equal(await evaluate("document.body.innerText.includes('Добавить предмет') || document.body.innerText.includes('Редактировать')"), false);
  await byText("Взял предмет");
  await waitFor("document.querySelector('.equipment-feedback')?.innerText.includes('Вы взяли')", "self checkout");
  assert.equal(await evaluate("document.querySelector('.equipment-table a').getAttribute('href')"), "/user/member");
  await byText("История");
  await waitFor("document.querySelector('dialog[open] .equipment-history-table tbody')?.children.length === 3", "complete history visible to member");
  assert.equal(await evaluate("document.querySelector('dialog').innerText.includes('Взятие предмета') && document.querySelector('dialog').innerText.includes('на складе')"), true);
  await command("Input.dispatchKeyEvent", {type:"keyDown", key:"Escape", code:"Escape", windowsVirtualKeyCode:27});
  await command("Input.dispatchKeyEvent", {type:"keyUp", key:"Escape", code:"Escape", windowsVirtualKeyCode:27});
  await waitFor("!document.querySelector('dialog[open]')", "escape closes history");

  await memberLogin("admin");
  await byText("Оборудка");
  await waitFor("document.querySelector('.equipment-table tbody')", "admin inventory");
  await byText("Редактировать");
  await fill(".equipment-form input[type=search]", "admin");
  await waitFor("document.querySelectorAll('.equipment-holder-choice').length === 1", "holder search");
  await click(".equipment-holder-choice");
  await fill(".equipment-form input[type=datetime-local]", "2026-11-10T12:30:00");
  await byText("Сохранить");
  await waitFor("!document.querySelector('dialog[open]') && document.querySelector('.equipment-table a')?.getAttribute('href') === '/user/admin'", "manual assignment saved");
  await byText("История");
  await waitFor("document.querySelector('.equipment-history-table tbody')?.children.length === 4", "history preserved after manual assignment");
  await command("Emulation.setDeviceMetricsOverride", { width:375, height:812, deviceScaleFactor:1, mobile:true });
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, "Page fits phone viewport");
  assert.equal(await evaluate("document.querySelector('dialog').getBoundingClientRect().width <= innerWidth"), true, "History dialog fits phone viewport");
  assert.equal(await evaluate("document.querySelector('dialog').getBoundingClientRect().left > 0"), true, "History dialog is centered with a visible margin");
  await writeFile(join(artifacts, "equipment-history-mobile.png"), Buffer.from((await command("Page.captureScreenshot", {format:"png"})).data, "base64"));
  await byText("Закрыть");
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, "Inventory fits phone viewport");
  await writeFile(join(artifacts, "equipment-mobile.png"), Buffer.from((await command("Page.captureScreenshot", {format:"png"})).data, "base64"));
  assert.equal(runtimeErrors.length, 0, JSON.stringify(runtimeErrors));
  console.log("PASS: create with default storage, add and select shared location, member-only take, profile links, immutable history modal, Escape, search holder, manual dated assignment, mobile layout, no runtime errors.");
} finally {
  for (const pending of calls.values()) pending.reject(new Error("Browser test finished"));
  websocket?.close();
  if (chrome && chrome.exitCode === null) { chrome.kill(); await delay(500); }
  await new Promise(resolveClosed => server.close(resolveClosed));
  assert.equal(resolve(dirname(directory)), resolve(tmpdir()), "Cleanup stays inside temporary root");
  assert.ok(basename(directory).startsWith("legacy-equipment-chrome-"));
  await rm(directory, {recursive:true, force:true, maxRetries:10, retryDelay:200});
}
